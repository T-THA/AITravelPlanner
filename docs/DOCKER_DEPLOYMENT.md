# Docker 部署指南

## 文档信息

- **适用环境**: 生产环境 / 测试环境
- **Docker 版本**: 20.10+
- **Docker Compose 版本**: 2.0+
- **最后更新**: 2025-01-XX

---

## 1. 部署前准备

### 1.1 服务器要求

**最低配置**:
- CPU: 2 核
- 内存: 2GB
- 存储: 10GB
- 操作系统: Linux (Ubuntu 20.04+ / CentOS 7+)

**推荐配置**:
- CPU: 4 核
- 内存: 4GB
- 存储: 20GB
- 操作系统: Ubuntu 22.04 LTS

### 1.2 安装 Docker

#### Ubuntu/Debian
```bash
# 更新软件包索引
sudo apt-get update

# 安装依赖
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 设置稳定版仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 验证安装
docker --version
docker compose version
```

#### CentOS/RHEL
```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker Engine
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker compose version
```

### 1.3 配置 Docker（可选）

```bash
# 将当前用户添加到 docker 组（避免每次使用 sudo）
sudo usermod -aG docker $USER

# 重新登录或执行以下命令
newgrp docker

# 配置 Docker 镜像加速（国内用户）
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
EOF

# 重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## 2. 获取应用镜像

### 2.1 方式一：从 Docker Hub 拉取（推荐）

```bash
# 拉取最新版本
docker pull your-dockerhub-username/ai-travel-planner:latest

# 拉取指定版本
docker pull your-dockerhub-username/ai-travel-planner:v1.0.0
```

### 2.2 方式二：从发布页面下载镜像文件

```bash
# 下载镜像文件（示例）
wget https://github.com/your-username/ai-travel-planner/releases/download/v1.0.0/ai-travel-planner.tar.gz

# 解压
tar -xzf ai-travel-planner.tar.gz

# 加载镜像
docker load -i ai-travel-planner.tar

# 验证镜像
docker images | grep ai-travel-planner
```

### 2.3 方式三：本地构建镜像

```bash
# 克隆项目
git clone https://github.com/your-username/ai-travel-planner.git
cd ai-travel-planner

# 构建镜像
docker build -t ai-travel-planner:latest .

# 查看构建的镜像
docker images
```

---

## 3. 配置应用

### 3.1 创建项目目录

```bash
# 创建部署目录
mkdir -p ~/ai-travel-planner
cd ~/ai-travel-planner

# 创建必要的子目录
mkdir -p data logs nginx/conf.d
```

### 3.2 配置环境变量

```bash
# 创建 .env 文件
cat > .env <<'EOF'
# ==========================================
# AI 旅行规划师 - 环境变量配置
# ==========================================

# 应用配置
NODE_ENV=production
PORT=3000

# Supabase 配置
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 科大讯飞配置
VITE_XUNFEI_APPID=your_xunfei_appid
VITE_XUNFEI_API_SECRET=your_xunfei_api_secret
VITE_XUNFEI_API_KEY=your_xunfei_api_key

# 高德地图配置
VITE_AMAP_KEY=your_amap_key
VITE_AMAP_SECRET=your_amap_secret

# 阿里云百炼配置
VITE_BAILIAN_API_KEY=your_bailian_api_key

# 日志配置
LOG_LEVEL=info
EOF

# 设置权限
chmod 600 .env
```

⚠️ **安全提示**: 
- 请勿将 `.env` 文件提交到版本控制系统
- 生产环境中使用强密码和密钥
- 定期轮换 API Keys

### 3.3 创建 docker-compose.yml

```yaml
# filepath: ~/ai-travel-planner/docker-compose.yml
version: '3.8'

services:
  # 前端应用
  web:
    image: your-dockerhub-username/ai-travel-planner:latest
    container_name: ai-travel-planner-web
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    networks:
      - ai-travel-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Nginx 反向代理（可选）
  nginx:
    image: nginx:alpine
    container_name: ai-travel-planner-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - web
    networks:
      - ai-travel-network

networks:
  ai-travel-network:
    driver: bridge

volumes:
  logs:
    driver: local
```

### 3.4 配置 Nginx（可选）

```bash
# 创建 Nginx 配置文件
cat > nginx/conf.d/default.conf <<'EOF'
# filepath: ~/ai-travel-planner/nginx/conf.d/default.conf

upstream web_backend {
    server web:80;
}

# HTTP 服务器
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 强制 HTTPS（生产环境推荐）
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 健康检查端点
    location /health {
        proxy_pass http://web_backend/health;
        access_log off;
    }

    # 日志配置
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}

# HTTPS 服务器（配置 SSL 证书后启用）
# server {
#     listen 443 ssl http2;
#     server_name your-domain.com www.your-domain.com;
#
#     ssl_certificate /etc/nginx/ssl/fullchain.pem;
#     ssl_certificate_key /etc/nginx/ssl/privkey.pem;
#
#     # SSL 配置
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#
#     location / {
#         proxy_pass http://web_backend;
#         # ... 其他配置同上
#     }
# }
EOF
```

---

## 4. 启动应用

### 4.1 启动服务

```bash
# 进入项目目录
cd ~/ai-travel-planner

# 拉取最新镜像（如果使用 Docker Hub）
docker compose pull

# 启动所有服务
docker compose up -d

# 查看启动日志
docker compose logs -f

# 检查服务状态
docker compose ps
```

### 4.2 验证部署

```bash
# 检查容器是否运行
docker ps

# 测试应用是否可访问
curl http://localhost:3000

# 或直接在浏览器访问
# http://your-server-ip:3000
```

### 4.3 查看日志

```bash
# 查看所有服务日志
docker compose logs

