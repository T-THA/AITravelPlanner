import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Empty, 
  Button, 
  List, 
  Tag, 
  Space, 
  Typography, 
  message, 
  Spin, 
  Popconfirm,
  Select,
  DatePicker,
  Row,
  Col,
  Input,
  Dropdown,
  MenuProps,
  Modal,
  Skeleton,
} from 'antd';
import {
  PlusOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  UserOutlined,
  EyeOutlined,
  DeleteOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  CopyOutlined,
  ShareAltOutlined,
  EditOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { tripService } from '../services/trip';
import dayjs, { Dayjs } from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;

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
  cover_image?: string;
  itinerary?: any;
}

const ItineraryList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // 加载行程列表
  useEffect(() => {
    loadTrips();
  }, []);

  // 应用筛选
  useEffect(() => {
    applyFilters();
  }, [trips, statusFilter, dateRange, searchText, sortBy]);

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

  // 应用筛选逻辑
  const applyFilters = () => {
    let filtered = [...trips];

    // 按状态筛选
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    // 按日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      const filterStart = dateRange[0];
      const filterEnd = dateRange[1];
      
      filtered = filtered.filter(trip => {
        const startDate = dayjs(trip.start_date);
        return (startDate.isAfter(filterStart.subtract(1, 'day')) && 
                startDate.isBefore(filterEnd.add(1, 'day')));
      });
    }

    // 按搜索文本筛选
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(trip => 
        trip.title.toLowerCase().includes(searchLower) ||
        trip.destination.toLowerCase().includes(searchLower)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'start_date_desc':
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        case 'start_date_asc':
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case 'budget_desc':
          return b.budget - a.budget;
        case 'budget_asc':
          return a.budget - b.budget;
        default:
          return 0;
      }
    });

    setFilteredTrips(filtered);
  };

  // 重置筛选
  const handleResetFilters = () => {
    setStatusFilter('all');
    setDateRange(null);
    setSearchText('');
    setSortBy('created_desc');
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

  // 复制行程
  const handleCopy = async (tripId: string) => {
    try {
      const { data, error } = await tripService.copyTrip(tripId);
      
      if (error || !data) {
        message.error('复制失败: ' + (error?.message || '未知错误'));
        return;
      }

      message.success('复制成功');
      loadTrips(); // 重新加载列表
      // 可选：导航到新行程
      // navigate(`/itineraries/${data.id}`);
    } catch (error) {
      console.error('Copy trip error:', error);
      message.error('复制失败');
    }
  };

  // 分享行程
  const handleShare = (tripId: string) => {
    const url = `${window.location.origin}/itineraries/${tripId}`;
    setShareUrl(url);
    setShareModalVisible(true);
  };

  // 复制分享链接
  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      message.success('链接已复制到剪贴板');
      setShareModalVisible(false);
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  // 归档行程
  const handleArchive = async (tripId: string) => {
    try {
      const { error } = await tripService.updateTripStatus(tripId, 'archived');
      
      if (error) {
        message.error('归档失败: ' + error.message);
        return;
      }

      message.success('已归档');
      loadTrips();
    } catch (error) {
      console.error('Archive trip error:', error);
      message.error('归档失败');
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
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>我的行程</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/itineraries/create')}>
            创建新行程
          </Button>
        </div>
        
        <Card style={{ marginBottom: 16 }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>

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
          dataSource={[1, 2, 3, 4, 5, 6]}
          renderItem={() => (
            <List.Item>
              <Card>
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </List.Item>
          )}
        />
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

      {/* 筛选器 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          {/* 搜索框 */}
          <Col xs={24} sm={24} md={12} lg={8}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <SearchOutlined /> 搜索行程
              </Text>
              <Input.Search
                placeholder="搜索标题或目的地"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ width: '100%' }}
              />
            </Space>
          </Col>

          {/* 状态筛选 */}
          <Col xs={24} sm={12} md={6} lg={4}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <FilterOutlined /> 状态
              </Text>
              <Select
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: '全部', value: 'all' },
                  { label: '草稿', value: 'draft' },
                  { label: '已生成', value: 'generated' },
                  { label: '进行中', value: 'in_progress' },
                  { label: '已完成', value: 'completed' },
                  { label: '已归档', value: 'archived' },
                ]}
              />
            </Space>
          </Col>

          {/* 日期范围 */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CalendarOutlined /> 日期范围
              </Text>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
                placeholder={['开始日期', '结束日期']}
                format="YYYY-MM-DD"
              />
            </Space>
          </Col>

          {/* 排序 */}
          <Col xs={24} sm={12} md={6} lg={4}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <SortAscendingOutlined /> 排序
              </Text>
              <Select
                style={{ width: '100%' }}
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { label: '最新创建', value: 'created_desc' },
                  { label: '最早创建', value: 'created_asc' },
                  { label: '出发日期↓', value: 'start_date_desc' },
                  { label: '出发日期↑', value: 'start_date_asc' },
                  { label: '预算从高到低', value: 'budget_desc' },
                  { label: '预算从低到高', value: 'budget_asc' },
                ]}
              />
            </Space>
          </Col>

          {/* 重置按钮 */}
          <Col xs={24} sm={12} md={6} lg={2}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
              block
              style={{ marginTop: 20 }}
            >
              重置
            </Button>
          </Col>
        </Row>

        {/* 统计信息 */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <Space size="large">
            <Text type="secondary">
              共 <Text strong>{trips.length}</Text> 个行程
            </Text>
            {filteredTrips.length !== trips.length && (
              <Text type="secondary">
                筛选后 <Text strong style={{ color: '#1890ff' }}>{filteredTrips.length}</Text> 个
              </Text>
            )}
          </Space>
        </div>
      </Card>

      {filteredTrips.length === 0 ? (
        <Card>
          <Empty
            description={trips.length === 0 ? "您还没有创建任何行程" : "没有符合条件的行程"}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {trips.length === 0 && (
              <Button type="primary" onClick={() => navigate('/itineraries/create')}>
                立即创建
              </Button>
            )}
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
          dataSource={filteredTrips}
          renderItem={(trip) => {
            // 更多操作菜单
            const moreMenuItems: MenuProps['items'] = [
              {
                key: 'copy',
                icon: <CopyOutlined />,
                label: '复制行程',
                onClick: () => handleCopy(trip.id),
              },
              {
                key: 'share',
                icon: <ShareAltOutlined />,
                label: '分享行程',
                onClick: () => handleShare(trip.id),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: '编辑信息',
                onClick: () => navigate(`/itineraries/${trip.id}`),
              },
              {
                type: 'divider',
              },
              {
                key: 'archive',
                icon: <InboxOutlined />,
                label: trip.status === 'archived' ? '取消归档' : '归档',
                onClick: () => handleArchive(trip.id),
                disabled: trip.status === 'draft',
              },
            ];

            return (
              <List.Item>
                <Card
                  hoverable
                  cover={
                    trip.cover_image && (
                      <div style={{ 
                        height: 180, 
                        overflow: 'hidden',
                        background: `url(${trip.cover_image}) center/cover`
                      }} />
                    )
                  }
                  actions={[
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleView(trip.id)}
                      key="view"
                    >
                      查看
                    </Button>,
                    <Dropdown menu={{ items: moreMenuItems }} key="more" placement="bottomRight">
                      <Button type="link">
                        更多
                      </Button>
                    </Dropdown>,
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
            );
          }}
        />
      )}

      {/* 分享Modal */}
      <Modal
        title="分享行程"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setShareModalVisible(false)}>
            取消
          </Button>,
          <Button key="copy" type="primary" onClick={handleCopyShareUrl}>
            复制链接
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>分享此链接，让其他人查看您的行程：</Text>
          <Input.TextArea
            value={shareUrl}
            readOnly
            autoSize={{ minRows: 2, maxRows: 4 }}
            style={{ marginTop: 8 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            提示：任何拥有此链接的人都可以查看您的行程
          </Text>
        </Space>
      </Modal>
    </div>
  );
};

export default ItineraryList;
