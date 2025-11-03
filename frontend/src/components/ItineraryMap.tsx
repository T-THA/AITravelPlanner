import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { message, Spin } from 'antd';
import { amapService } from '../services/amap';
import type { DailyItinerary, ItineraryItem } from '../types';

interface ItineraryMapProps {
  dailyItinerary: DailyItinerary[]; // 按天分组的行程
  city: string;
  onMarkerClick?: (item: ItineraryItem, day: number) => void;
}

// 暴露给父组件的方法
export interface ItineraryMapRef {
  highlightLocation: (day: number, itemIndex: number) => void;
}

  const ItineraryMap = forwardRef<ItineraryMapRef, ItineraryMapProps>(
  ({ dailyItinerary, city, onMarkerClick }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [polylines, setPolylines] = useState<any[]>([]); // 存储路线
    const [loading, setLoading] = useState(true); // 加载状态
    const infoWindowsRef = useRef<any[]>([]); // 存储所有 InfoWindow
    const containerId = useRef<string>(`map-${Date.now()}`);
    
    // 存储标记与行程项的映射关系
    const markerItemMap = useRef<Map<any, { item: ItineraryItem; day: number; index: number }>>(
      new Map()
    );  // 初始化地图
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
        setLoading(false);
      } catch (error) {
        console.error('地图初始化失败:', error);
        message.error('地图加载失败');
        setLoading(false);
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
      setLoading(true); // 开始加载

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
        for (let itemIndex = 0; itemIndex < day.items.length; itemIndex++) {
          const item = day.items[itemIndex];
          try {
            // 地理编码：地址 -> 坐标
            const fullAddress = `${city}${item.location}`;
            const location = await amapService.geocode(fullAddress);

            if (location) {
              const position: [number, number] = [location.lng, location.lat];

              // 创建标记 - 使用更醒目的样式
              const marker = new window.AMap.Marker({
                position,
                title: item.title,
                label: {
                  content: `Day ${day.day}`,
                  offset: new window.AMap.Pixel(0, -40),
                  direction: 'top',
                },
                // 使用更大更醒目的标记
                icon: new window.AMap.Icon({
                  size: new window.AMap.Size(32, 44),
                  image: `//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-${getColorName(dayColor)}.png`,
                  imageSize: new window.AMap.Size(32, 44),
                  imageOffset: new window.AMap.Pixel(0, 0),
                }),
                // 设置标记可见层级
                zIndex: 100 + dayIndex * 10 + itemIndex,
                // 鼠标悬停提示
                cursor: 'pointer',
              });

              // 存储标记与行程项的映射
              markerItemMap.current.set(marker, { item, day: day.day, index: itemIndex });

              // 点击事件
              marker.on('click', () => {
                if (onMarkerClick) {
                  onMarkerClick(item, day.day);
                }

                // 关闭所有已打开的 InfoWindow
                infoWindowsRef.current.forEach((iw: any) => iw.close());

                // 显示信息窗口
                const infoWindow = new window.AMap.InfoWindow({
                  content: createInfoWindowContent(item, day.day),
                  offset: new window.AMap.Pixel(0, -30),
                });
                infoWindow.open(map, marker.getPosition());
                infoWindowsRef.current.push(infoWindow);
                
                // 高亮当前标记
                marker.setAnimation('AMAP_ANIMATION_BOUNCE');
                setTimeout(() => marker.setAnimation('AMAP_ANIMATION_NONE'), 1000);
              });

              marker.setMap(map);
              newMarkers.push(marker);
              dayPoints.push(position);
              allPoints.push(position);
            }
          } catch (error) {
            console.error(`标记地点失败: ${item.title} (${item.location})`, error);
            // 降级处理：如果地理编码失败，记录但继续处理下一个地点
            message.warning(`无法定位: ${item.title}，请检查地址是否正确`, 2);
          }
        }

        // 绘制当天的路线（连接各个地点）- 使用更醒目的样式
        if (dayPoints.length > 1) {
          const polyline = new window.AMap.Polyline({
            path: dayPoints,
            strokeColor: dayColor,
            strokeWeight: 6, // 增加线宽
            strokeOpacity: 0.9, // 增加不透明度
            lineJoin: 'round',
            lineCap: 'round',
            strokeStyle: 'solid',
            zIndex: 50, // 确保路线在标记下方
            showDir: true, // 显示方向箭头
          });

          polyline.setMap(map);
          newPolylines.push(polyline);
        }
      }

      setMarkers(newMarkers);
      setPolylines(newPolylines);
      setLoading(false); // 加载完成

      // 自动调整视野以包含所有标记，并添加适当的边距
      if (allPoints.length > 0) {
        // 使用 setTimeout 确保所有标记已经渲染
        setTimeout(() => {
          map.setFitView(newMarkers, false, [50, 50, 50, 50]); // 上右下左边距各50px
        }, 100);
      } else {
        // 如果没有标记，尝试定位到城市中心
        try {
          const cityLocation = await amapService.geocode(city);
          if (cityLocation) {
            map.setCenter([cityLocation.lng, cityLocation.lat]);
            map.setZoom(12);
          }
        } catch (error) {
          console.warn('无法定位城市中心:', city);
        }
      }
    };

    addMarkersAndRoutes();
  }, [map, dailyItinerary, city]);

  // 暴露给父组件的方法：高亮指定位置
  useImperativeHandle(ref, () => ({
    highlightLocation: (day: number, itemIndex: number) => {
      if (!map || markers.length === 0) return;

      // 查找对应的标记
      let targetMarker: any = null;
      for (const [marker, data] of markerItemMap.current.entries()) {
        if (data.day === day && data.index === itemIndex) {
          targetMarker = marker;
          break;
        }
      }

      if (!targetMarker) {
        console.warn(`未找到 Day ${day} 第 ${itemIndex} 个地点的标记`);
        return;
      }

      // 关闭所有 InfoWindow
      infoWindowsRef.current.forEach((iw: any) => iw.close());

      // 地图中心移动到该标记
      const position = targetMarker.getPosition();
      map.setCenter(position);
      map.setZoom(16);

      // 高亮标记（跳动动画）
      targetMarker.setAnimation('AMAP_ANIMATION_BOUNCE');
      setTimeout(() => targetMarker.setAnimation('AMAP_ANIMATION_NONE'), 1500);

      // 打开 InfoWindow
      const data = markerItemMap.current.get(targetMarker);
      if (data) {
        const infoWindow = new window.AMap.InfoWindow({
          content: createInfoWindowContent(data.item, data.day),
          offset: new window.AMap.Pixel(0, -30),
        });
        infoWindow.open(map, position);
        infoWindowsRef.current.push(infoWindow);
      }
    },
  }));

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
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
      }}
    >
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
        }}
      />
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
        >
          <Spin tip="加载地图中..." />
        </div>
      )}
    </div>
  );
});

ItineraryMap.displayName = 'ItineraryMap';

export default ItineraryMap;
