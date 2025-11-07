import React, { useState } from 'react';
import { Card, Typography, Space, Button, Divider, Alert } from 'antd';
import { AudioOutlined } from '@ant-design/icons';
import VoiceInput from '../components/VoiceInput';

const { Title, Paragraph, Text } = Typography;

const VoiceTest: React.FC = () => {
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [testCount, setTestCount] = useState(0);

  const handleVoiceResult = (text: string) => {
    setRecognizedText(text);
    setTestCount(prev => prev + 1);
    console.log('识别结果:', text);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card>
          <Title level={2}><AudioOutlined /> 语音识别测试页面</Title>
          
          <Alert
            message="测试说明"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>点击下方"开始语音测试"按钮</li>
                <li>在弹出的对话框中点击"开始录音"</li>
                <li>说话 5-15 秒后点击"停止录音并识别"</li>
                <li>检查文本框是否超出弹窗边界</li>
                <li>点击"重新录音"验证可以多次使用</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              icon={<AudioOutlined />}
              onClick={() => setVoiceModalVisible(true)}
            >
              开始语音测试
            </Button>

            <Divider />

            <div>
              <Title level={4}>测试统计</Title>
              <Paragraph>
                <Text strong>测试次数: </Text>
                <Text type="success" style={{ fontSize: 20 }}>{testCount}</Text>
              </Paragraph>
            </div>

            {recognizedText && (
              <>
                <Divider />
                <div>
                  <Title level={4}>最近识别结果</Title>
                  <Card style={{ background: '#fafafa', maxHeight: 400, overflow: 'auto' }}>
                    <Paragraph style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                      {recognizedText}
                    </Paragraph>
                  </Card>
                </div>
              </>
            )}
          </Space>
        </Card>

        <VoiceInput
          visible={voiceModalVisible}
          onResult={handleVoiceResult}
          onCancel={() => setVoiceModalVisible(false)}
          placeholder="请说出您的旅行计划"
        />
      </div>
    </div>
  );
};

export default VoiceTest;
