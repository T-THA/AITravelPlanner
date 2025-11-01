/**
 * 高德地图服务
 * 文档: https://lbs.amap.com/api/javascript-api/summary
 */

// 高德地图类型定义
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

// 地点信息
export interface PlaceInfo {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  type?: string;
  tel?: string;
  distance?: number;
}

// 路径规划结果
export interface RouteInfo {
  distance: number; // 距离(米)
  duration: number; // 时间(秒)
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

// POI 搜索参数
export interface POISearchParams {
  keywords: string;
  city?: string;
  location?: string; // "经度,纬度"
  radius?: number; // 搜索半径(米)
  pageSize?: number;
  pageIndex?: number;
}

class AmapService {
  private map: any = null;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private jsApiKey: string;
  private jsApiSecret: string;

  constructor() {
    // JS API 用于浏览器端地图显示
    this.jsApiKey = import.meta.env.VITE_AMAP_JS_KEY;
    this.jsApiSecret = import.meta.env.VITE_AMAP_JS_SECRET;

    if (!this.jsApiKey || !this.jsApiSecret) {
      console.warn(
        '⚠️  高德地图 JS API 配置不完整，请在 .env 文件中配置:\n' +
          '   VITE_AMAP_JS_KEY\n' +
          '   VITE_AMAP_JS_SECRET'
      );
    }
  }

