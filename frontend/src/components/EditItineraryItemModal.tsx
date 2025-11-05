import React, { useEffect, useState, useRef } from 'react';
import { Modal, Form, Input, InputNumber, Select, TimePicker, message, Row, Col, List, Card, Space } from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { ItineraryItem } from '../types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Search } = Input;

interface EditItineraryItemModalProps {
  visible: boolean;
  item: ItineraryItem | null;
  dayNumber: number;
  onCancel: () => void;
  onSave: (item: ItineraryItem) => void;
  isNew?: boolean;
  city?: string; // 添加城市参数用于地图搜索
}

const EditItineraryItemModal: React.FC<EditItineraryItemModalProps> = ({
  visible,
  item,
  dayNumber,
  onCancel,
  onSave,
  isNew = false,
  city = '上海', // 默认城市
}) => {
  const [form] = Form.useForm();
  
  // 地图相关状态
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // 当 modal 打开或 item 变化时,填充表单
  useEffect(() => {
    if (visible && item) {
      form.setFieldsValue({
        time: item.time ? dayjs(item.time, 'HH:mm') : null,
        type: item.type,
        title: item.title,
        location: item.location,
        description: item.description,
        duration: item.duration,
        cost: item.cost,
        // 可选字段
        ticket_info: item.ticket_info,
        opening_hours: item.opening_hours,
        tips: item.tips,
        cuisine: item.cuisine,
        recommended_dishes: item.recommended_dishes?.join(', '),
      });
    } else if (visible && isNew) {
      // 新建时设置默认值
      form.resetFields();
      form.setFieldsValue({
        type: 'attraction',
        cost: 0,
      });
    }
  }, [visible, item, isNew, form]);

  // 初始化地图
  useEffect(() => {
    // 延迟初始化,确保Modal和DOM完全渲染
    if (!visible) {
      // Modal关闭时清理地图
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
        markerRef.current = null;
      }
      setSearchResults([]);
      setSelectedLocation(null);
      return;
    }

    // Modal打开后延迟初始化地图
    const timer = setTimeout(() => {
      if (mapContainerRef.current && !mapRef.current && window.AMap) {
        try {
          console.log('🗺️ 初始化编辑Modal中的地图...');
          const map = new window.AMap.Map(mapContainerRef.current, {
            zoom: 13,
            center: [116.397428, 39.90923],
            resizeEnable: true,
          });
          mapRef.current = map;

          // 地理编码城市中心点
          const geocoder = new window.AMap.Geocoder({ city });
          geocoder.getLocation(city, (status: string, result: any) => {
            if (status === 'complete' && result.geocodes.length > 0) {
              const location = result.geocodes[0].location;
              map.setCenter([location.lng, location.lat]);
              console.log('✅ 地图中心设置为:', city, [location.lng, location.lat]);
            }
          });

          // 如果有初始位置,标记在地图上
          if (item?.location) {
            geocoder.getLocation(city + item.location, (status: string, result: any) => {
              if (status === 'complete' && result.geocodes.length > 0) {
                const loc = result.geocodes[0].location;
                const marker = new window.AMap.Marker({
                  position: [loc.lng, loc.lat],
                  title: item.title,
                });
                marker.setMap(map);
                markerRef.current = marker;
                map.setCenter([loc.lng, loc.lat]);
                map.setZoom(16);
              }
            });
          }
        } catch (error) {
          console.error('❌ 地图初始化失败:', error);
        }
      }
    }, 300); // 延迟300ms等待Modal动画完成

    return () => {
      clearTimeout(timer);
    };
  }, [visible, city, item]);

  // 搜索POI
  const handleSearch = (value: string) => {
    if (!value) {
      message.warning('请输入搜索关键词');
      return;
    }
    
    if (!mapRef.current) {
      message.error('地图未初始化，请稍后再试');
      console.error('❌ 地图未初始化');
      return;
    }

    if (!window.AMap || !window.AMap.PlaceSearch) {
      message.error('地图服务加载失败');
      console.error('❌ 高德地图PlaceSearch未加载');
      return;
    }

    console.log('🔍 搜索POI:', value, '城市:', city);

    try {
      const placeSearch = new window.AMap.PlaceSearch({
        city: city,
        pageSize: 10,
        extensions: 'all', // 返回详细信息
      });

      placeSearch.search(value, (status: string, result: any) => {
        console.log('🔍 搜索状态:', status, '结果:', result);
        
        if (status === 'complete' && result.poiList && result.poiList.pois) {
          const pois = result.poiList.pois;
          console.log(`✅ 找到 ${pois.length} 个结果`);
          setSearchResults(pois);
          
          if (pois.length > 0) {
            handleSelectLocation(pois[0]);
          } else {
            message.info('未找到相关地点');
          }
        } else if (status === 'no_data') {
          message.info('未找到相关地点，请换个关键词试试');
          setSearchResults([]);
        } else {
          message.error('搜索失败: ' + (result?.info || status));
          console.error('❌ 搜索失败:', status, result);
          setSearchResults([]);
        }
      });
    } catch (error) {
      console.error('❌ 搜索异常:', error);
      message.error('搜索出错，请重试');
    }
  };

  // 选择位置
  const handleSelectLocation = (poi: any) => {
    if (!poi || !poi.location) {
      console.error('❌ POI数据无效:', poi);
      return;
    }

    console.log('📍 选择位置:', poi.name, poi.address);
    setSelectedLocation(poi);

    if (!mapRef.current) {
      console.error('❌ 地图未初始化，无法显示标记');
      return;
    }

    const location = poi.location;
    const lng = typeof location.lng === 'number' ? location.lng : parseFloat(location.lng);
    const lat = typeof location.lat === 'number' ? location.lat : parseFloat(location.lat);

    if (isNaN(lng) || isNaN(lat)) {
      console.error('❌ 坐标无效:', location);
      message.error('位置坐标无效');
      return;
    }

    try {
      // 移除旧标记
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // 添加新标记
      const marker = new window.AMap.Marker({
        position: [lng, lat],
        title: poi.name,
      });
      marker.setMap(mapRef.current);
      markerRef.current = marker;

      // 地图中心移动到该位置
      mapRef.current.setCenter([lng, lat]);
      mapRef.current.setZoom(16);

      // 自动填充表单
      form.setFieldsValue({
        title: form.getFieldValue('title') || poi.name,
        location: poi.address || poi.name,
      });

      console.log('✅ 标记已添加到地图');
    } catch (error) {
      console.error('❌ 添加标记失败:', error);
      message.error('添加标记失败');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 构造行程项数据
      const updatedItem: ItineraryItem = {
        time: values.time ? values.time.format('HH:mm') : '',
        type: values.type,
        title: values.title,
        location: values.location,
        description: values.description,
        duration: values.duration,
        cost: values.cost || 0,
      };

      // 根据类型添加特定字段
      if (values.type === 'attraction') {
        if (values.ticket_info) updatedItem.ticket_info = values.ticket_info;
        if (values.opening_hours) updatedItem.opening_hours = values.opening_hours;
        if (values.tips) updatedItem.tips = values.tips;
      } else if (values.type === 'restaurant') {
        if (values.cuisine) updatedItem.cuisine = values.cuisine;
        if (values.recommended_dishes) {
          updatedItem.recommended_dishes = values.recommended_dishes
            .split(',')
            .map((dish: string) => dish.trim())
            .filter((dish: string) => dish);
        }
      }

      onSave(updatedItem);
      message.success(isNew ? '添加成功' : '修改成功');
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const itemType = Form.useWatch('type', form);

  // Modal打开后触发地图resize
  const handleAfterOpenChange = (open: boolean) => {
    if (open && mapRef.current) {
      // 延迟调用resize确保容器尺寸已确定
      setTimeout(() => {
        if (mapRef.current) {
          console.log('🔄 触发地图resize');
          mapRef.current.resize();
        }
      }, 100);
    }
  };

  return (
    <Modal
      title={isNew ? `添加 Day ${dayNumber} 行程项` : `编辑 Day ${dayNumber} 行程项`}
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      width={1200}
      okText={isNew ? '添加' : '保存'}
      cancelText="取消"
      destroyOnClose={false}
      afterOpenChange={handleAfterOpenChange}
    >
      <Row gutter={16}>
        {/* 左侧: 表单 */}
        <Col span={14}>
          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 24 }}
          >
            <Form.Item
              name="time"
              label="时间"
              rules={[{ required: true, message: '请选择时间' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="type"
              label="类型"
              rules={[{ required: true, message: '请选择类型' }]}
            >
              <Select placeholder="选择行程项类型">
                <Option value="attraction">景点</Option>
            <Option value="restaurant">餐厅</Option>
            <Option value="transport">交通</Option>
            <Option value="hotel">酒店</Option>
            <Option value="shopping">购物</Option>
            <Option value="other">其他</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="例如: 游览故宫" />
        </Form.Item>

        <Form.Item
          name="location"
          label="地点"
          rules={[{ required: true, message: '请输入地点' }]}
        >
          <Input placeholder="例如: 北京市东城区景山前街4号" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
          rules={[{ required: true, message: '请输入描述' }]}
        >
          <TextArea
            rows={3}
            placeholder="简要描述这个行程项的内容和特色"
          />
        </Form.Item>

        <Form.Item
          name="duration"
          label="时长 (分钟)"
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder="预计停留时长"
          />
        </Form.Item>

        <Form.Item
          name="cost"
          label="费用 (元)"
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder="预计花费"
          />
        </Form.Item>

        {/* 景点特有字段 */}
        {itemType === 'attraction' && (
          <>
            <Form.Item name="ticket_info" label="门票信息">
              <Input placeholder="例如: 成人票60元,学生票30元" />
            </Form.Item>

            <Form.Item name="opening_hours" label="开放时间">
              <Input placeholder="例如: 8:30-17:00" />
            </Form.Item>

            <Form.Item name="tips" label="游览提示">
              <TextArea
                rows={2}
                placeholder="游览建议和注意事项"
              />
            </Form.Item>
          </>
        )}

        {/* 餐厅特有字段 */}
        {itemType === 'restaurant' && (
          <>
            <Form.Item name="cuisine" label="菜系">
              <Input placeholder="例如: 川菜" />
            </Form.Item>

            <Form.Item name="recommended_dishes" label="推荐菜品">
              <Input placeholder="多个菜品用逗号分隔,例如: 宫保鸡丁, 麻婆豆腐" />
            </Form.Item>
          </>
        )}
          </Form>
        </Col>

        {/* 右侧: 地图搜索 */}
        <Col span={10}>
          <Card title="地点搜索" size="small" style={{ marginTop: 24 }}>
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
                  height: '250px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                }}
              />

              {/* 搜索结果列表 */}
              {searchResults.length > 0 && (
                <List
                  size="small"
                  header="搜索结果"
                  bordered
                  dataSource={searchResults}
                  style={{ maxHeight: '200px', overflow: 'auto' }}
                  renderItem={(poi) => (
                    <List.Item
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedLocation?.id === poi.id ? '#e6f7ff' : 'transparent',
                      }}
                      onClick={() => handleSelectLocation(poi)}
                    >
                      <List.Item.Meta
                        avatar={<EnvironmentOutlined />}
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
                  <Space direction="vertical" size={0}>
                    <strong>已选择:</strong>
                    <div>{selectedLocation.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{selectedLocation.address}</div>
                  </Space>
                </Card>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default EditItineraryItemModal;
