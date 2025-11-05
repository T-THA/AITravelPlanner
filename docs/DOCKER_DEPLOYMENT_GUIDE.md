# Docker镜像部署指南

## 目录
- [方案一：从阿里云镜像仓库拉取](#方案一从阿里云镜像仓库拉取)
- [方案二：从GitHub Release下载镜像](#方案二从github-release下载镜像)
- [运行容器](#运行容器)
- [验证部署](#验证部署)
- [故障排除](#故障排除)

---

## 方案一：从阿里云镜像仓库拉取

### 推送者操作步骤

#### 1. 登录阿里云容器镜像服务

首先在[阿里云容器镜像服务控制台](https://cr.console.aliyun.com/)创建：
- **命名空间**（如：`your-namespace`）
- **镜像仓库**（如：`ai-travel-planner`）

```bash
# 登录阿里云镜像仓库（使用您的阿里云账号）
docker login --username=YOUR_ALIYUN_USERNAME registry.cn-hangzhou.aliyuncs.com
# 输入密码（或使用访问凭证）
```

#### 2. 打标签并推送

```bash
# 打标签（替换YOUR_NAMESPACE为您的命名空间）
docker tag ai-travel-planner:latest registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:latest
docker tag ai-travel-planner:latest registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:v1.0.0

# 推送到阿里云
docker push registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:latest
docker push registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:v1.0.0
```

#### 3. 设置仓库为公开（可选）

在阿里云控制台将仓库设置为**公开**，这样助教无需登录即可拉取。

### 使用者（助教）操作步骤

#### 拉取镜像

```bash
# 如果仓库是公开的，直接拉取
docker pull registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:latest

# 如果仓库是私有的，需要先登录
docker login --username=PROVIDED_USERNAME registry.cn-hangzhou.aliyuncs.com
docker pull registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:latest
```

---

## 方案二：从GitHub Release下载镜像

### 推送者操作步骤

#### 1. 导出Docker镜像

```bash
# 导出镜像为tar文件
docker save ai-travel-planner:latest -o ai-travel-planner-v1.0.0.tar

# 压缩文件（可选但强烈推荐，可减少约66%大小）
gzip -9 ai-travel-planner-v1.0.0.tar
# 压缩后：135MB → 46MB
```

#### 2. 计算文件校验和（用于验证完整性）

```bash
# Linux/macOS
sha256sum ai-travel-planner-v1.0.0.tar.gz

# Windows PowerShell
Get-FileHash ai-travel-planner-v1.0.0.tar.gz -Algorithm SHA256
```

#### 3. 上传到GitHub Release

1. 在GitHub仓库创建新的Release（`v1.0.0`）
2. 上传 `ai-travel-planner-v1.0.0.tar.gz` 作为Release附件
3. 在Release描述中添加：
   - 镜像大小信息
   - SHA256校验和
   - 使用说明

**Release描述示例**：

```markdown
## AI旅行规划师 v1.0.0 - Docker镜像发布

### 📦 镜像信息
- **镜像名称**: ai-travel-planner
- **版本**: v1.0.0
- **压缩大小**: 46MB
- **解压后大小**: 135MB
- **基础镜像**: node:18-alpine + nginx
- **SHA256**: [填入计算的校验和]

### 🚀 快速开始

#### 1. 下载镜像文件
下载下方附件 `ai-travel-planner-v1.0.0.tar.gz`

#### 2. 验证文件完整性（可选）
\`\`\`bash
# Linux/macOS
echo "[SHA256值]  ai-travel-planner-v1.0.0.tar.gz" | sha256sum -c

# Windows PowerShell
$hash = (Get-FileHash ai-travel-planner-v1.0.0.tar.gz -Algorithm SHA256).Hash
if ($hash -eq "[SHA256值]") { "✓ 文件完整" } else { "✗ 文件损坏" }
\`\`\`

#### 3. 解压并加载镜像
\`\`\`bash
# 解压
gunzip ai-travel-planner-v1.0.0.tar.gz

# 加载镜像到Docker
docker load -i ai-travel-planner-v1.0.0.tar
\`\`\`

#### 4. 运行容器
参见下方"运行容器"章节
```

### 使用者（助教）操作步骤

#### 1. 下载镜像文件

从GitHub Release页面下载 `ai-travel-planner-v1.0.0.tar.gz`

#### 2. 解压文件

```bash
# Linux/macOS/WSL
gunzip ai-travel-planner-v1.0.0.tar.gz

# Windows PowerShell
Expand-Archive ai-travel-planner-v1.0.0.tar.gz -DestinationPath .
```

#### 3. 加载镜像到Docker

```bash
docker load -i ai-travel-planner-v1.0.0.tar
```

输出示例：
```
Loaded image: ai-travel-planner:latest
```

#### 4. 验证镜像已加载

```bash
docker images | grep ai-travel-planner
```

输出示例：
```
ai-travel-planner   latest    8707495d3a08   10 minutes ago   138MB
```

---

## 运行容器

### 配置环境变量

创建 `.env` 文件或直接在命令行中指定以下环境变量：

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `VITE_DASHSCOPE_API_KEY` | 阿里云百炼API密钥 | `sk-xxx` |
| `VITE_IFLYTEK_APP_ID` | 讯飞语音应用ID | `xxx` |
| `VITE_IFLYTEK_API_KEY` | 讯飞语音API密钥 | `xxx` |
| `VITE_IFLYTEK_API_SECRET` | 讯飞语音API密钥 | `xxx` |
| `VITE_AMAP_KEY` | 高德地图Web服务密钥 | `xxx` |
| `VITE_SUPABASE_URL` | Supabase项目URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase匿名密钥 | `eyJxxx` |

### 启动容器

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

**参数说明**：
- `-d`: 后台运行
- `--name`: 容器名称
- `-p 3000:80`: 将容器80端口映射到主机3000端口
- `-e`: 设置环境变量

### 使用环境变量文件（推荐）

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

然后运行：

```bash
docker run -d \
  --name ai-travel-planner \
  -p 3000:80 \
  --env-file env.list \
  ai-travel-planner:latest
```

---

## 验证部署

### 1. 检查容器状态

```bash
docker ps | grep ai-travel-planner
```

预期输出：
```
CONTAINER ID   IMAGE                        STATUS          PORTS
xxx            ai-travel-planner:latest     Up 10 seconds   0.0.0.0:3000->80/tcp
```

### 2. 测试健康检查

```bash
curl http://localhost:3000/health
```

预期输出：
```
healthy
```

### 3. 验证环境变量注入

```bash
docker exec ai-travel-planner cat /usr/share/nginx/html/env-config.js
```

预期输出：
```javascript
window._env_ = {
  VITE_DASHSCOPE_API_KEY: "sk-xxx",
  VITE_IFLYTEK_APP_ID: "xxx",
  ...
};
```

### 4. 访问应用

打开浏览器访问：`http://localhost:3000`

### 5. 查看容器日志

```bash
# 查看实时日志
docker logs -f ai-travel-planner

# 查看最近100行日志
docker logs --tail 100 ai-travel-planner
```

---

## 故障排除

### 容器无法启动

**检查日志**：
```bash
docker logs ai-travel-planner
```

**常见原因**：
1. 端口被占用：更换端口 `-p 8080:80`
2. 环境变量缺失：确保所有必需的环境变量都已设置

### 无法访问应用

**检查防火墙**：
```bash
# Linux
sudo ufw allow 3000

# Windows
# 在防火墙设置中允许TCP 3000端口
```

**检查端口映射**：
```bash
docker port ai-travel-planner
```

### 健康检查失败

```bash
# 进入容器检查
docker exec -it ai-travel-planner sh

# 测试nginx配置
nginx -t

# 检查nginx进程
ps aux | grep nginx
```

### 环境变量未生效

```bash
# 检查env-config.js是否生成
docker exec ai-travel-planner cat /usr/share/nginx/html/env-config.js

# 重启容器
docker restart ai-travel-planner
```

### 重新部署

```bash
# 停止并删除旧容器
docker stop ai-travel-planner
docker rm ai-travel-planner

# 删除旧镜像（可选）
docker rmi ai-travel-planner:latest

# 重新加载/拉取镜像并运行
```

---

## 容器管理命令

```bash
# 启动容器
docker start ai-travel-planner

# 停止容器
docker stop ai-travel-planner

# 重启容器
docker restart ai-travel-planner

# 删除容器
docker rm ai-travel-planner

# 查看容器详细信息
docker inspect ai-travel-planner

# 进入容器终端
docker exec -it ai-travel-planner sh
```

---

## 镜像信息

- **镜像名称**: `ai-travel-planner:latest`
- **基础镜像**: `node:18-alpine`
- **Web服务器**: nginx
- **镜像大小**: 138MB
- **压缩包大小**: 46MB (tar.gz)
- **支持架构**: linux/amd64

---

## 技术架构

### 镜像构建
- **多阶段构建**: 第一阶段构建前端，第二阶段部署nginx
- **Alpine Linux**: 轻量级基础镜像
- **运行时环境变量注入**: 容器启动时动态生成配置

### Nginx配置特性
- ✅ Gzip压缩（减少传输大小）
- ✅ 静态资源缓存（1年）
- ✅ SPA路由支持（`try_files`）
- ✅ 健康检查端点（`/health`）
- ✅ API代理（解决CORS问题）
- ✅ 安全头（X-Frame-Options, X-Content-Type-Options等）

---

## 联系方式

如有问题，请：
1. 查看项目GitHub Issues
2. 查看完整文档：`docs/USER_GUIDE.md`
3. 联系项目维护者

---

**最后更新**: 2025年11月5日
