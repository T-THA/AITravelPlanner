import React, { useState, useEffect } from 'react';
import { Modal, Progress, Spin, Typography, Space } from 'antd';
import { LoadingOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ItineraryGeneratingProps {
  open: boolean;
  onCancel: () => void;
}

const ItineraryGenerating: React.FC<ItineraryGeneratingProps> = ({ open, onCancel }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('正在分析您的需求...');
  const [elapsedTime, setElapsedTime] = useState(0);

  // 模拟进度更新
  useEffect(() => {
    if (!open) {
      setProgress(0);
      setStatusText('正在分析您的需求...');
      setElapsedTime(0);
      return;
    }

    // 进度阶段
    const stages = [
      { progress: 20, text: '正在分析您的需求...', duration: 3000 },
      { progress: 40, text: '正在搜索目的地信息...', duration: 5000 },
      { progress: 60, text: '正在规划行程路线...', duration: 8000 },
      { progress: 80, text: '正在优化景点安排...', duration: 12000 },
      { progress: 95, text: '正在生成详细行程...', duration: 18000 },
    ];

    let currentStageIndex = 0;
    let stageTimer: ReturnType<typeof setTimeout>;

    const updateStage = () => {
      if (currentStageIndex < stages.length) {
        const stage = stages[currentStageIndex];
        setProgress(stage.progress);
        setStatusText(stage.text);
        currentStageIndex++;
        
        if (currentStageIndex < stages.length) {
          const nextStageDuration = stages[currentStageIndex].duration - stage.duration;
          stageTimer = setTimeout(updateStage, nextStageDuration);
        }
      }
    };

    // 开始第一阶段
    updateStage();

    // 计时器
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(stageTimer);
      clearInterval(timeInterval);
    };
  }, [open]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 估计剩余时间
  const estimatedTotal = 25; // 预计总时间 25 秒
  const remainingTime = Math.max(0, estimatedTotal - elapsedTime);

  return (
    <Modal
      open={open}
      title={null}
      footer={null}
      onCancel={onCancel}
      closable={true}
      maskClosable={false}
      width={500}
      centered
    >
      <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px 0' }}>
        {/* 加载图标 */}
        <div style={{ textAlign: 'center' }}>
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            size="large"
          />
        </div>

        {/* 标题 */}
        <Title level={4} style={{ textAlign: 'center', margin: 0 }}>
          AI 正在为您生成行程
        </Title>

        {/* 进度条 */}
        <Progress
          percent={progress}
          status="active"
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />

        {/* 状态文字 */}
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">{statusText}</Text>
        </div>

        {/* 时间信息 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 20px',
          }}
        >
          <Space>
            <ClockCircleOutlined />
            <Text type="secondary">已用时: {formatTime(elapsedTime)}</Text>
          </Space>
          <Space>
            <Text type="secondary">预计剩余: {formatTime(remainingTime)}</Text>
          </Space>
        </div>

        {/* 提示文字 */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            生成过程通常需要 20-30 秒，请耐心等待...
          </Text>
        </div>
      </Space>
    </Modal>
  );
};

export default ItineraryGenerating;
