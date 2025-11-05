# Docker镜像部署快速指南

本文档提供两种Docker镜像分发方案的快速操作步骤。

---

## 📦 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|-----|------|------|---------|
| **阿里云镜像仓库** | • 拉取速度快<br>• 操作简单<br>• 支持版本管理 | • 需要阿里云账号<br>• 可能需要登录 | 国内用户、生产环境 |
| **GitHub Release** | • 无需账号<br>• 便于验收<br>• 包含校验和 | • 下载速度慢<br>• 文件较大(46MB) | 课程提交、离线部署 |

---

## 方案一：推送到阿里云镜像仓库

### 前置准备

1. **创建阿里云账号** (如已有可跳过)
   - 访问: https://www.aliyun.com
   - 注册并完成实名认证

2. **开通容器镜像服务**
   - 访问: https://cr.console.aliyun.com
   - 开通服务（免费版即可）
   - 设置Registry登录密码

3. **创建命名空间和镜像仓库**
   - 命名空间: 例如 `your-namespace`
   - 仓库名称: `ai-travel-planner`
   - 访问级别: **公开**（助教无需登录）

### 操作步骤

#### 方法1: 使用自动化脚本（推荐）

```bash
# 1. 编辑脚本配置
vim push-to-aliyun.sh
# 修改以下两行:
#   ALIYUN_USERNAME="YOUR_ALIYUN_USERNAME"  # 替换为您的阿里云账号
#   NAMESPACE="YOUR_NAMESPACE"               # 替换为您的命名空间

# 2. 运行脚本
bash push-to-aliyun.sh

# 脚本会自动完成:
# ✅ 检查本地镜像
# ✅ 登录阿里云
# ✅ 打标签
# ✅ 推送镜像
# ✅ 显示拉取命令
```

#### 方法2: 手动操作

```bash
# 1. 登录阿里云
docker login --username=YOUR_ALIYUN_USERNAME registry.cn-hangzhou.aliyuncs.com
# 输入Registry登录密码

# 2. 打标签
docker tag ai-travel-planner:latest registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:latest
docker tag ai-travel-planner:latest registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:v1.0.0

# 3. 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:latest
docker push registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:v1.0.0
```

### 提供给助教的拉取命令

如果仓库设置为**公开**:

```bash
# 直接拉取（无需登录）
docker pull registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:latest

# 运行容器
docker run -d \
  --name ai-travel-planner \
  -p 3000:80 \
  --env-file env.list \
  registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:latest
```

如果仓库是**私有**:

```bash
# 先登录（使用提供的账号密码）
docker login --username=PROVIDED_USERNAME registry.cn-hangzhou.aliyuncs.com

# 然后拉取
docker pull registry.cn-hangzhou.aliyuncs.com/YOUR_NAMESPACE/ai-travel-planner:latest
```

---

## 方案二：打包到GitHub Release

### 操作步骤

#### 步骤1: 导出镜像文件

**方法1: 使用自动化脚本（推荐）**

```bash
# 运行导出脚本
bash export-docker-image.sh

# 脚本会自动完成:
# ✅ 检查本地镜像
# ✅ 导出为tar文件
# ✅ gzip压缩（135MB → 46MB）
# ✅ 计算SHA256校验和
# ✅ 显示后续步骤
```

**方法2: 手动操作**

```bash
# 1. 导出镜像
docker save ai-travel-planner:latest -o ai-travel-planner-v1.0.0.tar

# 2. 压缩文件
gzip -9 ai-travel-planner-v1.0.0.tar

# 3. 计算校验和
sha256sum ai-travel-planner-v1.0.0.tar.gz
```

#### 步骤2: 创建GitHub Release

1. **访问GitHub仓库** 
   - https://github.com/T-THA/AITravelPlanner

2. **创建新Release**
   - 点击右侧 `Releases` → `Draft a new release`
   - Tag: `v1.0.0`
   - Title: `AI旅行规划师 v1.0.0`

3. **编写Release说明**
   - 复制 `RELEASE_NOTES.md` 的内容
   - 粘贴到Release描述框

4. **上传文件**
   - 拖拽 `ai-travel-planner-v1.0.0.tar.gz` 到附件区域
   - 等待上传完成（46MB，约需1-2分钟）

5. **发布Release**
   - 检查信息无误
   - 点击 `Publish release`

#### 步骤3: 验证下载链接

```bash
# 测试下载链接是否可用
wget https://github.com/T-THA/AITravelPlanner/releases/download/v1.0.0/ai-travel-planner-v1.0.0.tar.gz

# 或使用curl
curl -L -O https://github.com/T-THA/AITravelPlanner/releases/download/v1.0.0/ai-travel-planner-v1.0.0.tar.gz
```

### 提供给助教的使用说明

**完整步骤**:

