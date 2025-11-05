/**
 * 性能优化工具函数
 */

/**
 * 防抖函数
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 节流函数
 * @param fn 需要节流的函数
 * @param delay 节流间隔（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastTime >= delay) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      fn.apply(this, args);
      lastTime = now;
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
        lastTime = Date.now();
        timeoutId = null;
      }, delay - (now - lastTime));
    }
  };
}

/**
 * 图片懒加载Hook
 * @param ref 图片元素引用
 * @param src 图片源地址
 */
export function useLazyImage(
  ref: React.RefObject<HTMLImageElement>,
  src: string
): void {
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && ref.current) {
            ref.current.src = src;
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, src]);
}

/**
 * 简单的内存缓存实现
 */
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private maxAge: number; // 缓存过期时间（毫秒）

  constructor(maxAge: number = 5 * 60 * 1000) {
    // 默认5分钟
    this.maxAge = maxAge;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// 创建API缓存实例
export const apiCache = new SimpleCache<any>(5 * 60 * 1000); // 5分钟缓存

/**
 * 带缓存的API请求函数
 * @param key 缓存键
 * @param fetcher API请求函数
 * @param useCache 是否使用缓存
 * @returns API响应数据
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  useCache: boolean = true
): Promise<T> {
  // 如果不使用缓存，直接请求
  if (!useCache) {
    return fetcher();
  }

  // 尝试从缓存获取
  const cached = apiCache.get(key);
  if (cached) {
    console.log('[Cache Hit]', key);
    return cached;
  }

  // 缓存未命中，发起请求
  console.log('[Cache Miss]', key);
  const data = await fetcher();
  apiCache.set(key, data);
  return data;
}

// 导出React相关的Hook
import React from 'react';
