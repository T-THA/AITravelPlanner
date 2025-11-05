# AI旅行规划师 v1.0.0 - Docker镜像发布

## 📦 镜像信息

| 属性 | 值 |
|-----|---|
| **镜像名称** | ai-travel-planner |
| **版本** | v1.0.0 |
| **压缩包大小** | 46MB |
| **解压后大小** | 135MB |
| **镜像大小** | 138MB |
| **基础镜像** | node:18-alpine + nginx |
| **支持架构** | linux/amd64 |

**SHA256校验和**: 
```
5c2a16e2228d3351cd0372407d0c60179a2e3551c60e39e822f7f8eb757e82e7
```

---

## 🚀 快速开始

### 方法一：从GitHub Release下载（推荐用于课程提交）

#### 1. 下载镜像文件
点击下方 **Assets** 下载 `ai-travel-planner-v1.0.0.tar.gz` (46MB)

#### 2. 验证文件完整性（可选）

**Linux/macOS/WSL**:
```bash
echo "5c2a16e2228d3351cd0372407d0c60179a2e3551c60e39e822f7f8eb757e82e7  ai-travel-planner-v1.0.0.tar.gz" | sha256sum -c
```

**Windows PowerShell**:
```powershell
$hash = (Get-FileHash ai-travel-planner-v1.0.0.tar.gz -Algorithm SHA256).Hash
if ($hash -eq "5C2A16E2228D3351CD0372407D0C60179A2E3551C60E39E822F7F8EB757E82E7") { 
    "✓ 文件完整" 
} else { 
    "✗ 文件损坏，请重新下载" 
}
```

#### 3. 解压并加载镜像

**Linux/macOS/WSL**:
```bash
# 解压
gunzip ai-travel-planner-v1.0.0.tar.gz

# 加载到Docker
docker load -i ai-travel-planner-v1.0.0.tar
```

**Windows PowerShell**:
```powershell
# 如果已安装gzip
gzip -d ai-travel-planner-v1.0.0.tar.gz

# 或者使用7-Zip等工具解压

# 加载到Docker
docker load -i ai-travel-planner-v1.0.0.tar
```

#### 4. 验证镜像已加载
```bash
docker images | grep ai-travel-planner
```

预期输出：
```
ai-travel-planner   latest    8707495d3a08   10 minutes ago   138MB
```

### 方法二：从阿里云镜像仓库拉取（可选）

```bash
# 如果配置了阿里云镜像仓库
docker pull registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:v1.0.0
```

---

## 🎯 运行容器

### 准备API密钥

您需要准备以下API密钥（详见README.md获取方式）：

- ✅ 阿里云百炼API密钥
- ✅ 讯飞语音服务密钥
- ✅ 高德地图Web服务密钥
- ✅ Supabase项目配置

### 启动命令

```bash
docker run -d \
  --name ai-travel-planner \
  -p 3000:80 \
  -e VITE_DASHSCOPE_API_KEY="sk-xxx" \
  -e VITE_IFLYTEK_APP_ID="xxx" \
  -e VITE_IFLYTEK_API_KEY="xxx" \
  -e VITE_IFLYTEK_API_SECRET="xxx" \
  -e VITE_AMAP_KEY="xxx" \
  -e VITE_SUPABASE_URL="https://xxx.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="xxx" \
  ai-travel-planner:latest
```

**使用环境变量文件（推荐）**:

创建 `env.list` 文件：
```env
VITE_DASHSCOPE_API_KEY=sk-xxx
VITE_IFLYTEK_APP_ID=xxx
VITE_IFLYTEK_API_KEY=xxx
VITE_IFLYTEK_API_SECRET=xxx
VITE_AMAP_KEY=xxx
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

运行：
```bash
docker run -d \
  --name ai-travel-planner \
  -p 3000:80 \
  --env-file env.list \
  ai-travel-planner:latest
```

---

## ✅ 验证部署

### 1. 检查容器状态
```bash
docker ps | grep ai-travel-planner
```

### 2. 测试健康检查
```bash
curl http://localhost:3000/health
```
预期返回: `healthy`

### 3. 访问应用
打开浏览器访问: **http://localhost:3000**

### 4. 查看日志
```bash
docker logs ai-travel-planner
```

---

## 📚 完整文档

- **部署指南**: [docs/DOCKER_DEPLOYMENT_GUIDE.md](./docs/DOCKER_DEPLOYMENT_GUIDE.md)
- **用户手册**: [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)
- **API配置**: [docs/API_KEY_CONFIG.md](./docs/API_KEY_CONFIG.md)
- **项目README**: [README.md](./README.md)

---

## 🛠 技术特性

### 容器特性
- ✅ **运行时环境变量注入** - 启动时动态配置，无需重新构建镜像
- ✅ **健康检查** - 自动监控服务状态
- ✅ **多阶段构建** - 优化镜像大小
- ✅ **Alpine基础镜像** - 仅138MB

### Nginx配置优化
- ✅ Gzip压缩（减少70%传输大小）
- ✅ 静态资源长期缓存（1年）
- ✅ SPA单页应用路由支持
- ✅ API代理（解决CORS跨域问题）
- ✅ 安全响应头

### 应用功能
- 🎯 AI智能行程规划
- 🗣️ 语音交互输入
- 🗺️ 高德地图展示
- 💰 预算管理与分析
- 📱 响应式设计
- 🔐 用户认证系统

---

## ❓ 故障排除

### 容器启动失败
```bash
# 查看日志
docker logs ai-travel-planner

# 常见原因：
# 1. 端口被占用 -> 更换端口: -p 8080:80
# 2. 环境变量缺失 -> 检查所有环境变量是否设置
```

### 无法访问应用
```bash
# 检查容器状态
docker ps

# 检查端口映射
docker port ai-travel-planner

# 检查防火墙（Linux）
sudo ufw allow 3000
```

### 环境变量未生效
```bash
# 验证环境变量是否注入
docker exec ai-travel-planner cat /usr/share/nginx/html/env-config.js

# 重启容器
docker restart ai-travel-planner
```

---

## 📞 支持

遇到问题？
1. 查看 [完整部署指南](./docs/DOCKER_DEPLOYMENT_GUIDE.md)
2. 提交 [GitHub Issue](https://github.com/T-THA/AITravelPlanner/issues)
3. 查看项目文档目录

---

## 📝 更新日志

### v1.0.0 (2025-11-05)

**首次发布** 🎉

- ✅ 完整的Docker生产环境部署方案
- ✅ 运行时环境变量注入机制
- ✅ Nginx性能优化与安全加固
- ✅ 健康检查与日志监控
- ✅ 完善的文档体系

**镜像构建优化**:
- 使用Alpine Linux基础镜像（138MB）
- 多阶段构建分离构建和运行环境
- Docker layer缓存优化构建速度

**已知问题**:
- 无

---

## 📄 许可证

MIT License

---

**构建时间**: 2025年11月5日  
**维护者**: T-THA  
**仓库**: https://github.com/T-THA/AITravelPlanner
