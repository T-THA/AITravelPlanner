# AI 旅行规划师 - 前端项目

这是 AI 旅行规划师项目的前端部分，基于 React 18 + TypeScript + Vite 构建。

## 技术栈

- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **UI 组件库**: Ant Design
- **状态管理**: Zustand
- **路由**: React Router v6
- **数据库**: Supabase
- **HTTP 客户端**: Axios
- **数据可视化**: ECharts

## 项目结构

```
frontend/
├── src/
│   ├── assets/         # 静态资源
│   ├── components/     # 可复用组件
│   ├── pages/          # 页面组件
│   ├── services/       # API 服务
│   ├── stores/         # Zustand 状态管理
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   ├── hooks/          # 自定义 Hooks
│   ├── App.tsx         # 主应用组件
│   └── main.tsx        # 入口文件
├── public/             # 公共静态文件
└── package.json        # 项目依赖配置
```

## 开发环境配置

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 环境变量配置

1. 复制 `.env.example` 文件为 `.env`：

\`\`\`bash
cp .env.example .env
\`\`\`

2. 填写以下环境变量：

\`\`\`env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 科大讯飞语音识别 API
VITE_IFLYTEK_APP_ID=your_iflytek_app_id_here
VITE_IFLYTEK_API_KEY=your_iflytek_api_key_here
VITE_IFLYTEK_API_SECRET=your_iflytek_api_secret_here

# 高德地图 API
VITE_AMAP_KEY=your_amap_key_here
VITE_AMAP_SECRET=your_amap_secret_here

# 阿里云百炼平台 API
VITE_ALIYUN_API_KEY=your_aliyun_api_key_here
VITE_ALIYUN_MODEL_NAME=qwen-turbo
\`\`\`

### 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 http://localhost:5173 查看应用。

## 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建
- `npm run lint` - 运行 ESLint 检查
- `npm run lint:fix` - 自动修复 ESLint 问题
- `npm run format` - 使用 Prettier 格式化代码
- `npm run format:check` - 检查代码格式
- `npm run type-check` - 运行 TypeScript 类型检查

## 开发规范

### 代码风格

项目使用 ESLint 和 Prettier 来确保代码质量和一致性。

- 提交代码前请运行 `npm run lint:fix` 和 `npm run format`
- 使用 TypeScript 严格模式
- 遵循 React Hooks 规范

### Git 提交规范

遵循 Conventional Commits 规范：

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具链更新

示例：
\`\`\`
feat: 添加用户登录功能
fix: 修复注册页面表单验证问题
docs: 更新 README 文档
\`\`\`

## 当前进度

✅ 项目初始化完成
✅ 基础依赖安装完成
✅ 项目结构创建完成
✅ 认证服务集成 (Supabase)
✅ 基础页面框架搭建
⏳ 待完成: Supabase 配置与调试
⏳ 待完成: 第三方 API 集成

## 下一步计划

1. 配置 Supabase 数据库
2. 完善用户认证流程
3. 集成科大讯飞语音识别 API
4. 集成高德地图 API
5. 集成阿里云百炼平台 API

## 相关文档

- [工作计划](../WORK_PLAN.md)
- [产品需求文档](../PRD.md)
- [数据库设计](../docs/DATABASE_DESIGN.md)
- [API 配置指南](../docs/API_SETUP.md)
- [技术选型文档](../docs/TECH_STACK.md)

## 问题排查

如果遇到问题，请参考：

1. 检查 Node.js 版本是否符合要求 (>= 18.0.0)
2. 清除缓存并重新安装依赖：`rm -rf node_modules package-lock.json && npm install`
3. 检查环境变量配置是否正确
4. 查看控制台错误信息

## 联系方式

如有问题，请查阅项目文档或联系项目维护者。

import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
