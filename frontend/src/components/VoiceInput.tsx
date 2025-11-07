import React, { useState, useRef } from 'react';
import { Button, Modal, Typography, Space, Progress, message } from 'antd';
import { AudioOutlined, LoadingOutlined } from '@ant-design/icons';
import { iflytekFileASR } from '../services/iflytekFile';
import { llmService } from '../services/llm';
import type { VoiceParsedData } from '../types';

const { Text, Paragraph } = Typography;

interface VoiceInputProps {
  visible?: boolean;
  onResult?: (text: string) => void;
  onCancel?: () => void;
  loading?: boolean;
  placeholder?: string;
  onParsed?: (data: VoiceParsedData) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  visible: externalVisible,
  onResult,
  onCancel,
  loading: externalLoading,
  placeholder,
  onParsed,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 兼容外部控制和内部控制两种模式
  const visible = externalVisible !== undefined ? externalVisible : isModalOpen;
  const loading = externalLoading !== undefined ? externalLoading : isParsing;

  // 打开录音模态框
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setRecognizedText('');
    setRecordingTime(0);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    if (isRecording) {
      stopRecording();
    }
    if (onCancel) {
      onCancel();
    }
    setIsModalOpen(false);
    setRecognizedText('');
    setRecordingTime(0);
    setRecognitionProgress(0); // 重置识别进度
  };

  // 开始录音 - 使用 MediaRecorder
  const startRecording = async () => {
    try {
      // 重置状态,允许重新录音
      setRecognitionProgress(0);
      setRecognizedText('');
      
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsRecording(true);
      audioChunksRef.current = [];

      // 创建 MediaRecorder 实例
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // 收集音频数据
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 录音停止时处理
      mediaRecorder.onstop = async () => {
        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop());

        // 合并音频数据
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // 转换为 File 对象
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        
        // 发送到讯飞进行识别
        await recognizeAudio(audioFile);
      };

      // 开始录音
      mediaRecorder.start();

      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      message.success('开始录音...');

    } catch (error) {
      console.error('Start recording error:', error);
      message.error('录音失败: ' + (error as Error).message);
      setIsRecording(false);
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    
    // 停止计时
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    message.info('正在识别...');
  };

  // 识别音频
  const recognizeAudio = async (audioFile: File) => {
    try {
      setRecognitionProgress(0);

      await iflytekFileASR.recognizeFile(
        audioFile,
        (result) => {
          // 收到识别结果
          if (result.text) {
            setRecognizedText((prev) => {
              if (!prev) return result.text;
              if (result.text.startsWith(prev) || result.text.length > prev.length + 5) {
                return result.text;
              }
              return prev + result.text;
            });
          }
          
          if (result.isFinal) {
            message.success('识别完成!');
            setRecognitionProgress(100);
          }
        },
        (error) => {
          console.error('Recognition error:', error);
          message.error('识别失败: ' + error.message);
          setRecognitionProgress(0);
        },
        (progress) => {
          setRecognitionProgress(progress);
        }
      );

    } catch (error) {
      console.error('Recognition error:', error);
      message.error('识别失败');
    }
  };

  // 确认并解析
  const handleConfirm = async () => {
    if (!recognizedText.trim()) {
      message.warning('请先录音');
      return;
    }

    try {
      // 如果有onResult回调，直接返回识别文本
      if (onResult) {
        onResult(recognizedText);
        handleCloseModal();
        return;
      }

      // 否则使用LLM解析（兼容旧接口）
      if (onParsed) {
        setIsParsing(true);

        const { data, error } = await llmService.parseVoiceText(recognizedText);

        if (error || !data) {
          message.error('解析失败: ' + (error?.message || '未知错误'));
          setIsParsing(false);
          return;
        }

        message.success('解析成功!');
        onParsed(data);
        
        setTimeout(() => {
          setIsParsing(false);
          handleCloseModal();
        }, 500);
      }

    } catch (error) {
      console.error('Parse error:', error);
      message.error('解析失败,请重试');
      setIsParsing(false);
    }
  };

  // 格式化录音时长
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* 仅当非外部控制时显示按钮 */}
      {externalVisible === undefined && (
        <Button
          icon={<AudioOutlined />}
          onClick={handleOpenModal}
          block
          size="large"
        >
          点击录音
        </Button>
      )}

      <Modal
        title="语音输入"
        open={visible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="cancel" onClick={handleCloseModal}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirm}
            disabled={!recognizedText.trim() || loading}
            loading={loading}
          >
            确认并填充
          </Button>,
        ]}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          {/* 自定义提示文本 */}
          {placeholder && !isRecording && !recognizedText && (
            <div style={{ 
              marginBottom: 16, 
              padding: 12, 
              background: '#e6f7ff', 
              borderRadius: 8,
              border: '1px solid #91d5ff'
            }}>
              <Text type="secondary">
                <strong>💡 提示：</strong>{placeholder}
              </Text>
            </div>
          )}

          {/* 录音状态 */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            {!isRecording && !recognizedText && recognitionProgress === 0 && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <AudioOutlined style={{ fontSize: 64, color: '#1890ff' }} />
                <Text type="secondary">点击下方按钮开始录音</Text>
              </Space>
            )}

            {isRecording && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <LoadingOutlined style={{ fontSize: 64, color: '#52c41a' }} />
                <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                  {formatTime(recordingTime)}
                </Text>
                <Text type="secondary">正在录音中...</Text>
              </Space>
            )}

            {!isRecording && recognitionProgress > 0 && recognitionProgress < 100 && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <LoadingOutlined style={{ fontSize: 64, color: '#1890ff' }} />
                <Text type="secondary">正在识别中...</Text>
                <Progress percent={recognitionProgress} status="active" />
                {recognizedText && (
                  <div style={{ 
                    background: '#f0f0f0', 
                    padding: 12, 
                    borderRadius: 8,
                    minHeight: 60,
                    maxHeight: 200,
                    overflow: 'auto',
                    textAlign: 'left',
                    marginTop: 16,
                    boxSizing: 'border-box',
                  }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>识别中:</Text>
                    <Paragraph style={{ 
                      margin: '8px 0 0 0', 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {recognizedText}
                    </Paragraph>
                  </div>
                )}
              </Space>
            )}

            {!isRecording && recognizedText && recognitionProgress === 100 && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ 
                  background: '#f0f0f0', 
                  padding: 16, 
                  borderRadius: 8,
                  minHeight: 100,
                  maxHeight: 300,
                  overflow: 'auto',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                }}>
                  <Paragraph style={{ 
                    margin: 0, 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {recognizedText}
                  </Paragraph>
                </div>
                <Text type="secondary">识别完成，确认后将自动填充表单</Text>
              </Space>
            )}
          </div>

          {/* 录音按钮 */}
          <div style={{ textAlign: 'center' }}>
            {!isRecording ? (
              <Button
                type="primary"
                size="large"
                icon={<AudioOutlined />}
                onClick={startRecording}
                disabled={isParsing}
              >
                {recognizedText ? '重新录音' : '开始录音'}
              </Button>
            ) : (
              <Button
                danger
                size="large"
                onClick={stopRecording}
              >
                停止录音并识别
              </Button>
            )}
          </div>

          {/* 解析进度 */}
          {isParsing && (
            <div style={{ marginTop: 24 }}>
              <Text type="secondary">正在解析语音内容...</Text>
              <Progress percent={100} status="active" showInfo={false} />
            </div>
          )}

          {/* 使用提示 */}
          {!placeholder && !isRecording && !recognizedText && (
            <div style={{ marginTop: 24, padding: 12, background: '#f6f6f6', borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <strong>使用提示:</strong> 您可以说"我想去北京玩5天，预算1万元，喜欢历史文化和美食"等，系统会自动识别并填充表单。
              </Text>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default VoiceInput;
