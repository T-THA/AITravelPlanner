import React, { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { amapService } from '../services/amap';
import type { DailyItinerary, ItineraryItem } from '../types';

interface ItineraryMapProps {
  dailyItinerary: DailyItinerary[]; // 按天分组的行程
  city: string;
  onMarkerClick?: (item: ItineraryItem) => void;
}

const ItineraryMap: React.FC<ItineraryMapProps> = ({ dailyItinerary, city, onMarkerClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [polylines, setPolylines] = useState<any[]>([]); // 存储路线
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

  // 添加地点标记和路线
  useEffect(() => {
    if (!map || !dailyItinerary || dailyItinerary.length === 0) return;

    const addMarkersAndRoutes = async () => {
      // 清除旧标记和路线
      markers.forEach((marker) => marker.setMap(null));
      polylines.forEach((polyline) => polyline.setMap(null));
      setMarkers([]);
      setPolylines([]);

      const newMarkers: any[] = [];
      const newPolylines: any[] = [];
      const allPoints: any[] = [];

      // 颜色数组，用于区分不同天的路线
      const colors = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];

      // 遍历每天的行程
      for (let dayIndex = 0; dayIndex < dailyItinerary.length; dayIndex++) {
        const day = dailyItinerary[dayIndex];
        const dayPoints: [number, number][] = [];
        const dayColor = colors[dayIndex % colors.length];

        // 遍历当天的每个地点
        for (const item of day.items) {
          try {
            // 地理编码：地址 -> 坐标
            const fullAddress = `${city}${item.location}`;
            const location = await amapService.geocode(fullAddress);

            if (location) {
              const position: [number, number] = [location.lng, location.lat];

              // 创建标记
              const marker = new window.AMap.Marker({
                position,
                title: item.title,
                label: {
                  content: `Day ${day.day}: ${item.title}`,
                  offset: new window.AMap.Pixel(0, -30),
                },
                // 使用天数对应的颜色
                icon: new window.AMap.Icon({
                  size: new window.AMap.Size(25, 34),
                  image: `//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-${getColorName(dayColor)}.png`,
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
                  content: createInfoWindowContent(item, day.day),
                  offset: new window.AMap.Pixel(0, -30),
                });
                infoWindow.open(map, marker.getPosition());
              });

              marker.setMap(map);
              newMarkers.push(marker);
              dayPoints.push(position);
              allPoints.push(position);
            }
          } catch (error) {
            console.error(`标记地点失败: ${item.title}`, error);
          }
        }

        // 绘制当天的路线（连接各个地点）
        if (dayPoints.length > 1) {
          const polyline = new window.AMap.Polyline({
            path: dayPoints,
            strokeColor: dayColor,
            strokeWeight: 4,
            strokeOpacity: 0.8,
            lineJoin: 'round',
            lineCap: 'round',
          });

          polyline.setMap(map);
          newPolylines.push(polyline);
        }
      }

      setMarkers(newMarkers);
      setPolylines(newPolylines);

      // 自动调整视野以包含所有标记
      if (allPoints.length > 0) {
        map.setFitView();
      }
    };

    addMarkersAndRoutes();
  }, [map, dailyItinerary, city]);

  // 根据颜色代码获取标记图标名称
  const getColorName = (colorCode: string): string => {
    const colorNames: Record<string, string> = {
      '#1890ff': 'blue',
      '#52c41a': 'green',
      '#fa8c16': 'orange',
      '#eb2f96': 'pink',
      '#722ed1': 'purple',
      '#13c2c2': 'default',
    };
    return colorNames[colorCode] || 'red';
  };

  // 创建信息窗口内容
  const createInfoWindowContent = (item: ItineraryItem, day: number): string => {
    const typeMap: Record<string, string> = {
      attraction: '景点',
      restaurant: '餐厅',
      hotel: '酒店',
      transport: '交通',
      other: '其他',
    };

    return `
      <div style="padding: 10px; min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; font-size: 16px;">Day ${day}: ${item.title}</h4>
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
