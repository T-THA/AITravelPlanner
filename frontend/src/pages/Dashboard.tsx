import React, { useEffect, useState } from 'react';
import { Card, Typography, Space, Row, Col, Statistic, Spin } from 'antd';
import { UserOutlined, AudioOutlined, EnvironmentOutlined, ApiOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { tripService } from '../services/trip';
import { expenseService } from '../services/expense';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalExpenses: 0,
    upcomingTrips: 0,
    completedTrips: 0,
  });

  // 加载统计数据
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      // 获取所有行程
      const { data: trips } = await tripService.getUserTrips();
      
      if (trips) {
        const now = dayjs();
        
        // 统计行程数量
        const totalTrips = trips.length;
        
        // 统计待出发（开始日期在未来）
        const upcomingTrips = trips.filter(trip => 
          dayjs(trip.start_date).isAfter(now)
        ).length;
        
        // 统计已完成（结束日期在过去，或状态为archived）
        const completedTrips = trips.filter(trip => 
          dayjs(trip.end_date).isBefore(now) || trip.status === 'archived'
        ).length;
        
        // 计算总费用（遍历所有行程获取费用）
        let totalExpenses = 0;
        for (const trip of trips) {
          const expenses = await expenseService.getExpenses({
            trip_id: trip.id,
          });
          if (expenses && expenses.length > 0) {
            totalExpenses += expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
          }
        }
        
        setStats({
          totalTrips,
          totalExpenses,
          upcomingTrips,
          completedTrips,
        });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>欢迎回来!</Title>
      <Paragraph type="secondary">
        您好,{user?.email?.split('@')[0]}!开始规划您的下一段旅程吧。
      </Paragraph>

      {/* 统计卡片 */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="我的行程"
                value={stats.totalTrips}
                suffix="个"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总计费用"
                value={stats.totalExpenses}
                precision={2}
                prefix="¥"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="待出发"
                value={stats.upcomingTrips}
                suffix="个"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已完成"
                value={stats.completedTrips}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>
      </Spin>

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
