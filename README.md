# AITravelPlanner

## 项目简介

AI 旅行规划师是一款基于人工智能的智能旅行规划 Web 应用，通过语音交互和大语言模型，为用户提供个性化的旅行路线规划、预算管理和实时旅行辅助服务。

---

## 核心功能

### 1. 智能行程规划
用户可以通过语音（或文字，语音功能一定要有）输入旅行目的地、日期、预算、同行人数、旅行偏好（例如："我想去日本，5 天，预算 1 万元，喜欢美食和动漫，带孩子"），AI 会自动生成个性化的旅行路线，包括交通、住宿、景点、餐厅等详细信息。

### 2. 费用预算与管理
由 AI 进行预算分析，记录旅行开销（推荐可以使用语音）。

### 3. 用户管理与数据存储
- **注册登录系统**: 用户可以保存和管理多份旅行计划
- **云端行程同步**: 旅行计划、偏好设置、费用记录等数据云端同步，方便多设备查看和修改

---

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript + Vite |
| UI 组件库 | Ant Design |
| 状态管理 | Zustand |
| 数据库 | Supabase (PostgreSQL) |
| 用户认证 | Supabase Auth (邮箱注册) |
| 语音识别 | 科大讯飞 Web API |
| 地图服务 | 高德地图 Web API |
| 大语言模型 | 阿里云百炼平台（通义千问） |
| 数据可视化 | ECharts |
| 容器化 | Docker + Docker Compose |

---

## 快速开始

### 方式一：Docker 部署（推荐）

#### 前置要求
- Docker Engine 20.10+

#### 部署步骤

**详细部署说明请查看**: [Docker 快速开始指南](./DOCKER_QUICK_START.md)

1. **构建或获取镜像**

方案A - 本地构建:
```bash
# 克隆代码仓库
git clone https://github.com/T-THA/AITravelPlanner.git
cd AITravelPlanner

# 构建镜像
docker build -t ai-travel-planner:latest .
```

方案B - 从GitHub Release下载:
```bash
# 从发布页面下载镜像包
wget https://github.com/T-THA/AITravelPlanner/releases/download/vX.X.X/ai-travel-planner.tar.gz

# 解压并加载
tar -xzf ai-travel-planner.tar.gz
docker load -i ai-travel-planner.tar
```

2. **准备配置文件**
```bash
# 复制示例脚本
cp docker-run.sh.example docker-run.sh

# 编辑配置，填入您的API密钥
vim docker-run.sh
```

3. **启动容器**
```bash
# 使用配置脚本运行
bash docker-run.sh

# 或手动运行（需替换环境变量）
docker run -d \
  --name ai-travel-planner \
  -p 3000:80 \
  -e VITE_SUPABASE_URL="your_supabase_url" \
  -e VITE_SUPABASE_ANON_KEY="your_supabase_key" \
  -e VITE_ALIYUN_API_KEY="your_aliyun_key" \
  -e VITE_IFLYTEK_APP_ID="your_iflytek_appid" \
  -e VITE_IFLYTEK_API_KEY="your_iflytek_key" \
  -e VITE_IFLYTEK_API_SECRET="your_iflytek_secret" \
  -e VITE_AMAP_KEY="your_amap_key" \
  ai-travel-planner:latest
```

4. **验证部署**
```bash
# 检查容器状态
docker ps | grep ai-travel-planner

# 查看日志
docker logs ai-travel-planner

# 健康检查
curl http://localhost:3000
```

5. **访问应用**
```
浏览器访问: http://localhost:3000
或服务器IP: http://your-server-ip:3000
```

更多部署方案(阿里云镜像仓库/导出镜像等)请查看: [Docker 快速开始指南](./DOCKER_QUICK_START.md)

---

### 方式二：本地开发

#### 前置要求
- Node.js 18+
- npm 或 pnpm

#### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/T-THA/AITravelPlanner.git
cd AITravelPlanner

# 2. 安装前端依赖
cd frontend
npm install

# 3. 配置环境变量
# 在 frontend 目录下创建 .env 文件
# 参考 .env.example 填入各项 API Key

# 4. 启动开发服务器
npm run dev

