import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  List,
  Tag,
  Divider,
  Progress,
  message,
} from 'antd';
import {
  AudioOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import {
  iflytekASRService,
  IFlyTekASRService,
  WebSocketStatus,
  type RecognitionResult,
  type RecognitionError,
} from '../services/iflytek';

const { Title, Text, Paragraph } = Typography;

interface RecognitionRecord {
  id: number;
  text: string;
  isFinal: boolean;
  timestamp: string;
  confidence?: number;
}

const VoiceTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>(
    WebSocketStatus.CLOSED
  );
  const [records, setRecords] = useState<RecognitionRecord[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [errorInfo, setErrorInfo] = useState<RecognitionError | null>(null);

  // 检查浏览器支持 - 使用静态方法
  const isSupported = IFlyTekASRService.isSupported();

  // 检查 API 配置
  const isConfigured =
    import.meta.env.VITE_IFLYTEK_APP_ID &&
    import.meta.env.VITE_IFLYTEK_API_KEY &&
    import.meta.env.VITE_IFLYTEK_API_SECRET;

  const handleStartRecording = async () => {
    setErrorInfo(null);
    setCurrentText('');
    setIsRecording(true);

    try {
      await iflytekASRService.startRecognition(
        (result: RecognitionResult) => {
          console.log('识别结果:', result);
          
          // 科大讯飞返回的 text 已经是累积的完整结果，直接使用即可
          setCurrentText(result.text);

          if (result.isFinal) {
            // 保存完整的识别记录
            const record: RecognitionRecord = {
              id: Date.now(),
              text: result.text,
              isFinal: true,
              timestamp: new Date().toLocaleTimeString('zh-CN'),
              confidence: result.confidence,
            };
            setRecords((prev) => [record, ...prev]);
            setCurrentText('');
            message.success('识别完成');
          }
        },
        (error: RecognitionError) => {
          console.error('识别错误:', error);
          setErrorInfo(error);
          setIsRecording(false);
          message.error(`识别失败: ${error.message}`);
        },
        (status: WebSocketStatus) => {
          console.log('连接状态:', status);
          setConnectionStatus(status);
          if (status === WebSocketStatus.CLOSED) {
            setIsRecording(false);
          }
        }
      );
    } catch (error) {
      console.error('启动失败:', error);
      setIsRecording(false);
      message.error('启动录音失败');
    }
  };

  const handleStopRecording = () => {
    iflytekASRService.stopRecognition();
    setIsRecording(false);
    message.info('已停止录音');
  };

  const clearRecords = () => {
    setRecords([]);
    setCurrentText('');
    setErrorInfo(null);
    message.success('已清除记录');
  };

  const getStatusTag = () => {
    switch (connectionStatus) {
      case WebSocketStatus.OPEN:
        return <Tag color="success">已连接</Tag>;
      case WebSocketStatus.CONNECTING:
        return <Tag color="processing">连接中...</Tag>;
      case WebSocketStatus.CLOSING:
        return <Tag color="warning">关闭中...</Tag>;
      case WebSocketStatus.CLOSED:
        return <Tag color="default">未连接</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ maxWidth: '95%', width: '100%', margin: '0 auto' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={2}>
                <ApiOutlined /> 科大讯飞语音识别测试
              </Title>
              <Text type="secondary">Task 1.3: 测试科大讯飞 WebSocket 实时语音识别 API</Text>
            </div>

            <Divider />

          {/* 环境检查 */}
          <Card type="inner" title="环境检查">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>浏览器支持:</Text>
                {isSupported ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    支持
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error">
                    不支持
                  </Tag>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>API 配置:</Text>
                {isConfigured ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    已配置
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error">
                    未配置
                  </Tag>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>连接状态:</Text>
                {getStatusTag()}
              </div>
            </Space>
          </Card>

          {!isSupported && (
            <Alert
              message="浏览器不支持"
              description="您的浏览器不支持语音识别功能。请使用 Chrome、Edge 或 Firefox 最新版本。"
              type="error"
              showIcon
            />
          )}

          {!isConfigured && (
            <Alert
              message="API 未配置"
              description="请在 .env 文件中配置科大讯飞 API 密钥（VITE_IFLYTEK_APP_ID、VITE_IFLYTEK_API_KEY、VITE_IFLYTEK_API_SECRET）"
              type="warning"
              showIcon
            />
          )}

          {errorInfo && (
            <Alert
              message={`错误 ${errorInfo.code}`}
              description={errorInfo.message}
              type="error"
              showIcon
              closable
              onClose={() => setErrorInfo(null)}
            />
          )}

          {/* 控制按钮 */}
          <Card type="inner">
            <Space size="large" wrap>
              <Button
                type="primary"
                size="large"
                icon={<AudioOutlined />}
                onClick={handleStartRecording}
                disabled={!isSupported || !isConfigured || isRecording}
                loading={connectionStatus === WebSocketStatus.CONNECTING}
              >
                开始录音
              </Button>
              <Button
                danger
                size="large"
                icon={<StopOutlined />}
                onClick={handleStopRecording}
                disabled={!isRecording}
              >
                停止录音
              </Button>
              <Button onClick={clearRecords} disabled={records.length === 0}>
                清除记录
              </Button>
            </Space>
          </Card>

          {/* 实时识别结果 */}
          {isRecording && (
            <Card type="inner" title="实时识别中...">
              <Progress percent={100} status="active" showInfo={false} />
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  minHeight: '60px',
                }}
              >
                <Text strong style={{ fontSize: '16px' }}>
                  {currentText || '请说话...'}
                </Text>
              </div>
            </Card>
          )}

          {/* 识别记录 */}
          <Card type="inner" title={`识别记录 (${records.length})`}>
            {records.length === 0 ? (
              <Text type="secondary">暂无识别记录</Text>
            ) : (
              <List
                dataSource={records}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text>{item.text}</Text>
                          {item.confidence && (
                            <Tag color="blue">置信度: {item.confidence.toFixed(2)}</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Text type="secondary">时间: {item.timestamp}</Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* 使用说明 */}
          <Card type="inner" title="使用说明">
            <Paragraph>
              <Text strong>测试步骤：</Text>
              <ol>
                <li>确保浏览器支持语音输入（Chrome、Edge、Firefox 最新版本）</li>
                <li>确保已在 .env 文件中配置科大讯飞 API 密钥</li>
                <li>点击"开始录音"按钮，允许浏览器访问麦克风</li>
                <li>对着麦克风说话，实时查看识别结果</li>
                <li>说话结束后自动完成识别，或点击"停止录音"</li>
              </ol>
            </Paragraph>
            <Paragraph>
              <Text strong>技术实现：</Text>
              <ul>
                <li>WebSocket 实时语音传输</li>
                <li>16kHz 采样率，单声道</li>
                <li>支持中文普通话识别</li>
                <li>自动语音端点检测 (VAD)</li>
                <li>HMAC-SHA256 签名鉴权</li>
              </ul>
            </Paragraph>
          </Card>
        </Space>
        </Card>
      </div>
    </div>
  );
};

export default VoiceTest;