# 查看特定服务日志
docker compose logs web

# 实时查看日志
docker compose logs -f web

# 查看最近 100 行日志
docker compose logs --tail=100 web
```

---

## 5. 管理命令

### 5.1 基本操作

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose stop

# 停止并删除容器
docker compose down

# 重启服务
docker compose restart

# 重启特定服务
docker compose restart web

# 查看服务状态
docker compose ps

# 查看资源使用情况
docker stats
```

### 5.2 更新应用

```bash
# 拉取最新镜像
docker compose pull

# 停止旧容器
docker compose down

# 启动新容器
docker compose up -d

# 清理旧镜像（可选）
docker image prune -a
```

### 5.3 备份与恢复

```bash
# 备份数据目录
tar -czf backup-$(date +%Y%m%d).tar.gz data/ logs/

# 恢复数据
tar -xzf backup-20250101.tar.gz

# 备份 Docker 镜像
docker save ai-travel-planner:latest | gzip > ai-travel-planner-backup.tar.gz

# 恢复镜像
docker load < ai-travel-planner-backup.tar.gz
```

---

## 6. 监控与维护

### 6.1 健康检查

```bash
# 手动健康检查
curl http://localhost:3000/health

# 查看容器健康状态
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 6.2 日志管理

```bash
# 配置日志轮转
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# 重启 Docker
sudo systemctl restart docker

# 清理旧日志
docker system prune -a --volumes
```

### 6.3 性能监控

推荐使用以下工具：

```bash
# 安装 ctop（容器资源监控）
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop

# 运行监控
ctop

# 或使用 docker stats
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

---

## 7. 故障排查

### 7.1 容器无法启动

```bash
# 查看详细错误信息
docker compose logs web

# 检查配置文件
docker compose config

# 检查端口占用
netstat -tlnp | grep 3000

# 强制重新创建容器
docker compose up -d --force-recreate
```

### 7.2 应用无法访问

```bash
# 检查容器网络
docker network ls
docker network inspect ai-travel-network

# 检查防火墙
sudo ufw status
sudo ufw allow 3000

# 检查 Nginx 配置
docker compose exec nginx nginx -t

# 重启 Nginx
docker compose restart nginx
```

### 7.3 性能问题

```bash
# 查看容器资源使用
docker stats

# 限制容器资源
# 在 docker-compose.yml 中添加:
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## 8. 安全加固

### 8.1 配置 HTTPS

```bash
# 安装 Certbot
sudo apt-get install certbot

# 生成 SSL 证书
sudo certbot certonly --standalone -d your-domain.com

# 证书会保存在 /etc/letsencrypt/live/your-domain.com/

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# 修改权限
sudo chmod 644 nginx/ssl/fullchain.pem
sudo chmod 600 nginx/ssl/privkey.pem

# 重启 Nginx
docker compose restart nginx
```

### 8.2 防火墙配置

```bash
# Ubuntu UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status

# CentOS FirewallD
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 8.3 定期更新

```bash
# 创建更新脚本
cat > update.sh <<'EOF'
#!/bin/bash
echo "开始更新..."
docker compose pull
docker compose down
docker compose up -d
docker image prune -f
echo "更新完成！"
EOF

chmod +x update.sh

# 配置定时任务（每周日凌晨 2 点更新）
crontab -e
# 添加: 0 2 * * 0 /path/to/update.sh >> /path/to/update.log 2>&1
```

---

## 9. 生产环境清单

部署到生产环境前，请确认以下事项：

- [ ] 已配置所有必需的环境变量
- [ ] 已配置 HTTPS（强烈推荐）
- [ ] 已配置防火墙规则
- [ ] 已设置日志轮转
- [ ] 已配置自动备份
- [ ] 已配置监控告警
- [ ] 已测试健康检查端点
- [ ] 已测试容器重启恢复
- [ ] 已准备应急回滚方案
- [ ] 已配置域名 DNS 解析

---

## 10. 参考资料

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 配置指南](https://nginx.org/en/docs/)
- [Let's Encrypt 证书](https://letsencrypt.org/)

---

## 附录：完整部署脚本

```bash
#!/bin/bash
# filepath: ~/ai-travel-planner/deploy.sh

set -e

echo "==================================="
echo "AI 旅行规划师 - 自动部署脚本"
echo "==================================="

# 1. 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

# 2. 创建目录
mkdir -p ~/ai-travel-planner/{data,logs,nginx/conf.d,nginx/ssl}
cd ~/ai-travel-planner

# 3. 下载配置文件（如果不存在）
if [ ! -f "docker-compose.yml" ]; then
    echo "下载 docker-compose.yml..."
    wget https://raw.githubusercontent.com/your-username/ai-travel-planner/main/docker-compose.yml
fi

if [ ! -f ".env" ]; then
    echo "下载 .env.example..."
    wget https://raw.githubusercontent.com/your-username/ai-travel-planner/main/.env.example -O .env
    echo "请编辑 .env 文件，填入必要的配置"
    exit 0
fi

# 4. 拉取镜像
echo "拉取最新镜像..."
docker compose pull

# 5. 启动服务
echo "启动服务..."
docker compose up -d

# 6. 等待服务就绪
echo "等待服务启动..."
sleep 10

# 7. 检查状态
echo "检查服务状态..."
docker compose ps

# 8. 显示访问地址
IP=$(hostname -I | awk '{print $1}')
echo ""
echo "==================================="
echo "部署完成！"
echo "访问地址: http://$IP:3000"
echo "查看日志: docker compose logs -f"
echo "==================================="
```

---

**文档版本**: v1.0  
**维护人**: 开发团队  
**最后更新**: 2025-01-XX