```bash
# 1. 下载镜像文件（从GitHub Release页面）
# 文件: ai-travel-planner-v1.0.0.tar.gz (46MB)
# SHA256: 5c2a16e2228d3351cd0372407d0c60179a2e3551c60e39e822f7f8eb757e82e7

# 2. 验证文件完整性（可选）
echo "5c2a16e2228d3351cd0372407d0c60179a2e3551c60e39e822f7f8eb757e82e7  ai-travel-planner-v1.0.0.tar.gz" | sha256sum -c

# 3. 解压文件
gunzip ai-travel-planner-v1.0.0.tar.gz

# 4. 加载镜像
docker load -i ai-travel-planner-v1.0.0.tar

# 5. 验证镜像
docker images | grep ai-travel-planner

# 6. 创建环境变量文件
cat > env.list << EOF
VITE_DASHSCOPE_API_KEY=sk-xxx
VITE_IFLYTEK_APP_ID=xxx
VITE_IFLYTEK_API_KEY=xxx
VITE_IFLYTEK_API_SECRET=xxx
VITE_AMAP_KEY=xxx
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
EOF

# 7. 运行容器
docker run -d \
  --name ai-travel-planner \
  -p 3000:80 \
  --env-file env.list \
  ai-travel-planner:latest

# 8. 验证部署
curl http://localhost:3000/health  # 应返回: healthy
# 访问 http://localhost:3000
```

---

## 🎯 推荐方案

### 课程作业提交 → GitHub Release

**原因**:
- ✅ 助教无需注册账号
- ✅ 文件包含完整性校验
- ✅ 符合课程提交要求
- ✅ 便于版本管理和存档

**操作**:
```bash
bash export-docker-image.sh
# 然后上传到GitHub Release
```

### 生产环境部署 → 阿里云镜像仓库

**原因**:
- ✅ 拉取速度快（国内网络）
- ✅ 支持版本管理
- ✅ 可以设置自动构建
- ✅ 专业的镜像服务

**操作**:
```bash
bash push-to-aliyun.sh
```

---

## 📝 文件清单

| 文件 | 说明 | 大小 |
|------|------|------|
| `ai-travel-planner-v1.0.0.tar.gz` | 压缩的Docker镜像 | 46MB |
| `RELEASE_NOTES.md` | GitHub Release说明模板 | - |
| `DOCKER_DEPLOYMENT_GUIDE.md` | 完整部署指南 | - |
| `push-to-aliyun.sh` | 阿里云推送自动化脚本 | - |
| `export-docker-image.sh` | 镜像导出自动化脚本 | - |
| `docs/USER_GUIDE.md` | 用户使用手册 | - |
| `docs/API_KEY_CONFIG.md` | API密钥配置指南 | - |

---

## ✅ 提交检查清单

### GitHub Release提交

- [ ] 已运行 `bash export-docker-image.sh`
- [ ] 已创建GitHub Release (v1.0.0)
- [ ] 已上传 `ai-travel-planner-v1.0.0.tar.gz`
- [ ] Release描述已填写（包含SHA256）
- [ ] 已测试下载链接
- [ ] README.md中已添加Release链接

### 阿里云镜像仓库提交

- [ ] 已创建阿里云命名空间
- [ ] 已创建镜像仓库
- [ ] 仓库已设置为公开
- [ ] 已运行 `bash push-to-aliyun.sh`
- [ ] 已验证镜像可以拉取
- [ ] README.md中已添加拉取命令

### 文档完整性

- [ ] `RELEASE_NOTES.md` - GitHub Release说明
- [ ] `DOCKER_DEPLOYMENT_GUIDE.md` - 部署指南
- [ ] `docs/USER_GUIDE.md` - 用户手册
- [ ] `docs/API_KEY_CONFIG.md` - API配置
- [ ] `README.md` - 主文档已更新

---

## 🆘 常见问题

### Q1: 如何选择阿里云区域？

**A**: 推荐使用 `cn-hangzhou`（默认），也可以选择：
- `cn-beijing` - 北京
- `cn-shanghai` - 上海
- `cn-shenzhen` - 深圳

修改脚本中的 `REGION` 变量即可。

### Q2: GitHub Release文件上传失败怎么办？

**A**: 
1. 检查网络连接
2. 使用代理或VPN
3. 尝试在其他时间段上传
4. 或使用阿里云镜像仓库方案

### Q3: 助教反馈无法拉取镜像？

**A**: 
1. **阿里云方案**: 确认仓库设置为**公开**
2. **GitHub方案**: 提供完整的使用步骤文档
3. 检查校验和是否匹配
4. 提供备用下载链接（如百度网盘）

### Q4: 如何更新镜像版本？

**A**:
```bash
# 1. 修改版本号
VERSION="v1.1.0"

# 2. 重新构建镜像
docker build -t ai-travel-planner:latest .

# 3. 导出/推送新版本
bash export-docker-image.sh
# 或
bash push-to-aliyun.sh
```

---

## 📞 获取帮助

- **完整文档**: [docs/DOCKER_DEPLOYMENT_GUIDE.md](./docs/DOCKER_DEPLOYMENT_GUIDE.md)
- **用户手册**: [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)
- **GitHub Issues**: https://github.com/T-THA/AITravelPlanner/issues

---

**最后更新**: 2025年11月5日