  /**
   * 加载高德地图 JS API
   */
  async loadMapScript(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      // 设置安全密钥
      window._AMapSecurityConfig = {
        securityJsCode: this.jsApiSecret,
      };

      // 创建 script 标签
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${this.jsApiKey}&plugin=AMap.PlaceSearch,AMap.Driving,AMap.Geocoder`;
      script.async = true;

      script.onload = () => {
        this.isLoaded = true;
        console.log('✅ 高德地图 JS API 加载成功');
        resolve();
      };

      script.onerror = () => {
        console.error('❌ 高德地图 JS API 加载失败');
        reject(new Error('高德地图 JS API 加载失败'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * 初始化地图
   * @param containerId 地图容器 DOM ID
   * @param options 地图配置
   */
  async initMap(
    containerId: string,
    options?: {
      center?: [number, number];
      zoom?: number;
    }
  ): Promise<any> {
    await this.loadMapScript();

    const { AMap } = window;
    if (!AMap) {
      throw new Error('高德地图 API 未加载');
    }

    this.map = new AMap.Map(containerId, {
      zoom: options?.zoom || 12,
      center: options?.center || [116.397428, 39.90923], // 默认北京天安门
      viewMode: '3D',
      pitch: 40,
      buildingAnimation: true,
      expandZoomRange: true,
      zooms: [3, 20],
    });

    console.log('✅ 地图初始化成功');
    return this.map;
  }

  /**
   * POI 搜索
   * @param params 搜索参数
   */
  async searchPOI(params: POISearchParams): Promise<PlaceInfo[]> {
    await this.loadMapScript();

    const { AMap } = window;
    if (!AMap) {
      throw new Error('高德地图 API 未加载');
    }

    return new Promise((resolve, reject) => {
      const placeSearch = new AMap.PlaceSearch({
        city: params.city || '全国',
        pageSize: params.pageSize || 10,
        pageIndex: params.pageIndex || 1,
        extensions: 'all',
      });

      placeSearch.search(params.keywords, (status: string, result: any) => {
        if (status === 'complete' && result.poiList) {
          const places: PlaceInfo[] = result.poiList.pois.map((poi: any) => ({
            id: poi.id,
            name: poi.name,
            address: poi.address,
            location: {
              lat: poi.location.lat,
              lng: poi.location.lng,
            },
            type: poi.type,
            tel: poi.tel,
          }));

          console.log(`✅ 搜索到 ${places.length} 个结果`);
          resolve(places);
        } else {
          console.error('❌ POI 搜索失败:', status, result);
          reject(new Error('POI 搜索失败'));
        }
      });
    });
  }

  /**
   * 在地图上添加标记
   * @param places 地点列表
   */
  addMarkers(places: PlaceInfo[]): any[] {
    if (!this.map) {
      throw new Error('地图未初始化');
    }

    const { AMap } = window;
    const markers = places.map((place) => {
      const marker = new AMap.Marker({
        position: [place.location.lng, place.location.lat],
        title: place.name,
        label: {
          content: place.name,
          offset: new AMap.Pixel(0, -30),
        },
      });

      // 点击标记显示信息窗口
      marker.on('click', () => {
        const infoWindow = new AMap.InfoWindow({
          content: `
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 8px 0;">${place.name}</h3>
              <p style="margin: 4px 0; color: #666;">地址: ${place.address}</p>
              ${place.tel ? `<p style="margin: 4px 0; color: #666;">电话: ${place.tel}</p>` : ''}
            </div>
          `,
        });
        infoWindow.open(this.map, [place.location.lng, place.location.lat]);
      });

      this.map.add(marker);
      return marker;
    });

    // 调整视野以包含所有标记
    if (markers.length > 0) {
      this.map.setFitView(markers);
    }

    return markers;
  }

  /**
   * 清除所有标记
   */
  clearMarkers(): void {
    if (this.map) {
      this.map.clearMap();
    }
  }

  /**
   * 路径规划（驾车）
   * @param origin 起点 [lng, lat]
   * @param destination 终点 [lng, lat]
   */
  async planRoute(
    origin: [number, number],
    destination: [number, number]
  ): Promise<RouteInfo> {
    await this.loadMapScript();

    const { AMap } = window;
    if (!AMap) {
      throw new Error('高德地图 API 未加载');
    }

    return new Promise((resolve, reject) => {
      const driving = new AMap.Driving({
        map: this.map,
        panel: 'route-panel', // 如果需要显示详细步骤
      });

      driving.search(
        new AMap.LngLat(origin[0], origin[1]),
        new AMap.LngLat(destination[0], destination[1]),
        (status: string, result: any) => {
          if (status === 'complete' && result.routes && result.routes.length > 0) {
            const route = result.routes[0];
            const routeInfo: RouteInfo = {
              distance: route.distance,
              duration: route.time,
              steps: route.steps.map((step: any) => ({
                instruction: step.instruction,
                distance: step.distance,
                duration: step.time,
              })),
            };

            console.log('✅ 路径规划成功');
            resolve(routeInfo);
          } else {
            console.error('❌ 路径规划失败:', status, result);
            reject(new Error('路径规划失败'));
          }
        }
      );
    });
  }

  /**
   * 地理编码（地址转坐标）
   * @param address 地址
   */
  async geocode(address: string): Promise<{ lng: number; lat: number }> {
    await this.loadMapScript();

    const { AMap } = window;
    if (!AMap) {
      throw new Error('高德地图 API 未加载');
    }

    return new Promise((resolve, reject) => {
      const geocoder = new AMap.Geocoder();

      geocoder.getLocation(address, (status: string, result: any) => {
        if (status === 'complete' && result.geocodes.length > 0) {
          const location = result.geocodes[0].location;
          resolve({
            lng: location.lng,
            lat: location.lat,
          });
        } else {
          reject(new Error('地理编码失败'));
        }
      });
    });
  }

  /**
   * 逆地理编码（坐标转地址）
   * @param location [lng, lat]
   */
  async regeocode(location: [number, number]): Promise<string> {
    await this.loadMapScript();

    const { AMap } = window;
    if (!AMap) {
      throw new Error('高德地图 API 未加载');
    }

    return new Promise((resolve, reject) => {
      const geocoder = new AMap.Geocoder();

      geocoder.getAddress(location, (status: string, result: any) => {
        if (status === 'complete' && result.regeocode) {
          resolve(result.regeocode.formattedAddress);
        } else {
          reject(new Error('逆地理编码失败'));
        }
      });
    });
  }

  /**
   * 销毁地图实例
   */
  destroy(): void {
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
  }

  /**
   * 获取当前地图实例
   */
  getMap(): any {
    return this.map;
  }
}

// 导出单例
export const amapService = new AmapService();
