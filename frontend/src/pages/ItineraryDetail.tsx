import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Space,
  Button,
  Descriptions,
  Timeline,
  Tag,
  Spin,
  message,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { tripService } from '../services/trip';
import ItineraryMap from '../components/ItineraryMap';
import type { GeneratedItinerary, ItineraryItem } from '../types';

const { Title, Text, Paragraph } = Typography;

const ItineraryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<any>(null);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);

  // 加载行程数据
  useEffect(() => {
    if (!id) {
      message.error('行程 ID 缺失');
      navigate('/itineraries');
      return;
    }

    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    setLoading(true);
    try {
      const { data, error } = await tripService.getTripById(id!);

      if (error || !data) {
        message.error('加载行程失败: ' + (error?.message || '未知错误'));
        navigate('/itineraries');
        return;
      }

      setTrip(data);
      setItinerary(data.itinerary as GeneratedItinerary);
    } catch (error) {
      console.error('Load trip error:', error);
      message.error('加载行程失败');
      navigate('/itineraries');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!trip || !itinerary) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Text type="secondary">行程数据不存在</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* 顶部标题栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 返回按钮 + 标题 */}
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/itineraries')}
            >
              返回列表
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              {itinerary.trip_title}
            </Title>
          </Space>

          {/* 行程概要 */}
          <Paragraph type="secondary" style={{ fontSize: 16, margin: 0 }}>
            {itinerary.summary}
          </Paragraph>

          {/* 行程亮点 */}
          <div>
            <Text strong>行程亮点: </Text>
            {itinerary.highlights.map((highlight, index) => (
              <Tag color="blue" key={index} style={{ marginBottom: 8 }}>
                {highlight}
              </Tag>
            ))}
          </div>

          {/* 基本信息 */}
          <Descriptions column={4}>
            <Descriptions.Item
              label={
                <>
                  <EnvironmentOutlined /> 目的地
                </>
              }
            >
              {trip.destination}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <>
                  <CalendarOutlined /> 日期
                </>
              }
            >
              {trip.start_date} 至 {trip.end_date}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <>
                  <UserOutlined /> 人数
                </>
              }
            >
              {trip.travelers_count} 人
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <>
                  <DollarOutlined /> 预算
                </>
              }
            >
              ¥{trip.budget}
            </Descriptions.Item>
          </Descriptions>

          {/* 操作按钮 */}
          <Space>
            <Button type="primary" icon={<EditOutlined />}>
              编辑行程
            </Button>
            <Button icon={<ShareAltOutlined />}>分享</Button>
          </Space>
        </Space>
      </Card>

      {/* 主内容区域: 左侧时间线 + 右侧地图 */}
      <Row gutter={16}>
        {/* 左侧: 每日行程时间线 */}
        <Col xs={24} lg={14}>
          <Card title="每日行程" style={{ minHeight: 600 }}>
            <Timeline mode="left">
              {itinerary.daily_itinerary.map((day, index) => (
                <Timeline.Item
                  key={index}
                  label={
                    <Space direction="vertical" size={0}>
                      <Text strong>Day {day.day}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {day.date}
                      </Text>
                    </Space>
                  }
                  color="blue"
                >
                  <Card
                    size="small"
                    title={
                      <Space>
                        <ClockCircleOutlined />
                        <Text strong>{day.theme}</Text>
                      </Space>
                    }
                    style={{ marginBottom: 16 }}
                  >
                    {day.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        style={{
                          padding: '12px 0',
                          borderBottom:
                            itemIndex < day.items.length - 1
                              ? '1px solid #f0f0f0'
                              : 'none',
                        }}
                      >
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Space>
                            <Tag color={item.type === 'attraction' ? 'green' : item.type === 'restaurant' ? 'orange' : 'cyan'}>
                              {item.type}
                            </Tag>
                            <Text strong>{item.title}</Text>
                            <Text type="secondary">({item.time})</Text>
                          </Space>
                          <Paragraph type="secondary" style={{ margin: 0, paddingLeft: 8 }}>
                            {item.description}
                          </Paragraph>
                          <Space size={16} style={{ paddingLeft: 8 }}>
                            <Text type="secondary">
                              <EnvironmentOutlined /> {item.location}
                            </Text>
                            {item.cost && (
                              <Text type="secondary">
                                <DollarOutlined /> ¥{item.cost}
                              </Text>
                            )}
                          </Space>
                        </Space>
                      </div>
                    ))}
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* 右侧: 地图 + 其他信息 */}
        <Col xs={24} lg={10}>
          {/* 行程地图 */}
          <Card title="行程地图" style={{ marginBottom: 16, minHeight: 400 }}>
            <div style={{ height: 400 }}>
              <ItineraryMap
                items={
                  itinerary.daily_itinerary?.flatMap((day) => day.items) || []
                }
                city={trip.destination}
                onMarkerClick={(item) => {
                  console.log('地点点击:', item);
                  // 可以在这里实现与时间线的联动
                }}
              />
            </div>
          </Card>

          {/* 住宿信息 */}
          <Card title="住宿推荐" style={{ marginBottom: 16 }}>
            {itinerary.accommodation.map((acc, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text strong>Day {acc.day}: {acc.hotel_name}</Text>
                  <Text type="secondary">
                    <EnvironmentOutlined /> {acc.location}
                  </Text>
                  <Text type="secondary">预算: {acc.price_range} | 评分: {acc.rating}</Text>
                  <Paragraph type="secondary" style={{ margin: 0 }}>
                    {acc.booking_tips}
                  </Paragraph>
                </Space>
                {index < itinerary.accommodation.length - 1 && <Divider />}
              </div>
            ))}
          </Card>

          {/* 交通方案 */}
          <Card title="交通方案" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div>
                <Text strong>往返交通</Text>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  方式: {itinerary.transportation.to_destination.method}
                </Paragraph>
                {itinerary.transportation.to_destination.details && (
                  <Paragraph type="secondary" style={{ margin: 0 }}>
                    {itinerary.transportation.to_destination.details}
                  </Paragraph>
                )}
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  预估费用: ¥{itinerary.transportation.to_destination.estimated_cost}
                </Paragraph>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Text strong>当地交通</Text>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  推荐: {itinerary.transportation.local_transport.recommendation}
                </Paragraph>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  每日费用: ¥{itinerary.transportation.local_transport.daily_cost}
                </Paragraph>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  提示: {itinerary.transportation.local_transport.tips}
                </Paragraph>
              </div>
            </Space>
          </Card>

          {/* 预算分配 */}
          <Card title="预算分配">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>交通: </Text>
                <Text strong>¥{itinerary.budget_breakdown.transportation}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>住宿: </Text>
                <Text strong>¥{itinerary.budget_breakdown.accommodation}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>餐饮: </Text>
                <Text strong>¥{itinerary.budget_breakdown.food}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>门票: </Text>
                <Text strong>¥{itinerary.budget_breakdown.tickets}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>购物: </Text>
                <Text strong>¥{itinerary.budget_breakdown.shopping}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>其他: </Text>
                <Text strong>¥{itinerary.budget_breakdown.other}</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>总计: </Text>
                <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                  ¥
                  {Object.values(itinerary.budget_breakdown).reduce(
                    (sum, val) => sum + val,
                    0
                  )}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ItineraryDetail;
