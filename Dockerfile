# ==========================================
# 阶段 1: 构建阶段
# ==========================================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# ==========================================
# 阶段 2: 生产阶段
# ==========================================
FROM nginx:alpine

# 维护者信息
LABEL maintainer="your-email@example.com"
LABEL description="AI Travel Planner - AI-powered travel planning application"
LABEL version="1.0.0"

# 安装必要工具
RUN apk add --no-cache curl

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 创建健康检查脚本
RUN echo '#!/bin/sh' > /health-check.sh && \
    echo 'curl -f http://localhost:80/ || exit 1' >> /health-check.sh && \
    chmod +x /health-check.sh

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD ["/health-check.sh"]

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
