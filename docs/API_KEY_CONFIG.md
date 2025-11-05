# API Key 配置方案

> **注意:** 本文档仅供本地保存,不提交到GitHub仓库

## 🔐 安全配置策略

本项目采用 **环境变量 + Docker运行时传参** 的组合方案:

- GitHub仓库和Docker镜像均不包含API Key
- 验收文档中提供完整的运行命令和真实Key
- 确保Key安全性,避免泄漏到公开仓库

---

## 📋 所需API Key列表

| 服务名称 | 环境变量名 | 用途 | 申请地址 |
|---------|-----------|------|---------|
| 通义千问 | `VITE_DASHSCOPE_API_KEY` | AI行程规划 | [阿里云DashScope](https://dashscope.aliyun.com/) |
| 讯飞语音 | `VITE_IFLYTEK_APP_ID` | 语音识别 | [讯飞开放平台](https://www.xfyun.cn/) |
| 讯飞语音 | `VITE_IFLYTEK_API_KEY` | 语音识别 | [讯飞开放平台](https://www.xfyun.cn/) |
| 讯飞语音 | `VITE_IFLYTEK_API_SECRET` | 语音识别 | [讯飞开放平台](https://www.xfyun.cn/) |
| 高德地图 | `VITE_AMAP_KEY` | 地图与POI搜索 | [高德开放平台](https://lbs.amap.com/) |

---

## 🚀 方案1: 本地开发环境配置

### 1.1 创建 .env 文件

在 `frontend/` 目录下创建 `.env` 文件:

```env
# 通义千问 API Key
VITE_DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# 讯飞语音识别配置
VITE_IFLYTEK_APP_ID=xxxxxxxx
VITE_IFLYTEK_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_IFLYTEK_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 高德地图 API Key
VITE_AMAP_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 1.2 运行前端项目

```bash
cd frontend
npm install
npm run dev
```

### 1.3 .gitignore 配置

确保 `.gitignore` 已包含:

```gitignore
.env
.env.local
.env.production
```

---

## 🐳 方案2: Docker运行时传参(推荐用于验收)

### 2.1 拉取Docker镜像

```bash
docker pull your-dockerhub-username/ai-travel-planner:latest
```

### 2.2 运行容器(完整命令)

```bash
docker run -d \
  --name ai-travel-planner \
  -p 3000:80 \
  -e VITE_DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx \
  -e VITE_IFLYTEK_APP_ID=xxxxxxxx \
  -e VITE_IFLYTEK_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  -e VITE_IFLYTEK_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  -e VITE_AMAP_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  your-dockerhub-username/ai-travel-planner:latest
```

### 2.3 访问应用

打开浏览器访问: `http://localhost:3000`

### 2.4 停止和删除容器

```bash
# 停止容器
docker stop ai-travel-planner

# 删除容器
docker rm ai-travel-planner
```

---

## 📝 验收文档模板

提供给助教的完整运行命令:

```bash
# 方式1: 使用Docker运行(推荐)
docker run -d \
  --name ai-travel-planner \
  -p 3000:80 \
  -e VITE_DASHSCOPE_API_KEY=sk-[真实Key] \
  -e VITE_IFLYTEK_APP_ID=[真实AppID] \
  -e VITE_IFLYTEK_API_KEY=[真实Key] \
  -e VITE_IFLYTEK_API_SECRET=[真实Secret] \
  -e VITE_AMAP_KEY=[真实Key] \
  your-dockerhub-username/ai-travel-planner:latest

# 访问地址
http://localhost:3000

# 方式2: 使用docker-compose运行
# 1. 创建 .env 文件并填入以下内容:
VITE_DASHSCOPE_API_KEY=sk-[真实Key]
VITE_IFLYTEK_APP_ID=[真实AppID]
VITE_IFLYTEK_API_KEY=[真实Key]
VITE_IFLYTEK_API_SECRET=[真实Secret]
VITE_AMAP_KEY=[真实Key]

# 2. 运行
docker-compose up -d
```

---

## 🔧 故障排除

### 问题1: API调用失败

**现象:** 控制台显示401/403错误

**解决:**

1. 检查环境变量是否正确设置
2. 验证API Key是否有效(未过期)
3. 确认API Key有相应的调用权限

### 问题2: 容器无法启动

**现象:** docker run命令报错

**解决:**

1. 检查端口3000是否被占用: `netstat -ano | findstr :3000`
2. 尝试更换端口: `-p 8080:80`
3. 查看容器日志: `docker logs ai-travel-planner`

### 问题3: 前端页面无法加载

**现象:** 浏览器显示"无法访问此网站"

**解决:**

1. 确认容器正在运行: `docker ps`
2. 检查防火墙设置
3. 尝试使用 `127.0.0.1:3000` 而不是 `localhost:3000`

---

## ⚠️ 安全注意事项

1. **切勿提交真实Key到GitHub**
   - 始终使用 `.env` 文件存储本地Key
   - 确保 `.gitignore` 包含 `.env`

2. **Docker镜像不包含Key**
   - 构建镜像时不打包 `.env` 文件
   - 运行时通过 `-e` 参数传入

3. **文档中的Key管理**
   - 验收文档单独提交,不上传GitHub
   - 考虑使用加密的压缩包提供给助教

4. **Key轮换策略**
   - 验收结束后建议重新生成新Key
   - 定期检查Key的使用情况和配额

---

## 📊 API配额说明

| 服务 | 免费额度 | 超限后处理 |
|-----|---------|-----------|
| 通义千问 | 100万token/月 | 按量付费 |
| 讯飞语音 | 500次/天 | 需充值 |
| 高德地图 | 30万次/天 | 无需付费 |

---

## 📞 技术支持

如验收过程中遇到问题,请联系:

- GitHub Issues: [项目地址]/issues
- Email: [您的邮箱]

---

**最后更新:** 2025年11月5日
