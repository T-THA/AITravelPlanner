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
- Docker Compose 2.0+

#### 部署步骤

1. **下载 Docker 镜像**
```bash
# 从 Docker Hub 拉取（上线后）
docker pull your-dockerhub-username/ai-travel-planner:latest

# 或从发布页面下载镜像文件
docker load -i ai-travel-planner.tar
```

2. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入必要的 API Keys
nano .env
```

3. **启动服务**
```bash
# 使用 docker-compose 启动
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

4. **访问应用**
```
浏览器访问: http://localhost:3000
```

详细部署说明请查看：[Docker 部署指南](./docs/DOCKER_DEPLOYMENT.md)

---

### 方式二：本地开发

#### 前置要求
- Node.js 18+
- npm 或 pnpm

#### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd ai-travel-planner

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入各项 API Key

# 4. 启动开发服务器
npm run dev

# 5. 访问 http://localhost:5173
```

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

必需的环境变量：

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 科大讯飞
VITE_XUNFEI_APPID=your_xunfei_appid
VITE_XUNFEI_API_SECRET=your_xunfei_api_secret
VITE_XUNFEI_API_KEY=your_xunfei_api_key

# 高德地图
VITE_AMAP_KEY=your_amap_key

# 阿里云百炼
VITE_BAILIAN_API_KEY=your_bailian_api_key
```

---

## 常用命令

### 开发命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
npm run lint         # 代码检查
npm run format       # 代码格式化
npm run type-check   # 类型检查
```

### Docker 命令
```bash
docker-compose up -d           # 启动服务
docker-compose down            # 停止服务
docker-compose logs -f         # 查看日志
docker-compose restart         # 重启服务
docker-compose ps              # 查看状态
```

---

## 项目结构

```
ai-travel-planner/
├── src/                    # 源代码
│   ├── assets/            # 静态资源
│   ├── components/        # 组件
│   ├── pages/             # 页面
│   ├── services/          # API 服务
│   ├── stores/            # 状态管理
│   ├── utils/             # 工具函数
│   └── types/             # TypeScript 类型
├── docs/                  # 项目文档
├── public/                # 公共资源
├── docker/                # Docker 配置
├── .env.example           # 环境变量模板
├── docker-compose.yml     # Docker Compose 配置
├── Dockerfile             # Docker 镜像构建文件
├── package.json           # 项目配置
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

**问题**: 容器启动失败
```bash
# 查看详细日志
docker-compose logs

# 检查端口占用
netstat -tlnp | grep 3000
```

**问题**: 无法访问应用
```bash
# 检查容器状态
docker-compose ps

# 重启服务
docker-compose restart
```

### 应用相关

**问题**: API 调用失败
- 检查 `.env` 文件中的 API Keys 是否正确
- 确认网络连接正常
- 查看浏览器控制台错误信息

更多问题请查看：[常见问题 FAQ](./docs/FAQ.md)

---

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

详细规范请查看：[Git 工作流程文档](./docs/GIT_WORKFLOW.md)

---

## 许可证

[MIT License](./LICENSE)

---

## 联系方式

- **项目主页**: https://github.com/your-username/ai-travel-planner
- **问题反馈**: https://github.com/your-username/ai-travel-planner/issues
- **邮箱**: your-email@example.com

---

## 致谢

- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Ant Design](https://ant.design/)
- [阿里云百炼](https://bailian.console.aliyun.com/)
- [科大讯飞](https://www.xfyun.cn/)
- [高德地图](https://lbs.amap.com/)

---

**版本**: v1.0.0  
**最后更新**: 2025-01-XX
