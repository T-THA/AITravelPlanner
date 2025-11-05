/**
 * 环境变量工具函数
 * 支持从运行时注入的window._env_或构建时的import.meta.env读取
 */

// 声明全局window._env_类型
declare global {
  interface Window {
    _env_?: {
      VITE_DASHSCOPE_API_KEY?: string;
      VITE_IFLYTEK_APP_ID?: string;
      VITE_IFLYTEK_API_KEY?: string;
      VITE_IFLYTEK_API_SECRET?: string;
      VITE_AMAP_KEY?: string;
      VITE_AMAP_JS_KEY?: string;
      VITE_AMAP_JS_SECRET?: string;
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      VITE_ALIYUN_API_KEY?: string;
      VITE_ALIYUN_BASE_URL?: string;
      VITE_ALIYUN_MODEL_NAME?: string;
    };
  }
}

/**
 * 获取环境变量
 * 优先从运行时window._env_读取,否则从构建时import.meta.env读取
 */
export function getEnv(key: string): string | undefined {
  // 优先从运行时环境变量读取
  if (typeof window !== 'undefined' && window._env_ && window._env_[key as keyof typeof window._env_]) {
    return window._env_[key as keyof typeof window._env_];
  }
  
  // 回退到构建时环境变量
  return import.meta.env[key];
}

// 导出常用环境变量的便捷访问器
export const env = {
  // DashScope (通义千问)
  DASHSCOPE_API_KEY: () => getEnv('VITE_DASHSCOPE_API_KEY') || getEnv('VITE_ALIYUN_API_KEY'),
  ALIYUN_API_KEY: () => getEnv('VITE_ALIYUN_API_KEY'),
  ALIYUN_BASE_URL: () => getEnv('VITE_ALIYUN_BASE_URL'),
  ALIYUN_MODEL_NAME: () => getEnv('VITE_ALIYUN_MODEL_NAME'),
  
  // 讯飞语音
  IFLYTEK_APP_ID: () => getEnv('VITE_IFLYTEK_APP_ID'),
  IFLYTEK_API_KEY: () => getEnv('VITE_IFLYTEK_API_KEY'),
  IFLYTEK_API_SECRET: () => getEnv('VITE_IFLYTEK_API_SECRET'),
  
  // 高德地图
  AMAP_KEY: () => getEnv('VITE_AMAP_KEY'),
  AMAP_JS_KEY: () => getEnv('VITE_AMAP_JS_KEY') || getEnv('VITE_AMAP_KEY'),
  AMAP_JS_SECRET: () => getEnv('VITE_AMAP_JS_SECRET'),
  
  // Supabase
  SUPABASE_URL: () => getEnv('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: () => getEnv('VITE_SUPABASE_ANON_KEY'),
};
