import React from 'react';
import { Card, Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const ItineraryList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>我的行程</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/itineraries/create')}>
          创建新行程
        </Button>
      </div>
      
      <Card>
        <Empty
          description="您还没有创建任何行程"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate('/itineraries/create')}>
            立即创建
          </Button>
        </Empty>
      </Card>
    </div>
  );
};

export default ItineraryList;
