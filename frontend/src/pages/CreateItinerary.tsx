import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const CreateItinerary: React.FC = () => {
  return (
    <div>
      <Title level={2}>创建行程</Title>
      <Card>
        <Paragraph>
          行程创建功能正在开发中...
        </Paragraph>
        <Paragraph type="secondary">
          这里将提供语音输入、表单填写等方式来创建您的旅行计划。
        </Paragraph>
      </Card>
    </div>
  );
};

export default CreateItinerary;
