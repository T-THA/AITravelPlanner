import React from 'react';
import { Card, Typography, Empty } from 'antd';

const { Title } = Typography;

const ExpenseManagement: React.FC = () => {
  return (
    <div>
      <Title level={2}>费用管理</Title>
      <Card>
        <Empty
          description="费用管理功能开发中"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};

export default ExpenseManagement;
