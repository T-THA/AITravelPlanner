# ==========================================
# 阶段 1: 构建阶段
# ==========================================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制前端项目的 package.json 和 package-lock.json
COPY frontend/package*.json ./

# 安装依赖
RUN npm ci && npm cache clean --force

# 复制前端源代码
COPY frontend/ ./

# 构建应用（不需要环境变量，运行时注入）
RUN npm run build

# ==========================================
# 阶段 2: 生产阶段
# ==========================================
FROM nginx:alpine

# 维护者信息
LABEL maintainer="T-THA"
LABEL description="AI Travel Planner - AI-powered travel planning application"
LABEL version="1.0.0"

# 安装必要工具
RUN apk add --no-cache curl bash

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 复制环境变量注入脚本
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 创建健康检查脚本
RUN echo '#!/bin/sh' > /health-check.sh && \
    echo 'curl -f http://localhost:80/health || exit 1' >> /health-check.sh && \
    chmod +x /health-check.sh

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD ["/health-check.sh"]

# 使用自定义入口点脚本
ENTRYPOINT ["/docker-entrypoint.sh"]

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
