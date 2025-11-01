import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: '50px' }}>
      <Title>控制面板</Title>
      <p>欢迎使用 AI 旅行规划师！</p>
    </div>
  );
};

export default Dashboard;
