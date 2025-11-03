import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
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
  SaveOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { tripService } from '../services/trip';
import { dashScopeService } from '../services/dashscope';
import ItineraryMap from '../components/ItineraryMap';
import EditItineraryDrawer from '../components/EditItineraryDrawer';
import BudgetAnalysis from '../components/BudgetAnalysis';
import type { ItineraryMapRef } from '../components/ItineraryMap';
import type { GeneratedItinerary, BudgetAnalysis as BudgetAnalysisType } from '../types';

const { Title, Text, Paragraph } = Typography;

const ItineraryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trip, setTrip] = useState<any>(null);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const mapRef = useRef<ItineraryMapRef>(null);
  
  // 用于高亮时间线项的状态
  const [highlightedItem, setHighlightedItem] = useState<{
    day: number;
    index: number;
  } | null>(null);
  
  // Drawer状态
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  
  // 预算分析状态
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysisType | null>(null);
  const [budgetAnalysisVisible, setBudgetAnalysisVisible] = useState(false);
  const [analyzingBudget, setAnalyzingBudget] = useState(false);

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

  // 保存行程数据到数据库
  const saveItinerary = async (updatedItinerary: GeneratedItinerary) => {
    setSaving(true);
    try {
      const { error } = await tripService.updateTripItinerary(id!, updatedItinerary);
      if (error) {
        message.error('保存失败: ' + error.message);
        return false;
      }
      message.success('保存成功');
      return true;
    } catch (error) {
      console.error('Save itinerary error:', error);
      message.error('保存失败');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // 保存行程数据到数据库,使用不可变更新确保地图刷新
  const handleSaveItinerary = async (updatedItinerary: GeneratedItinerary) => {
    // 创建新的引用以触发React重新渲染和useEffect
    const newItinerary = {
      ...updatedItinerary,
      daily_itinerary: updatedItinerary.daily_itinerary.map(day => ({
        ...day,
        items: [...day.items]
      }))
    };
    
    setItinerary(newItinerary);
    const success = await saveItinerary(newItinerary);
    
    // 刷新地图
    if (success && mapRef.current) {
      // 地图组件会自动响应itinerary的变化
    }
    
    return success;
  };

  // 分析预算
  const handleAnalyzeBudget = async () => {
    if (!trip || !itinerary) return;

    setAnalyzingBudget(true);
    setBudgetAnalysisVisible(true);

    try {
      const analysis = await dashScopeService.analyzeBudget({
        userBudget: trip.budget || 0,
        budgetBreakdown: itinerary.budget_breakdown,
        destination: trip.destination,
        days: itinerary.daily_itinerary.length,
        travelers: trip.people_count || 1,
      });

      setBudgetAnalysis(analysis);
      message.success('预算分析完成');
    } catch (error: any) {
      console.error('Budget analysis error:', error);
      message.error('预算分析失败: ' + (error.message || '未知错误'));
      setBudgetAnalysisVisible(false);
    } finally {
      setAnalyzingBudget(false);
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
            {saving && (
              <Text type="secondary">
                <SaveOutlined spin /> 保存中...
              </Text>
            )}
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => setEditDrawerVisible(true)}
            >
              编辑行程信息
            </Button>
            <Button 
              icon={<BarChartOutlined />}
              onClick={handleAnalyzeBudget}
              loading={analyzingBudget}
            >
              预算分析
            </Button>
            <Button icon={<ShareAltOutlined />}>分享</Button>
          </Space>
        </Space>
      </Card>

      {/* 主内容区域: 左侧时间线 + 右侧地图 */}
      <Row gutter={24}>
        {/* 左侧: 每日行程时间线 - 紧凑布局 */}
        <Col xs={24} lg={10}>
          <Card 
            title="每日行程" 
            style={{ 
              height: 'calc(100vh - 280px)', 
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{
              flex: 1,
              overflow: 'auto',
              padding: '12px 16px'
            }}
          >
            <Timeline mode="left" style={{ paddingLeft: 0 }}>
              {itinerary.daily_itinerary.map((day, index) => (
                <Timeline.Item
                  key={index}
                  label={
                    <Space direction="vertical" size={0} style={{ minWidth: 60 }}>
                      <Text strong style={{ fontSize: 14 }}>Day {day.day}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
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
                        <Text strong style={{ fontSize: 13 }}>{day.theme}</Text>
                      </Space>
                    }
                    style={{ marginBottom: 12 }}
                    bodyStyle={{ padding: '8px 12px' }}
                  >
                    {day.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        data-day={day.day}
                        data-index={itemIndex}
                        onClick={() => {
                          // 时间线项点击 → 地图高亮
                          mapRef.current?.highlightLocation(day.day, itemIndex);
                          setHighlightedItem({ day: day.day, index: itemIndex });
                        }}
                        style={{
                          padding: '8px',
                          borderBottom:
                            itemIndex < day.items.length - 1
                              ? '1px solid #f0f0f0'
                              : 'none',
                          cursor: 'pointer',
                          backgroundColor:
                            highlightedItem?.day === day.day &&
                            highlightedItem?.index === itemIndex
                              ? '#e6f7ff'
                              : 'transparent',
                          transition: 'background-color 0.3s',
                          borderRadius: '4px',
                          marginBottom: '4px'
                        }}
                        onMouseEnter={(e) => {
                          if (
                            !(
                              highlightedItem?.day === day.day &&
                              highlightedItem?.index === itemIndex
                            )
                          ) {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (
                            !(
                              highlightedItem?.day === day.day &&
                              highlightedItem?.index === itemIndex
                            )
                          ) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Space style={{ width: '100%' }}>
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
        <Col xs={24} lg={14}>
          {/* 行程地图 - 增大尺寸 */}
          <Card 
            title="行程地图" 
            style={{ 
              marginBottom: 16,
              height: 'calc(100vh - 280px)'
            }}
            bodyStyle={{
              padding: 12,
              height: 'calc(100% - 57px)'
            }}
          >
            <ItineraryMap
              key={JSON.stringify(itinerary.daily_itinerary)}
              ref={mapRef}
              dailyItinerary={itinerary.daily_itinerary || []}
              city={trip.destination}
              accommodation={itinerary.accommodation} // 传入住宿信息
              onMarkerClick={(item, day) => {
                console.log('地点点击:', item, 'Day:', day);
                // 地图标记点击 → 时间线高亮（需要找到对应的 itemIndex）
                const dayData = itinerary.daily_itinerary.find((d) => d.day === day);
                if (dayData) {
                  const itemIndex = dayData.items.findIndex((i) => i.title === item.title);
                  if (itemIndex !== -1) {
                    setHighlightedItem({ day, index: itemIndex });
                    
                    // 滚动到对应的时间线项
                    // 使用 setTimeout 确保 DOM 更新后再滚动
                    setTimeout(() => {
                      const element = document.querySelector(
                        `[data-day="${day}"][data-index="${itemIndex}"]`
                      );
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                  }
                }
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 底部信息区域: 住宿、交通、预算 */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        {/* 住宿推荐 */}
        <Col xs={24} md={12} lg={8}>
          <Card title="🏨 住宿推荐" style={{ marginBottom: 16 }}>
            {(() => {
              // 去重：按酒店名称去重，只保留唯一的酒店
              const uniqueHotels = Array.from(
                new Map(
                  itinerary.accommodation.map((acc) => [
                    acc.hotel_name,
                    {
                      hotelName: acc.hotel_name,
                      location: acc.location,
                      priceRange: acc.price_range,
                      rating: acc.rating,
                      bookingTips: acc.booking_tips,
                      day: acc.day, // 保留第一次出现的day用于地图定位
                    },
                  ])
                ).values()
              );

              return uniqueHotels.map((hotel, index) => (
                <div 
                  key={index} 
                  style={{ 
                    marginBottom: 16,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.style.borderColor = '#1890ff';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#f0f0f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    // 点击酒店卡片时，高亮地图上的对应标记
                    mapRef.current?.highlightHotel(hotel.day);
                    message.success(`正在定位: ${hotel.hotelName}`);
                  }}
                >
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 14 }}>{hotel.hotelName}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <EnvironmentOutlined /> {hotel.location}
                    </Text>
                    <Space size={16}>
                      <Tag color="blue">{hotel.priceRange}</Tag>
                      <Tag color="gold">⭐ {hotel.rating}分</Tag>
                    </Space>
                    <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
                      💡 {hotel.bookingTips}
                    </Paragraph>
                  </Space>
                </div>
              ));
            })()}
          </Card>
        </Col>

        {/* 交通方案 */}
        <Col xs={24} md={12} lg={8}>
          <Card title="🚗 交通方案" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div>
                <Text strong style={{ fontSize: 14 }}>🚄 往返交通</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="green">{itinerary.transportation.to_destination.method}</Tag>
                  <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 12 }}>
                    {itinerary.transportation.to_destination.details}
                  </Paragraph>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    预估费用: <Text strong style={{ color: '#f5222d' }}>¥{itinerary.transportation.to_destination.estimated_cost}</Text>
                  </Text>
                </div>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Text strong style={{ fontSize: 14 }}>🚌 当地交通</Text>
                <div style={{ marginTop: 8 }}>
                  <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
                    推荐: {itinerary.transportation.local_transport.recommendation}
                  </Paragraph>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    每日预算: <Text strong style={{ color: '#f5222d' }}>¥{itinerary.transportation.local_transport.daily_cost}</Text>
                  </Text>
                  <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 12 }}>
                    💡 {itinerary.transportation.local_transport.tips}
                  </Paragraph>
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 预算分配 */}
        <Col xs={24} md={24} lg={8}>
          <Card title="💰 预算分配" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space><Text>🚄 交通</Text></Space>
                <Text strong style={{ fontSize: 16 }}>¥{itinerary.budget_breakdown.transportation}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space><Text>🏨 住宿</Text></Space>
                <Text strong style={{ fontSize: 16 }}>¥{itinerary.budget_breakdown.accommodation}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space><Text>🍜 餐饮</Text></Space>
                <Text strong style={{ fontSize: 16 }}>¥{itinerary.budget_breakdown.food}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space><Text>🎫 门票</Text></Space>
                <Text strong style={{ fontSize: 16 }}>¥{itinerary.budget_breakdown.tickets}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space><Text>🛍️ 购物</Text></Space>
                <Text strong style={{ fontSize: 16 }}>¥{itinerary.budget_breakdown.shopping}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space><Text>📦 其他</Text></Space>
                <Text strong style={{ fontSize: 16 }}>¥{itinerary.budget_breakdown.other}</Text>
              </div>
              <Divider style={{ margin: '12px 0', borderColor: '#1890ff' }} />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px'
              }}>
                <Text strong style={{ color: '#fff', fontSize: 16 }}>💵 总预算</Text>
                <Text strong style={{ fontSize: 22, color: '#fff' }}>
                  ¥{Object.values(itinerary.budget_breakdown).reduce((sum, val) => sum + val, 0)}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 编辑行程Drawer */}
      <EditItineraryDrawer
        visible={editDrawerVisible}
        itinerary={itinerary}
        city={trip.destination}
        onClose={() => setEditDrawerVisible(false)}
        onSave={handleSaveItinerary}
      />

      {/* 预算分析Modal */}
      <Modal
        title={
          <Space>
            <BarChartOutlined />
            <span>AI 预算分析报告</span>
          </Space>
        }
        open={budgetAnalysisVisible}
        onCancel={() => setBudgetAnalysisVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBudgetAnalysisVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="refresh" 
            type="primary" 
            icon={<BarChartOutlined />}
            onClick={handleAnalyzeBudget}
            loading={analyzingBudget}
          >
            重新分析
          </Button>,
        ]}
        width={1200}
        centered
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto', padding: '24px' }}
      >
        {analyzingBudget ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="AI 正在分析预算，请稍候..." />
          </div>
        ) : budgetAnalysis ? (
          <BudgetAnalysis analysis={budgetAnalysis} />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Text type="secondary">暂无分析数据</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ItineraryDetail;
