import React from 'react';
import { Button, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <Title>AI 旅行规划师</Title>
      <Paragraph>智能规划您的完美旅程</Paragraph>
      <Button type="primary" size="large" href="/login">
        开始使用
      </Button>
    </div>
  );
};

export default Home;
