import React from 'react';
import { Card, Typography, Space, Row, Col, Statistic } from 'antd';
import { UserOutlined, AudioOutlined, EnvironmentOutlined, ApiOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const { Title, Paragraph } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  return (
    <div>
      <Title level={2}>欢迎回来!</Title>
      <Paragraph type="secondary">
        您好,{user?.email?.split('@')[0]}!开始规划您的下一段旅程吧。
      </Paragraph>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="我的行程"
              value={0}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总计费用"
              value={0}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待出发"
              value={0}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成"
              value={0}
              suffix="个"
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title="快速开始" style={{ marginTop: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card.Grid 
            hoverable 
            style={{ width: '100%', cursor: 'pointer' }}
            onClick={() => navigate('/itineraries/create')}
          >
            <Space>
              <ApiOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>创建新行程</div>
                <div style={{ fontSize: 12, color: '#999' }}>使用AI智能规划您的旅程</div>
              </div>
            </Space>
          </Card.Grid>

          <Card.Grid 
            hoverable 
            style={{ width: '100%', cursor: 'pointer' }}
            onClick={() => navigate('/itineraries')}
          >
            <Space>
              <UserOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>查看行程</div>
                <div style={{ fontSize: 12, color: '#999' }}>管理您的所有旅行计划</div>
              </div>
            </Space>
          </Card.Grid>
        </Space>
      </Card>

      {/* 测试功能区 */}
      <Card title="开发测试功能" style={{ marginTop: 24 }}>
        <Space wrap>
          <Card.Grid 
            hoverable 
            style={{ width: 200, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/voice-test')}
          >
            <AudioOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
            <div>语音识别测试</div>
          </Card.Grid>

          <Card.Grid 
            hoverable 
            style={{ width: 200, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/map-test')}
          >
            <EnvironmentOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
            <div>地图功能测试</div>
          </Card.Grid>

          <Card.Grid 
            hoverable 
            style={{ width: 200, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/dashscope-test')}
          >
            <ApiOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
            <div>AI对话测试</div>
          </Card.Grid>
        </Space>
      </Card>
    </div>
  );
};

export default Dashboard;
