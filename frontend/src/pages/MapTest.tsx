import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Input,
  Alert,
  List,
  Tag,
  Divider,
  message,
  Select,
  Row,
  Col,
} from 'antd';
import {
  EnvironmentOutlined,
  SearchOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { amapService, type PlaceInfo } from '../services/amap';

const { Title, Text } = Typography;
const { Search } = Input;

const MapTest: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCity, setSearchCity] = useState('北京');
  const [searchResults, setSearchResults] = useState<PlaceInfo[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [routeInfo, setRouteInfo] = useState<any>(null);

  // 检查 API 配置
  const isConfigured =
    import.meta.env.VITE_AMAP_JS_KEY && import.meta.env.VITE_AMAP_JS_SECRET;

  // 初始化地图
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainerRef.current || !isConfigured) return;

      try {
        await amapService.initMap('map-container', {
          center: [116.397428, 39.90923], // 北京天安门
          zoom: 12,
        });
        setIsMapLoaded(true);
        message.success('地图加载成功');
      } catch (error) {
        console.error('地图初始化失败:', error);
        message.error('地图加载失败');
      }
    };

    initMap();

    return () => {
      amapService.destroy();
    };
  }, [isConfigured]);

  // 搜索 POI
  const handleSearch = async (keywords: string) => {
    if (!keywords.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const results = await amapService.searchPOI({
        keywords,
        city: searchCity,
        pageSize: 10,
      });

      setSearchResults(results);
      message.success(`找到 ${results.length} 个结果`);
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败，请重试');
    } finally {
      setIsSearching(false);
    }
  };

  // 在地图上显示地点
  const handleShowOnMap = (place: PlaceInfo) => {
    try {
      amapService.clearMarkers();
      amapService.addMarkers([place]);
      setSelectedPlaces([place]);
      message.success(`已在地图上标注: ${place.name}`);
    } catch (error) {
      console.error('标注失败:', error);
      message.error('标注失败');
    }
  };

  // 添加到已选列表
  const handleAddToSelected = (place: PlaceInfo) => {
    if (selectedPlaces.some((p) => p.id === place.id)) {
      message.warning('该地点已添加');
      return;
    }

    const newSelected = [...selectedPlaces, place];
    setSelectedPlaces(newSelected);
    amapService.clearMarkers();
    amapService.addMarkers(newSelected);
    message.success(`已添加: ${place.name}`);
  };

  // 规划路线
  const handlePlanRoute = async () => {
    if (selectedPlaces.length < 2) {
      message.warning('请至少选择2个地点');
      return;
    }

    try {
      message.loading('正在规划路线...', 0);
      
      const origin: [number, number] = [
        selectedPlaces[0].location.lng,
        selectedPlaces[0].location.lat,
      ];
      const destination: [number, number] = [
        selectedPlaces[selectedPlaces.length - 1].location.lng,
        selectedPlaces[selectedPlaces.length - 1].location.lat,
      ];

      const route = await amapService.planRoute(origin, destination);
      setRouteInfo(route);
      
      message.destroy();
      message.success('路线规划成功');
    } catch (error) {
      message.destroy();
      console.error('路线规划失败:', error);
      message.error('路线规划失败');
    }
  };

  // 清除已选地点
  const handleClearSelected = () => {
    setSelectedPlaces([]);
    setRouteInfo(null);
    amapService.clearMarkers();
    message.success('已清除所有标注');
  };

  // 快速测试
  const handleQuickTest = async () => {
    try {
      message.loading('正在执行快速测试...', 0);

      // 测试1: 搜索故宫
      const results = await amapService.searchPOI({
        keywords: '故宫',
        city: '北京',
      });

      if (results.length > 0) {
        const gugong = results[0];
        
        // 测试2: 在地图上标注
        amapService.clearMarkers();
        amapService.addMarkers([gugong]);
        
        setSearchResults(results);
        setSelectedPlaces([gugong]);
        setSearchKeyword('故宫');
        setSearchCity('北京');

        message.destroy();
        message.success('快速测试完成！故宫已标注在地图上');
      } else {
        message.destroy();
        message.error('测试失败：未找到故宫');
      }
    } catch (error) {
      message.destroy();
      console.error('测试失败:', error);
      message.error('测试失败');
    }
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ maxWidth: '95%', width: '100%', margin: '0 auto' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={2}>
                <EnvironmentOutlined /> 高德地图 API 测试
              </Title>
              <Text type="secondary">Task 1.4: 测试高德地图显示、POI 搜索和路径规划功能</Text>
            </div>

            <Divider />

          {/* 环境检查 */}
          <Card type="inner" title="环境检查">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>API 配置:</Text>
                {isConfigured ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    已配置
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error">
                    未配置
                  </Tag>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>地图加载:</Text>
                {isMapLoaded ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    已加载
                  </Tag>
                ) : (
                  <Tag color="processing">加载中...</Tag>
                )}
              </div>
            </Space>
          </Card>

          {!isConfigured && (
            <Alert
              message="API 未配置"
              description="请在 .env 文件中配置高德地图 JS API 密钥（VITE_AMAP_JS_KEY、VITE_AMAP_JS_SECRET）"
              type="warning"
              showIcon
            />
          )}

          {/* 快速测试按钮 */}
          <Card type="inner">
            <Space>
              <Button
                type="primary"
                onClick={handleQuickTest}
                disabled={!isMapLoaded}
              >
                快速测试（搜索并标注故宫）
              </Button>
              <Button onClick={handleClearSelected} disabled={selectedPlaces.length === 0}>
                清除所有标注
              </Button>
            </Space>
          </Card>

          <Row gutter={24}>
            {/* 左侧：搜索和控制 */}
            <Col xs={24} md={24} lg={10} xl={8}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* POI 搜索 */}
                <Card type="inner" title="POI 搜索">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Select
                      style={{ width: '100%' }}
                      value={searchCity}
                      onChange={setSearchCity}
                      options={[
                        { label: '北京', value: '北京' },
                        { label: '上海', value: '上海' },
                        { label: '广州', value: '广州' },
                        { label: '深圳', value: '深圳' },
                        { label: '杭州', value: '杭州' },
                        { label: '成都', value: '成都' },
                      ]}
                    />
                    <Search
                      placeholder="搜索地点（如：故宫、天安门）"
                      allowClear
                      enterButton={<SearchOutlined />}
                      size="large"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onSearch={handleSearch}
                      loading={isSearching}
                      disabled={!isMapLoaded}
                    />
                  </Space>
                </Card>

                {/* 搜索结果 */}
                {searchResults.length > 0 && (
                  <Card type="inner" title={`搜索结果 (${searchResults.length})`}>
                    <List
                      size="small"
                      dataSource={searchResults}
                      renderItem={(item) => (
                        <List.Item
                          actions={[
                            <Button
                              type="link"
                              size="small"
                              onClick={() => handleShowOnMap(item)}
                            >
                              查看
                            </Button>,
                            <Button
                              type="link"
                              size="small"
                              onClick={() => handleAddToSelected(item)}
                            >
                              添加
                            </Button>,
                          ]}
                        >
                          <List.Item.Meta
                            title={item.name}
                            description={item.address}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                )}

                {/* 已选地点 */}
                {selectedPlaces.length > 0 && (
                  <Card
                    type="inner"
                    title={`已选地点 (${selectedPlaces.length})`}
                    extra={
                      <Button
                        type="primary"
                        size="small"
                        icon={<CarOutlined />}
                        onClick={handlePlanRoute}
                        disabled={selectedPlaces.length < 2}
                      >
                        规划路线
                      </Button>
                    }
                  >
                    <List
                      size="small"
                      dataSource={selectedPlaces}
                      renderItem={(item, index) => (
                        <List.Item>
                          <Tag color="blue">{index + 1}</Tag>
                          {item.name}
                        </List.Item>
                      )}
                    />
                  </Card>
                )}

                {/* 路线信息 */}
                {routeInfo && (
                  <Card type="inner" title="路线信息">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text>
                        <strong>距离:</strong> {(routeInfo.distance / 1000).toFixed(2)} 公里
                      </Text>
                      <Text>
                        <strong>预计时间:</strong> {Math.round(routeInfo.duration / 60)} 分钟
                      </Text>
                    </Space>
                  </Card>
                )}
              </Space>
            </Col>

            {/* 右侧：地图 */}
            <Col xs={24} md={24} lg={14} xl={16}>
              <Card
                type="inner"
                title="地图显示"
                bodyStyle={{ padding: 0 }}
              >
                <div
                  ref={mapContainerRef}
                  id="map-container"
                  style={{
                    width: '100%',
                    height: '700px',
                    backgroundColor: '#f0f0f0',
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* 使用说明 */}
          <Card type="inner" title="测试说明">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>测试步骤：</Text>
              <ol>
                <li>点击"快速测试"按钮，验证基本功能</li>
                <li>在搜索框中输入地点关键词（如"天安门"、"颐和园"）</li>
                <li>点击搜索结果的"查看"按钮，在地图上查看位置</li>
                <li>点击"添加"按钮，将地点添加到已选列表</li>
                <li>选择至少2个地点后，点击"规划路线"</li>
                <li>查看地图上显示的路线和路线信息</li>
              </ol>
              
              <Divider />
              
              <Text strong>验收标准：</Text>
              <ul>
                <li>✅ 地图正常显示</li>
                <li>✅ POI 搜索返回准确结果</li>
                <li>✅ 标记正确显示在地图上</li>
                <li>✅ 点击标记显示详细信息</li>
                <li>✅ 路径规划显示完整路线</li>
                <li>✅ 距离和时间计算准确</li>
              </ul>
            </Space>
          </Card>
        </Space>
        </Card>
      </div>
    </div>
  );
};

export default MapTest;
