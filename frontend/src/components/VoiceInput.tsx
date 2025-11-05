import React, { useState, useRef } from 'react';
import { Button, Modal, Typography, Space, Progress, message } from 'antd';
import { AudioOutlined, LoadingOutlined } from '@ant-design/icons';
import { iflytekASRService } from '../services/iflytek';
import { llmService } from '../services/llm';
import type { VoiceParsedData } from '../types';

const { Text, Paragraph } = Typography;

interface VoiceInputProps {
  visible?: boolean;  // 外部控制可见性
  onResult?: (text: string) => void;  // 识别结果回调
  onCancel?: () => void;  // 取消回调
  loading?: boolean;  // 外部loading状态
  placeholder?: string;  // 提示文本
  // 兼容旧接口
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
  };

  // 开始录音
  const startRecording = async () => {
    try {
      setIsRecording(true);
      setRecognizedText('');
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // 开始录音和识别
      await iflytekASRService.startRecognition(
        (result) => {
          // 收到识别结果 - 智能处理增量和追加
          if (result.text) {
            setRecognizedText((prev) => {
              // 如果当前文本为空，直接使用新文本
              if (!prev) return result.text;
              
              // 如果新文本以前一个文本开头或内容更长，说明是同一句话的增量更新，直接替换
              if (result.text.startsWith(prev) || result.text.length > prev.length + 5) {
                return result.text;
              }
              
              // 否则是新内容（如标点符号或新句子），追加到后面
              return prev + result.text;
            });
          }
          // 如果是最终结果,自动停止录音
          if (result.isFinal) {
            stopRecording();
          }
        },
        (error) => {
          // 识别错误
          console.error('Recognition error:', error);
          message.error('识别失败: ' + error.message);
          stopRecording();
        },
        (status) => {
          console.log('WebSocket status:', status);
        }
      );

    } catch (error) {
      console.error('Start recording error:', error);
      message.error('录音失败: ' + (error as Error).message);
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // 停止录音
  const stopRecording = async () => {
    try {
      setIsRecording(false);
      
      // 停止计时
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // 停止录音
      iflytekASRService.stopRecognition();

    } catch (error) {
      console.error('Stop recording error:', error);
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

        // 调用 LLM 解析语音文本
        const { data, error } = await llmService.parseVoiceText(recognizedText);

        if (error || !data) {
          message.error('解析失败: ' + (error?.message || '未知错误'));
          setIsParsing(false);
          return;
        }

        message.success('解析成功!');
        onParsed(data);
        
        // 关闭模态框
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
          {/* 自定义提示文本 - 在未录音时显示 */}
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
            {!isRecording && !recognizedText && (
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
                {/* 实时显示识别文字 */}
                {recognizedText && (
                  <div style={{ 
                    background: '#f0f0f0', 
                    padding: 12, 
                    borderRadius: 8,
                    minHeight: 60,
                    maxWidth: '520px',  // 限制最大宽度，避免碰到边界
                    textAlign: 'left',
                    marginTop: 16,
                    width: '100%',
                    boxSizing: 'border-box',  // 确保 padding 不会让宽度溢出
                  }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>实时识别:</Text>
                    <Paragraph style={{ 
                      margin: '8px 0 0 0', 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',  // 长词自动换行
                    }}>
                      {recognizedText}
                    </Paragraph>
                  </div>
                )}
              </Space>
            )}

            {!isRecording && recognizedText && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ 
                  background: '#f0f0f0', 
                  padding: 16, 
                  borderRadius: 8,
                  minHeight: 100,
                  textAlign: 'left',
                }}>
                  <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
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

          {/* 使用提示 - 仅在未录音且无提示placeholder时显示默认提示 */}
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
