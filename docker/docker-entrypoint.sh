#!/bin/sh

# 环境变量注入脚本
# 将运行时环境变量注入到前端静态文件中

set -e

echo "开始注入环境变量..."

# 创建环境变量配置文件
cat > /usr/share/nginx/html/env-config.js << EOF
window._env_ = {
  VITE_DASHSCOPE_API_KEY: "${VITE_DASHSCOPE_API_KEY}",
  VITE_IFLYTEK_APP_ID: "${VITE_IFLYTEK_APP_ID}",
  VITE_IFLYTEK_API_KEY: "${VITE_IFLYTEK_API_KEY}",
  VITE_IFLYTEK_API_SECRET: "${VITE_IFLYTEK_API_SECRET}",
  VITE_AMAP_KEY: "${VITE_AMAP_KEY}",
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}"
};
EOF

echo "环境变量注入完成"
echo "DASHSCOPE_API_KEY: ${VITE_DASHSCOPE_API_KEY:0:10}..."
echo "IFLYTEK_APP_ID: ${VITE_IFLYTEK_APP_ID:0:8}..."
echo "AMAP_KEY: ${VITE_AMAP_KEY:0:10}..."

# 启动 Nginx
echo "启动 Nginx..."
nginx -g 'daemon off;'
