import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Tabs,
  Button,
  List,
  Space,
  Typography,
  Tag,
  Popconfirm,
  Input,
  Row,
  Col,
  Card,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { GeneratedItinerary, ItineraryItem } from '../types';
import EditItineraryItemModal from './EditItineraryItemModal';

const { TabPane } = Tabs;
const { Text } = Typography;
const { Search } = Input;

interface EditItineraryDrawerProps {
  visible: boolean;
  itinerary: GeneratedItinerary | null;
  onClose: () => void;
  onSave: (updatedItinerary: GeneratedItinerary) => Promise<boolean>;
  city: string;
}

const EditItineraryDrawer: React.FC<EditItineraryDrawerProps> = ({
  visible,
  itinerary,
  onClose,
  onSave,
  city,
}) => {
  const [localItinerary, setLocalItinerary] = useState<GeneratedItinerary | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [editingDay, setEditingDay] = useState<number>(1);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [isNewItem, setIsNewItem] = useState(false);

  // 地图相关状态
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // 同步itinerary到本地状态
  useEffect(() => {
    if (itinerary) {
      setLocalItinerary(JSON.parse(JSON.stringify(itinerary)));
    }
  }, [itinerary]);

  // 初始化地图
  useEffect(() => {
    if (visible && mapContainerRef.current && !mapRef.current && window.AMap) {
      try {
        const map = new window.AMap.Map(mapContainerRef.current, {
          zoom: 13,
          center: [116.397428, 39.90923], // 默认北京
        });
        mapRef.current = map;

        // 地理编码城市中心点
        const geocoder = new window.AMap.Geocoder({
          city: city,
        });
        
        geocoder.getLocation(city, (status: string, result: any) => {
          if (status === 'complete' && result.geocodes.length > 0) {
            const location = result.geocodes[0].location;
            map.setCenter([location.lng, location.lat]);
          }
        });
      } catch (error) {
        console.error('地图初始化失败:', error);
      }
    }

    // 清理地图
    return () => {
      if (!visible && mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [visible, city]);

  // 搜索POI
  const handleSearch = (value: string) => {
    if (!value || !mapRef.current) return;

    const placeSearch = new window.AMap.PlaceSearch({
      city: city,
      pageSize: 10,
    });

    placeSearch.search(value, (status: string, result: any) => {
      if (status === 'complete' && result.poiList) {
        setSearchResults(result.poiList.pois);
        
        // 在地图上显示搜索结果
        if (result.poiList.pois.length > 0) {
          const firstPoi = result.poiList.pois[0];
          handleSelectLocation(firstPoi);
        }
      } else {
        message.error('搜索失败');
        setSearchResults([]);
      }
    });
  };

  // 选择位置
  const handleSelectLocation = (poi: any) => {
    setSelectedLocation(poi);

    if (!mapRef.current) return;

    const location = poi.location;
    
    // 移除旧标记
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // 添加新标记
    const marker = new window.AMap.Marker({
      position: [location.lng, location.lat],
      title: poi.name,
    });
    marker.setMap(mapRef.current);
    markerRef.current = marker;

    // 地图中心移动到该位置
    mapRef.current.setCenter([location.lng, location.lat]);
    mapRef.current.setZoom(16);

    // 更新编辑表单中的位置信息
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        location: poi.address || poi.name,
      });
    }
  };

  // 打开添加Modal
  const handleAdd = (day: number) => {
    setIsNewItem(true);
    setEditingDay(day);
    setEditingIndex(-1);
    setEditingItem({
      time: '',
      type: 'attraction',
      title: '',
      location: selectedLocation?.address || selectedLocation?.name || '',
      description: '',
      cost: 0,
    } as ItineraryItem);
    setEditModalVisible(true);
  };

  // 打开编辑Modal
  const handleEdit = (day: number, index: number, item: ItineraryItem) => {
    setIsNewItem(false);
    setEditingDay(day);
    setEditingIndex(index);
    setEditingItem(item);
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveItem = (updatedItem: ItineraryItem) => {
    if (!localItinerary) return;

    const newItinerary = { ...localItinerary };
    const dayIndex = newItinerary.daily_itinerary.findIndex((d) => d.day === editingDay);

    if (dayIndex === -1) {
      message.error('无法找到对应的日期');
      return;
    }

    if (isNewItem) {
      newItinerary.daily_itinerary[dayIndex].items.push(updatedItem);
    } else {
      if (editingIndex >= 0 && editingIndex < newItinerary.daily_itinerary[dayIndex].items.length) {
        newItinerary.daily_itinerary[dayIndex].items[editingIndex] = updatedItem;
      }
    }

    setLocalItinerary(newItinerary);
    setEditModalVisible(false);
    message.success(isNewItem ? '添加成功' : '修改成功');
  };

  // 删除项
  const handleDelete = (day: number, index: number) => {
    if (!localItinerary) return;

    const newItinerary = { ...localItinerary };
    const dayIndex = newItinerary.daily_itinerary.findIndex((d) => d.day === day);

    if (dayIndex === -1) {
      message.error('无法找到对应的日期');
      return;
    }

    newItinerary.daily_itinerary[dayIndex].items.splice(index, 1);
    setLocalItinerary(newItinerary);
    message.success('删除成功');
  };

  // 保存所有修改
  const handleSaveAll = async () => {
    if (!localItinerary) return;

    const success = await onSave(localItinerary);
    if (success) {
      onClose();
    }
  };

  return (
    <>
      <Drawer
        title="编辑行程信息"
        placement="right"
        width="80%"
        onClose={onClose}
        open={visible}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={onClose}>取消</Button>
              <Button type="primary" onClick={handleSaveAll}>
                保存所有修改
              </Button>
            </Space>
          </div>
        }
      >
        <Row gutter={16}>
          {/* 左侧: 行程列表编辑 */}
          <Col span={14}>
            <Tabs defaultActiveKey="1">
              {localItinerary?.daily_itinerary.map((day) => (
                <TabPane tab={`Day ${day.day}`} key={day.day.toString()}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Button
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      onClick={() => handleAdd(day.day)}
                    >
                      添加行程项
                    </Button>

                    <List
                      dataSource={day.items}
                      renderItem={(item, index) => (
                        <List.Item
                          actions={[
                            <Button
                              key="edit"
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => handleEdit(day.day, index, item)}
                            >
                              编辑
                            </Button>,
                            <Popconfirm
                              key="delete"
                              title="确定删除这个行程项吗?"
                              onConfirm={() => handleDelete(day.day, index)}
                              okText="删除"
                              cancelText="取消"
                            >
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                              >
                                删除
                              </Button>
                            </Popconfirm>,
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <Space>
                                <Tag color={item.type === 'attraction' ? 'green' : item.type === 'restaurant' ? 'orange' : 'cyan'}>
                                  {item.type}
                                </Tag>
                                <Text strong>{item.title}</Text>
                                <Text type="secondary">({item.time})</Text>
                              </Space>
                            }
                            description={
                              <Space direction="vertical" size={2}>
                                <Text type="secondary">
                                  <EnvironmentOutlined /> {item.location}
                                </Text>
                                <Text type="secondary">{item.description}</Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Space>
                </TabPane>
              ))}
            </Tabs>
          </Col>

          {/* 右侧: 地图搜索 */}
          <Col span={10}>
            <Card title="地点搜索" size="small">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Search
                  placeholder={`搜索 ${city} 的地点`}
                  enterButton={<SearchOutlined />}
                  onSearch={handleSearch}
                  allowClear
                />

                {/* 小地图 */}
                <div
                  ref={mapContainerRef}
                  style={{
                    width: '100%',
                    height: '300px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                  }}
                />

                {/* 搜索结果列表 */}
                {searchResults.length > 0 && (
                  <List
                    size="small"
                    header={<Text strong>搜索结果</Text>}
                    bordered
                    dataSource={searchResults}
                    style={{ maxHeight: '300px', overflow: 'auto' }}
                    renderItem={(poi) => (
                      <List.Item
                        style={{
                          cursor: 'pointer',
                          backgroundColor: selectedLocation?.id === poi.id ? '#e6f7ff' : 'transparent',
                        }}
                        onClick={() => handleSelectLocation(poi)}
                      >
                        <List.Item.Meta
                          title={poi.name}
                          description={poi.address}
                        />
                      </List.Item>
                    )}
                  />
                )}

                {/* 选中位置提示 */}
                {selectedLocation && (
                  <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                    <Text strong>已选择位置:</Text>
                    <br />
                    <Text>{selectedLocation.name}</Text>
                    <br />
                    <Text type="secondary">{selectedLocation.address}</Text>
                  </Card>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Drawer>

      {/* 编辑Modal */}
      <EditItineraryItemModal
        visible={editModalVisible}
        item={editingItem}
        dayNumber={editingDay}
        isNew={isNewItem}
        city={city}
        onCancel={() => setEditModalVisible(false)}
        onSave={handleSaveItem}
      />
    </>
  );
};

export default EditItineraryDrawer;
