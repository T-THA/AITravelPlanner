import React, { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { amapService } from '../services/amap';
import type { ItineraryItem } from '../types';

interface ItineraryMapProps {
  items: ItineraryItem[];
  city: string;
  onMarkerClick?: (item: ItineraryItem) => void;
}

const ItineraryMap: React.FC<ItineraryMapProps> = ({ items, city, onMarkerClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const containerId = useRef<string>(`map-${Date.now()}`);

  // 初始化地图
  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      try {
        // 设置容器 ID
        mapContainer.current!.id = containerId.current;

        const mapInstance = await amapService.initMap(containerId.current, {
          zoom: 12,
          center: [116.397428, 39.90923], // 默认北京中心
        });

        setMap(mapInstance);
        console.log('地图初始化成功');
      } catch (error) {
        console.error('地图初始化失败:', error);
        message.error('地图加载失败');
      }
    };

    initMap();

    // 清理函数
    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, []);

  // 添加地点标记
  useEffect(() => {
    if (!map || !items || items.length === 0) return;

    const addMarkers = async () => {
      // 清除旧标记
      markers.forEach((marker) => marker.setMap(null));
      setMarkers([]);

      const newMarkers: any[] = [];
      const points: any[] = [];

      for (const item of items) {
        try {
          // 地理编码：地址 -> 坐标
          // 组合城市和地点名称
          const fullAddress = `${city}${item.location}`;
          const location = await amapService.geocode(fullAddress);

          if (location) {
            // 根据类型选择图标颜色
            const color = getMarkerColor(item.type);

            // 创建标记
            const marker = new window.AMap.Marker({
              position: [location.lng, location.lat],
              title: item.title,
              label: {
                content: item.title,
                offset: new window.AMap.Pixel(0, -30),
              },
              // 自定义图标（可选）
              icon: new window.AMap.Icon({
                size: new window.AMap.Size(25, 34),
                image: `//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-${color}.png`,
                imageSize: new window.AMap.Size(25, 34),
              }),
            });

            // 点击事件
            marker.on('click', () => {
              if (onMarkerClick) {
                onMarkerClick(item);
              }

              // 显示信息窗口
              const infoWindow = new window.AMap.InfoWindow({
                content: createInfoWindowContent(item),
                offset: new window.AMap.Pixel(0, -30),
              });
              infoWindow.open(map, marker.getPosition());
            });

            marker.setMap(map);
            newMarkers.push(marker);
            points.push([location.lng, location.lat]);
          }
        } catch (error) {
          console.error(`标记地点失败: ${item.title}`, error);
        }
      }

      setMarkers(newMarkers);

      // 自动调整视野
      if (points.length > 0) {
        map.setFitView();
      }
    };

    addMarkers();
  }, [map, items, city]);

  // 根据类型获取标记颜色
  const getMarkerColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      attraction: 'red',
      restaurant: 'orange',
      hotel: 'blue',
      transport: 'gray',
      other: 'default',
    };
    return colorMap[type] || 'default';
  };

  // 创建信息窗口内容
  const createInfoWindowContent = (item: ItineraryItem): string => {
    const typeMap: Record<string, string> = {
      attraction: '景点',
      restaurant: '餐厅',
      hotel: '酒店',
      transport: '交通',
      other: '其他',
    };

    return `
      <div style="padding: 10px; min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; font-size: 16px;">${item.title}</h4>
        <p style="margin: 4px 0; color: #666;">
          <span style="background: #1890ff; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">
            ${typeMap[item.type] || item.type}
          </span>
          <span style="margin-left: 8px;">${item.time}</span>
        </p>
        <p style="margin: 4px 0; color: #666;">${item.description}</p>
        <p style="margin: 4px 0; color: #666;">📍 ${item.location}</p>
        ${item.cost ? `<p style="margin: 4px 0; color: #f5222d;">💰 ¥${item.cost}</p>` : ''}
      </div>
    `;
  };

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
      }}
    />
  );
};

export default ItineraryMap;
