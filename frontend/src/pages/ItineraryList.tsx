import React, { useState, useEffect } from 'react';
import { Card, Empty, Button, List, Tag, Space, Typography, message, Spin, Popconfirm } from 'antd';
import {
  PlusOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  UserOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { tripService } from '../services/trip';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  travelers_count: number;
  status: string;
  created_at: string;
  itinerary?: any;
}

const ItineraryList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);

  // 加载行程列表
  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const { data, error } = await tripService.getUserTrips();
      
      if (error) {
        message.error('加载行程列表失败: ' + error.message);
        return;
      }

      setTrips(data || []);
    } catch (error) {
      console.error('Load trips error:', error);
      message.error('加载行程列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除行程
  const handleDelete = async (tripId: string) => {
    try {
      const { error } = await tripService.deleteTrip(tripId);
      
      if (error) {
        message.error('删除失败: ' + error.message);
        return;
      }

      message.success('删除成功');
      loadTrips(); // 重新加载列表
    } catch (error) {
      console.error('Delete trip error:', error);
      message.error('删除失败');
    }
  };

  // 查看详情
  const handleView = (tripId: string) => {
    navigate(`/itineraries/${tripId}`);
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      generated: { color: 'blue', text: '已生成' },
      in_progress: { color: 'orange', text: '进行中' },
      completed: { color: 'green', text: '已完成' },
      archived: { color: 'default', text: '已归档' },
    };

    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 计算天数
  const calculateDays = (startDate: string, endDate: string) => {
    return dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>我的行程</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/itineraries/create')}>
          创建新行程
        </Button>
      </div>

      {trips.length === 0 ? (
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
      ) : (
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 1,
            md: 2,
            lg: 2,
            xl: 3,
            xxl: 3,
          }}
          dataSource={trips}
          renderItem={(trip) => (
            <List.Item>
              <Card
                hoverable
                actions={[
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handleView(trip.id)}
                    key="view"
                  >
                    查看详情
                  </Button>,
                  <Popconfirm
                    title="确定要删除这个行程吗？"
                    description="删除后无法恢复"
                    onConfirm={() => handleDelete(trip.id)}
                    okText="确定"
                    cancelText="取消"
                    key="delete"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {/* 标题和状态 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 16 }}>
                      {trip.title}
                    </Text>
                    {getStatusTag(trip.status)}
                  </div>

                  {/* 行程信息 */}
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space>
                      <EnvironmentOutlined style={{ color: '#1890ff' }} />
                      <Text type="secondary">{trip.destination}</Text>
                    </Space>

                    <Space>
                      <CalendarOutlined style={{ color: '#1890ff' }} />
                      <Text type="secondary">
                        {dayjs(trip.start_date).format('YYYY-MM-DD')} 至{' '}
                        {dayjs(trip.end_date).format('YYYY-MM-DD')}
                      </Text>
                      <Tag>{calculateDays(trip.start_date, trip.end_date)} 天</Tag>
                    </Space>

                    <Space>
                      <UserOutlined style={{ color: '#1890ff' }} />
                      <Text type="secondary">{trip.travelers_count} 人</Text>
                    </Space>

                    <Space>
                      <DollarOutlined style={{ color: '#1890ff' }} />
                      <Text type="secondary">预算 ¥{trip.budget}</Text>
                    </Space>
                  </Space>

                  {/* 创建时间 */}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      创建于 {dayjs(trip.created_at).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </div>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default ItineraryList;
