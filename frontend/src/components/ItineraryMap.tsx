import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { message, Spin } from 'antd';
import { amapService } from '../services/amap';
import type { DailyItinerary, ItineraryItem, GeneratedItinerary } from '../types';

interface ItineraryMapProps {
  dailyItinerary: DailyItinerary[]; // 按天分组的行程
  city: string;
  accommodation?: GeneratedItinerary['accommodation']; // 住宿推荐（可选）
  onMarkerClick?: (item: ItineraryItem, day: number) => void;
}

// 暴露给父组件的方法
export interface ItineraryMapRef {
  highlightLocation: (day: number, itemIndex: number) => void;
  highlightHotel: (hotelDay: number) => void; // 新增：高亮酒店标记
}

const ItineraryMap = forwardRef<ItineraryMapRef, ItineraryMapProps>(
  ({ dailyItinerary, city, accommodation, onMarkerClick }, ref) => {
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
    );
    
    // 存储酒店标记的映射关系
    const hotelMarkerMap = useRef<Map<number, { marker: any; hotel: any }>>(new Map()); // day -> {marker, hotel}
  
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
    console.log('🔍 ItineraryMap useEffect 触发');
    console.log('📦 参数检查:', {
      hasMap: !!map,
      hasDailyItinerary: !!dailyItinerary,
      dailyItineraryLength: dailyItinerary?.length || 0,
      city: city,
      dailyItineraryData: dailyItinerary
    });

    if (!map) {
      console.warn('⚠️ 地图实例未初始化');
      setLoading(false);
      return;
    }

    if (!dailyItinerary || dailyItinerary.length === 0) {
      console.warn('⚠️ 没有行程数据');
      setLoading(false);
      return;
    }

    const addMarkersAndRoutes = async () => {
      // 清除旧标记和路线
      markers.forEach((marker) => marker.setMap(null));
      polylines.forEach((polyline) => polyline.setMap(null));
      setMarkers([]);
      setPolylines([]);
      setLoading(true); // 开始加载

      console.log(`📍 开始添加标记，城市: ${city}，行程天数: ${dailyItinerary.length}`);

      const newMarkers: any[] = [];
      const newPolylines: any[] = [];
      const allPoints: any[] = [];

      // 颜色数组，用于区分不同天的路线
      const colors = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];

      // 遍历每天的行程
      for (let dayIndex = 0; dayIndex < dailyItinerary.length; dayIndex++) {
        const day = dailyItinerary[dayIndex];
        console.log(`📅 处理 Day ${day.day}，包含 ${day.items.length} 个地点`);
        const dayPoints: [number, number][] = [];
        const dayColor = colors[dayIndex % colors.length];

        // 遍历当天的每个地点
        for (let itemIndex = 0; itemIndex < day.items.length; itemIndex++) {
          const item = day.items[itemIndex];
          console.log(`  🔸 处理地点 ${itemIndex + 1}/${day.items.length}: ${item.title} (${item.type})`);
          try {
            // 地理编码：地址 -> 坐标
            // 尝试多种地址格式
            let location = null;
            const addressVariants = [
              `${city}${item.location}`, // 城市+地点
              item.location, // 仅地点
              `${city}市${item.location}`, // 城市+市+地点
            ];

            // 为每个地址尝试添加超时机制
            for (const address of addressVariants) {
              try {
                console.log(`🔍 尝试地理编码: ${address}`);
                // 添加超时Promise
                const geocodePromise = amapService.geocode(address);
                const timeoutPromise = new Promise<null>((_, reject) => 
                  setTimeout(() => reject(new Error('Geocode timeout')), 3000)
                );
                
                location = await Promise.race([geocodePromise, timeoutPromise]);
                if (location) {
                  console.log(`✅ 地理编码成功: ${item.title} - [${location.lng}, ${location.lat}]`);
                  break;
                }
              } catch (err) {
                console.warn(`❌ 地址格式 "${address}" 编码失败:`, err instanceof Error ? err.message : '未知错误');
                continue;
              }
            }

            if (location) {
              const position: [number, number] = [location.lng, location.lat];

              // 创建标记 - 使用SVG自定义图标（支持动画）
              const markerContent = `
                <div style="position: relative; text-align: center;">
                  <svg width="32" height="44" viewBox="0 0 32 44" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                    <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 28 16 28s16-17 16-28c0-8.837-7.163-16-16-16z" 
                          fill="${dayColor}" 
                          stroke="#fff" 
                          stroke-width="2"/>
                    <circle cx="16" cy="16" r="6" fill="#fff"/>
                    <text x="16" y="20" text-anchor="middle" fill="${dayColor}" font-size="10" font-weight="bold">${day.day}</text>
                  </svg>
                  <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); 
                              background: ${dayColor}; color: white; padding: 2px 8px; border-radius: 10px; 
                              font-size: 11px; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    Day ${day.day}
                  </div>
                </div>
              `;

              const marker = new window.AMap.Marker({
                position,
                title: item.title,
                content: markerContent, // 使用HTML内容而非icon
                offset: new window.AMap.Pixel(-16, -44), // 调整偏移使图标底部对准坐标点
                // 设置标记可见层级
                zIndex: 100 + dayIndex * 10 + itemIndex,
                // 鼠标悬停提示
                cursor: 'pointer',
              });

              // 存储标记与行程项的映射
              markerItemMap.current.set(marker, { item, day: day.day, index: itemIndex });

              // 点击事件 - 异步加载POI详情
              marker.on('click', async () => {
                // 高亮当前标记 - 使用DOM动画（因为使用自定义content）
                try {
                  const markerDom = marker.getContentDom();
                  if (markerDom) {
                    // 添加弹跳动画
                    markerDom.style.animation = 'markerBounce 0.5s ease-out';
                    setTimeout(() => {
                      markerDom.style.animation = '';
                    }, 500);
                  }
                } catch (err) {
                  console.warn('动画设置失败:', err);
                }

                if (onMarkerClick) {
                  onMarkerClick(item, day.day);
                }

                // 关闭所有已打开的 InfoWindow
                infoWindowsRef.current.forEach((iw: any) => iw.close());

                // 先显示基础信息窗口
                const infoWindow = new window.AMap.InfoWindow({
                  content: createInfoWindowContent(item, day.day, null, true), // 显示加载中
                  offset: new window.AMap.Pixel(0, -30),
                });
                infoWindow.open(map, marker.getPosition());
                infoWindowsRef.current.push(infoWindow);

                // 异步加载POI详情
                try {
                  const poiDetail = await amapService.getPOIDetail(
                    item.title,
                    city,
                    position ? { lng: position[0], lat: position[1] } : undefined
                  );
                  
                  // 更新信息窗口内容
                  if (poiDetail) {
                    infoWindow.setContent(createInfoWindowContent(item, day.day, poiDetail, false));
                  } else {
                    infoWindow.setContent(createInfoWindowContent(item, day.day, null, false));
                  }
                } catch (error) {
                  console.warn('⚠️ 加载POI详情失败:', error);
                  // 失败时显示基础信息
                  infoWindow.setContent(createInfoWindowContent(item, day.day, null, false));
                }
              });

              marker.setMap(map);
              newMarkers.push(marker);
              dayPoints.push(position);
              allPoints.push(position);
              console.log(`✅ 标记已添加: Day ${day.day} - ${item.title}`);
            } else {
              console.warn(`⚠️ 跳过无法定位的地点: Day ${day.day} - ${item.title} (${item.location})`);
            }
          } catch (error) {
            console.error(`❌ 标记地点失败: ${item.title} (${item.location})`, error);
            // 降级处理：如果地理编码失败，记录但继续处理下一个地点
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

      // 添加酒店标记（如果有住宿信息）
      if (accommodation && accommodation.length > 0) {
        console.log(`🏨 开始添加 ${accommodation.length} 个酒店标记`);
        for (const hotel of accommodation) {
          try {
            // 地理编码酒店位置
            const addressVariants = [
              `${city}${hotel.location}`,
              hotel.location,
              `${city}市${hotel.location}`,
            ];

            let location = null;
            for (const address of addressVariants) {
              try {
                const geocodePromise = amapService.geocode(address);
                const timeoutPromise = new Promise<null>((_, reject) => 
                  setTimeout(() => reject(new Error('Geocode timeout')), 3000)
                );
                
                location = await Promise.race([geocodePromise, timeoutPromise]);
                if (location) break;
              } catch (err) {
                continue;
              }
            }

            if (location) {
              const position: [number, number] = [location.lng, location.lat];

              // 创建酒店标记 - 使用不同样式(移除Day标签)
              const hotelMarkerContent = `
                <div style="position: relative; text-align: center;">
                  <svg width="36" height="48" viewBox="0 0 36 48" style="filter: drop-shadow(0 3px 6px rgba(255,107,107,0.5));">
                    <path d="M18 0C9.163 0 2 7.163 2 16c0 12 16 32 16 32s16-20 16-32c0-8.837-7.163-16-16-16z" 
                          fill="#ff6b6b" 
                          stroke="#fff" 
                          stroke-width="2"/>
                    <text x="18" y="22" text-anchor="middle" fill="#fff" font-size="20" font-weight="bold">🏨</text>
                  </svg>
                </div>
              `;

              const hotelMarker = new window.AMap.Marker({
                position,
                title: hotel.hotel_name,
                content: hotelMarkerContent,
                offset: new window.AMap.Pixel(-18, -48),
                zIndex: 200, // 酒店标记在最上层
                cursor: 'pointer',
              });

              // 酒店标记点击事件
              hotelMarker.on('click', () => {
                try {
                  const markerDom = hotelMarker.getContentDom();
                  if (markerDom) {
                    markerDom.style.animation = 'markerBounce 0.5s ease-out';
                    setTimeout(() => {
                      markerDom.style.animation = '';
                    }, 500);
                  }
                } catch (err) {
                  console.warn('动画设置失败:', err);
                }

                // 关闭所有InfoWindow
                infoWindowsRef.current.forEach((iw: any) => iw.close());

                // 显示酒店信息
                const hotelInfoWindow = new window.AMap.InfoWindow({
                  content: `
                    <div style="padding: 12px; min-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      <h4 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #262626;">
                        🏨 Day ${hotel.day} 住宿
                      </h4>
                      <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #1890ff;">
                        ${hotel.hotel_name}
                      </h3>
                      <p style="margin: 4px 0; color: #8c8c8c; font-size: 13px;">
                        📍 ${hotel.location}
                      </p>
                      <div style="margin: 8px 0;">
                        <span style="background: #52c41a; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-right: 8px;">
                          ${hotel.price_range}
                        </span>
                        <span style="background: #faad14; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">
                          ⭐ ${hotel.rating}分
                        </span>
                      </div>
                      <p style="margin: 8px 0 0 0; color: #595959; font-size: 12px; line-height: 1.5;">
                        💡 ${hotel.booking_tips}
                      </p>
                    </div>
                  `,
                  offset: new window.AMap.Pixel(0, -30),
                });
                hotelInfoWindow.open(map, hotelMarker.getPosition());
                infoWindowsRef.current.push(hotelInfoWindow);
              });

              hotelMarker.setMap(map);
              newMarkers.push(hotelMarker);
              allPoints.push(position);
              
              // 存储酒店标记到映射中(存储marker和hotel信息)
              hotelMarkerMap.current.set(hotel.day, { marker: hotelMarker, hotel });
              
              console.log(`✅ 酒店标记已添加: Day ${hotel.day} - ${hotel.hotel_name}`);
            } else {
              console.warn(`⚠️ 跳过无法定位的酒店: Day ${hotel.day} - ${hotel.hotel_name}`);
            }
          } catch (error) {
            console.error(`❌ 添加酒店标记失败: ${hotel.hotel_name}`, error);
          }
        }
      }

      setMarkers(newMarkers);
      setPolylines(newPolylines);

      // 自动调整视野以包含所有标记
      if (newMarkers.length > 0) {
        // 使用 setTimeout 确保所有标记已经渲染完成
        setTimeout(() => {
          try {
            // 使用标记数组来调整视野
            map.setFitView(newMarkers, false, [80, 80, 80, 80]); // 增加边距到80px
            console.log(`✅ 地图已调整视野，包含 ${newMarkers.length} 个标记`);
          } catch (error) {
            console.error('调整地图视野失败:', error);
          }
          setLoading(false); // 在视野调整后设置加载完成
        }, 200); // 增加延迟确保渲染
      } else {
        // 如果没有标记，尝试定位到城市中心
        console.warn('未找到任何标记，尝试定位到城市中心:', city);
        try {
          const cityLocation = await amapService.geocode(city);
          if (cityLocation) {
            map.setCenter([cityLocation.lng, cityLocation.lat]);
            map.setZoom(13);
            console.log(`✅ 已定位到城市中心: ${city}`);
          }
        } catch (error) {
          console.error('定位城市中心失败:', city, error);
        } finally {
          setLoading(false);
        }
      }
    };

    addMarkersAndRoutes();
  }, [map, dailyItinerary, city, accommodation]);

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

      // 高亮标记（使用DOM动画）
      try {
        const markerDom = targetMarker.getContentDom();
        if (markerDom) {
          markerDom.style.animation = 'markerBounce 0.5s ease-out';
          setTimeout(() => {
            markerDom.style.animation = '';
          }, 500);
        }
      } catch (err) {
        console.warn('动画设置失败:', err);
      }

      // 打开 InfoWindow（异步加载POI详情）
      const data = markerItemMap.current.get(targetMarker);
      if (data) {
        // 先显示基础信息
        const infoWindow = new window.AMap.InfoWindow({
          content: createInfoWindowContent(data.item, data.day, null, true),
          offset: new window.AMap.Pixel(0, -30),
        });
        infoWindow.open(map, position);
        infoWindowsRef.current.push(infoWindow);

        // 异步加载POI详情
        (async () => {
          try {
            const poiDetail = await amapService.getPOIDetail(
              data.item.title,
              city,
              { lng: position.lng, lat: position.lat }
            );
            
            if (poiDetail) {
              infoWindow.setContent(createInfoWindowContent(data.item, data.day, poiDetail, false));
            } else {
              infoWindow.setContent(createInfoWindowContent(data.item, data.day, null, false));
            }
          } catch (error) {
            console.warn('⚠️ 加载POI详情失败:', error);
            infoWindow.setContent(createInfoWindowContent(data.item, data.day, null, false));
          }
        })();
      }
    },
    
    // 高亮酒店标记
    highlightHotel: (hotelDay: number) => {
      if (!map) return;

      const hotelData = hotelMarkerMap.current.get(hotelDay);
      if (!hotelData) {
        console.warn(`未找到 Day ${hotelDay} 的酒店标记`);
        return;
      }

      const { marker: targetMarker, hotel } = hotelData;

      // 关闭所有 InfoWindow
      infoWindowsRef.current.forEach((iw: any) => iw.close());

      // 地图中心移动到该标记
      const position = targetMarker.getPosition();
      map.setCenter(position);
      map.setZoom(16);

      // 高亮标记（使用DOM动画）
      try {
        const markerDom = targetMarker.getContentDom();
        if (markerDom) {
          markerDom.style.animation = 'markerBounce 0.5s ease-out';
          setTimeout(() => {
            markerDom.style.animation = '';
          }, 500);
        }
      } catch (err) {
        console.warn('动画设置失败:', err);
      }

      // 手动创建并打开 InfoWindow (避免触发click导致重复渲染)
      const hotelInfoWindow = new window.AMap.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h4 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #262626;">
              🏨 推荐住宿
            </h4>
            <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #1890ff;">
              ${hotel.hotel_name}
            </h3>
            <p style="margin: 4px 0; color: #8c8c8c; font-size: 13px;">
              📍 ${hotel.location}
            </p>
            <div style="margin: 8px 0;">
              <span style="background: #52c41a; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-right: 8px;">
                ${hotel.price_range}
              </span>
              <span style="background: #faad14; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">
                ⭐ ${hotel.rating}分
              </span>
            </div>
            <p style="margin: 8px 0 0 0; color: #595959; font-size: 12px; line-height: 1.5;">
              💡 ${hotel.booking_tips}
            </p>
          </div>
        `,
        offset: new window.AMap.Pixel(0, -30),
      });
      hotelInfoWindow.open(map, position);
      infoWindowsRef.current.push(hotelInfoWindow);
    },
  }));

  // 创建信息窗口内容
  const createInfoWindowContent = (
    item: ItineraryItem,
    day: number,
    poiDetail: any | null = null,
    isLoading: boolean = false
  ): string => {
    const typeMap: Record<string, string> = {
      attraction: '景点',
      restaurant: '餐厅',
      hotel: '酒店',
      transport: '交通',
      shopping: '购物',
      other: '其他',
    };

    // 加载中状态
    if (isLoading) {
      return `
        <div style="padding: 12px; min-width: 250px;">
          <h4 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Day ${day}: ${item.title}</h4>
          <div style="text-align: center; padding: 20px 0; color: #999;">
            <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #1890ff; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin: 10px 0 0 0;">加载详细信息中...</p>
          </div>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </div>
      `;
    }

    // 构建基础信息
    let content = `
      <div style="padding: 12px; min-width: 250px; max-width: 350px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #262626;">
          Day ${day}: ${item.title}
        </h4>
    `;

    // 添加图片（如果有且有效）
    if (poiDetail?.photos && Array.isArray(poiDetail.photos) && poiDetail.photos.length > 0) {
      const firstPhoto = poiDetail.photos[0];
      if (firstPhoto && typeof firstPhoto === 'string' && firstPhoto.trim() !== '') {
        content += `
          <div style="margin: 10px 0; border-radius: 6px; overflow: hidden; background: #f5f5f5;">
            <img 
              src="${firstPhoto}" 
              alt="${item.title}" 
              style="width: 100%; height: 160px; object-fit: cover; display: block;"
              onerror="this.parentElement.style.display='none'"
            />
          </div>
        `;
      }
    }

    content += `
        <div style="margin: 8px 0;">
          <span style="background: #1890ff; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; margin-right: 8px;">
            ${typeMap[item.type] || item.type}
          </span>
          <span style="color: #8c8c8c; font-size: 13px;">${item.time}</span>
        </div>
    `;

    // 添加描述
    if (item.description) {
      content += `
        <p style="margin: 10px 0; color: #595959; font-size: 13px; line-height: 1.5;">
          ${item.description}
        </p>
      `;
    }

    // 添加位置
    content += `
      <p style="margin: 8px 0; color: #8c8c8c; font-size: 13px;">
        📍 ${item.location}
      </p>
    `;

    // 添加POI详细信息（如果有）
    if (poiDetail) {
      // 评分
      if (poiDetail.rating) {
        const rating = parseFloat(poiDetail.rating);
        const stars = '⭐'.repeat(Math.floor(rating));
        content += `
          <p style="margin: 8px 0; color: #fa8c16; font-size: 13px;">
            ${stars} ${rating.toFixed(1)}分
          </p>
        `;
      }

      // 人均消费
      if (poiDetail.cost) {
        content += `
          <p style="margin: 8px 0; color: #f5222d; font-size: 13px;">
            💰 人均 ¥${poiDetail.cost}
          </p>
        `;
      }

      // 营业时间
      if (poiDetail.openTime) {
        content += `
          <p style="margin: 8px 0; color: #52c41a; font-size: 13px;">
            🕒 ${poiDetail.openTime}
          </p>
        `;
      }

      // 联系电话
      if (poiDetail.tel) {
        content += `
          <p style="margin: 8px 0; color: #1890ff; font-size: 13px;">
            📞 ${poiDetail.tel}
          </p>
        `;
      }

      // 商圈
      if (poiDetail.businessArea) {
        content += `
          <p style="margin: 8px 0; color: #8c8c8c; font-size: 12px;">
            🏪 ${poiDetail.businessArea}
          </p>
        `;
      }
    }

    // 添加行程预算成本（如果有）
    if (item.cost) {
      content += `
        <p style="margin: 8px 0; color: #f5222d; font-size: 13px; font-weight: 500;">
          � 预算 ¥${item.cost}
        </p>
      `;
    }

    content += `</div>`;
    return content;
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
      
      {/* 添加标记弹跳动画的CSS */}
      <style>{`
        @keyframes markerBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          25% {
            transform: translateY(-10px) scale(1.1);
          }
          50% {
            transform: translateY(-5px) scale(1.05);
          }
          75% {
            transform: translateY(-2px) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
});

ItineraryMap.displayName = 'ItineraryMap';

export default ItineraryMap;