# 5. 访问 http://localhost:5173
```

**开发服务器配置提示**:
- 如果在WSL中开发，需要绑定到所有网络接口: `npm run dev -- --host 0.0.0.0`
- 更改端口: `npm run dev -- --port 3000`

---

## 📚 项目文档

### 核心文档
- [PRD 产品需求文档](./PRD.md) - 详细功能需求和验收标准
- [工作计划文档](./WORK_PLAN.md) - 开发计划和里程碑

### 技术文档
- [数据库设计文档](./docs/DATABASE_DESIGN.md) - 完整的数据库表结构和 SQL
- [技术选型文档](./docs/TECH_STACK.md) - 技术栈选择和决策理由
- [Prompt 模板文档](./docs/PROMPTS.md) - LLM Prompt 设计和优化

### 配置指南
- [开发环境搭建指南](./docs/SETUP_GUIDE.md) - 从零开始搭建开发环境
- [Supabase 配置指南](./docs/SUPABASE_SETUP.md) - 数据库和认证配置
- [第三方 API 配置指南](./docs/API_SETUP.md) - 各项第三方服务配置

### 部署文档
- [Docker 部署指南](./docs/DOCKER_DEPLOYMENT.md) - 生产环境部署说明
- [服务器配置指南](./docs/SERVER_SETUP.md) - 服务器环境准备

### 开发规范
- [Git 工作流程文档](./docs/GIT_WORKFLOW.md) - 分支策略和 Commit 规范

---

## 环境变量配置

必需的环境变量(在 `frontend/.env` 中配置):

```bash
# Supabase (数据库和认证)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 阿里云百炼 (LLM服务 - OpenAI兼容接口)
VITE_ALIYUN_API_KEY=your_aliyun_api_key
VITE_ALIYUN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
VITE_ALIYUN_MODEL_NAME=qwen-plus

# 科大讯飞 (语音识别)
VITE_IFLYTEK_APP_ID=your_iflytek_appid
VITE_IFLYTEK_API_KEY=your_iflytek_api_key
VITE_IFLYTEK_API_SECRET=your_iflytek_api_secret

# 高德地图 (地图服务)
VITE_AMAP_KEY=your_amap_key
```

**配置说明**: 详细的API申请和配置步骤请查看 [API配置指南](./docs/API_SETUP.md)

---

## 常用命令

### 开发命令 (在 frontend 目录下)
```bash
npm run dev          # 启动开发服务器 (http://localhost:5173)
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
npm run lint         # ESLint代码检查
npm run type-check   # TypeScript类型检查
```

### Docker 命令
```bash
# 构建镜像
docker build -t ai-travel-planner:latest .

# 运行容器
docker run -d --name ai-travel-planner -p 3000:80 --env-file .env ai-travel-planner:latest

# 查看日志
docker logs -f ai-travel-planner

# 停止容器
docker stop ai-travel-planner

# 删除容器
docker rm ai-travel-planner

# 导出镜像
docker save ai-travel-planner:latest | gzip > ai-travel-planner.tar.gz

# 导入镜像
docker load -i ai-travel-planner.tar
```

---

## 项目结构

```
AITravelPlanner/
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── assets/        # 静态资源
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   │   ├── llm.ts            # LLM服务(通义千问)
│   │   │   ├── iflytek.ts        # 讯飞语音识别(实时)
│   │   │   ├── iflytekFile.ts    # 讯飞语音识别(文件)
│   │   │   ├── amap.ts           # 高德地图服务
│   │   │   └── supabase.ts       # Supabase客户端
│   │   ├── stores/        # Zustand状态管理
│   │   ├── utils/         # 工具函数
│   │   ├── types/         # TypeScript类型定义
│   │   └── prompts/       # LLM Prompt模板
│   ├── public/            # 公共资源
│   │   └── env-config.js  # 运行时环境变量注入
│   ├── package.json
│   └── vite.config.ts
├── docs/                  # 项目文档
│   ├── API_SETUP.md              # API配置指南
│   ├── DATABASE_DESIGN.md        # 数据库设计
│   ├── DOCKER_DEPLOYMENT.md      # Docker部署文档
│   ├── SUPABASE_SETUP.md         # Supabase配置
│   └── ...                       # 其他文档
├── docker/                # Docker相关文件
│   ├── nginx.conf         # Nginx配置
│   └── docker-entrypoint.sh      # 容器启动脚本
├── database/              # 数据库初始化脚本
│   └── init.sql
├── Dockerfile             # Docker镜像构建文件
├── docker-run.sh.example  # Docker运行脚本示例
├── DOCKER_QUICK_START.md  # Docker快速开始指南
├── PRD.md                 # 产品需求文档
├── WORK_PLAN.md          # 工作计划
└── README.md             # 项目说明
```

---

## 系统要求

### 生产环境
- **操作系统**: Linux (Ubuntu 20.04+ / CentOS 7+) 或 Docker 支持的任意系统
- **内存**: 最低 2GB，推荐 4GB+
- **存储**: 最低 10GB 可用空间
- **网络**: 稳定的互联网连接（访问第三方 API）

### 浏览器支持
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 故障排查

### Docker 相关

**问题1: 容器启动失败**
```bash
# 查看详细日志
docker logs ai-travel-planner

# 检查容器状态
docker ps -a | grep ai-travel-planner

# 重启容器
docker restart ai-travel-planner
```

**问题2: 端口被占用**
```bash
# 检查端口占用
netstat -tlnp | grep :3000  # Linux
lsof -i :3000               # macOS

# 修改映射端口
docker run -p 8080:80 ...   # 使用8080端口
```

**问题3: WSL2中无法从Windows访问**
- **解决方案A**: 使用开发服务器 `npm run dev -- --host 0.0.0.0`
- **解决方案B**: 配置WSL镜像网络模式(编辑 `~/.wslconfig`)
- **解决方案C**: 使用WSL IP地址访问 `http://192.168.x.x:3000`

详细说明: [Docker部署指南](./docs/DOCKER_DEPLOYMENT.md)

### 应用相关

**问题1: 语音识别在HTTP环境下不可用**
- **原因**: 浏览器安全策略要求HTTPS或localhost
- **解决方案**: 
  - 本地测试: 使用 `localhost`
  - 服务器部署: 配置HTTPS证书或使用文件上传方案
  - MediaRecorder在用户主动点击时可能在HTTP下工作

**问题2: API调用失败**
- 检查环境变量是否正确配置
- 验证API密钥是否有效
- 确认网络连接正常
- 查看浏览器控制台错误信息

**问题3: Supabase连接失败**
- 确认Supabase项目URL和密钥正确
- 检查数据库表是否已创建(参考 `database/init.sql`)
- 验证Row Level Security (RLS)策略配置

---

## 贡献指南

欢迎贡献代码!请遵循以下步骤:

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

**Commit规范**: 遵循 [Conventional Commits](https://www.conventionalcommits.org/)
- `feat:` 新功能
- `fix:` 修复Bug
- `docs:` 文档更新
- `refactor:` 代码重构
- `chore:` 构建/工具链更新

详细规范请查看: [Git 工作流程文档](./docs/GIT_WORKFLOW.md)

---

## 安全注意事项

⚠️ **敏感信息保护**:
- 切勿将API密钥提交到Git仓库
- `docker-run.sh` 已添加到 `.gitignore`
- 使用 `docker-run.sh.example` 作为模板
- 如果误提交敏感信息,请使用 `git filter-branch` 清理历史

---

## 许可证

[MIT License](./LICENSE)

---

## 联系方式

- **项目主页**: https://github.com/T-THA/AITravelPlanner
- **问题反馈**: https://github.com/T-THA/AITravelPlanner/issues

---

## 致谢

感谢以下开源项目和服务提供商:

- [React](https://react.dev/) - 前端框架
- [Vite](https://vitejs.dev/) - 构建工具
- [TypeScript](https://www.typescriptlang.org/) - 类型系统
- [Ant Design](https://ant.design/) - UI组件库
- [Supabase](https://supabase.com/) - 后端服务
- [阿里云百炼](https://bailian.console.aliyun.com/) - LLM服务
- [科大讯飞](https://www.xfyun.cn/) - 语音识别
- [高德地图](https://lbs.amap.com/) - 地图服务
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
- [ECharts](https://echarts.apache.org/) - 数据可视化

---

**版本**: v1.0.0  
**最后更新**: 2025-01-07
