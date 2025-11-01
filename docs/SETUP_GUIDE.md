# 开发环境搭建指南

## 文档信息

- **适用对象**: 开发人员
- **操作系统**: Windows / macOS / Linux
- **预计时间**: 30-60 分钟
- **最后更新**: 2025-01-XX

---

## 1. 前置要求

### 1.1 必备软件

| 软件 | 版本要求 | 下载链接 |
|------|---------|---------|
| Node.js | ≥ 18.0.0 | https://nodejs.org/ |
| Git | ≥ 2.30.0 | https://git-scm.com/ |
| VS Code | 最新版 | https://code.visualstudio.com/ |

### 1.2 推荐 VS Code 插件

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

---

## 2. 项目初始化

### 2.1 创建项目

```bash
# 使用 Vite 创建 React + TypeScript 项目
npm create vite@latest ai-travel-planner -- --template react-ts

# 进入项目目录
cd ai-travel-planner
```

### 2.2 安装依赖

```bash
# 安装核心依赖
npm install

# 安装项目依赖
npm install \
  react-router-dom \
  zustand \
  axios \
  antd \
  @supabase/supabase-js \
  echarts \
  echarts-for-react \
  dayjs

# 安装开发依赖
npm install -D \
  @types/node \
  eslint \
  prettier \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-config-prettier \
  eslint-plugin-react \
  eslint-plugin-react-hooks
```

### 2.3 配置 TypeScript

更新 `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 2.4 配置 Vite

更新 `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
```

---

## 3. 代码规范配置

### 3.1 ESLint 配置

创建 `.eslintrc.cjs`:

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint', 'react'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
```

### 3.2 Prettier 配置

创建 `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

创建 `.prettierignore`:

```
node_modules
dist
build
.next
coverage
```

### 3.3 添加 npm 脚本

更新 `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 4. 环境变量配置

### 4.1 创建环境变量文件

创建 `.env.local`:

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
VITE_AMAP_SECRET=your_amap_secret

# 阿里云百炼
VITE_BAILIAN_API_KEY=your_bailian_api_key
```

### 4.2 创建示例文件

创建 `.env.example`:

```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# 科大讯飞
VITE_XUNFEI_APPID=
VITE_XUNFEI_API_SECRET=
VITE_XUNFEI_API_KEY=

# 高德地图
VITE_AMAP_KEY=
VITE_AMAP_SECRET=

# 阿里云百炼
VITE_BAILIAN_API_KEY=
```

### 4.3 配置 .gitignore

```
# 环境变量
.env
.env.local
.env.*.local

# 依赖
node_modules

# 构建产物
dist
dist-ssr
*.local

# 编辑器
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea
*.swp
*.swo
*~

# 操作系统
.DS_Store
Thumbs.db

# 日志
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
```

---

## 5. 项目结构搭建

### 5.1 创建目录结构

```bash
mkdir -p src/{assets,components,pages,services,stores,utils,types,hooks,constants}
```

### 5.2 推荐项目结构

```
ai-travel-planner/
├── public/
├── src/
│   ├── assets/          # 静态资源
│   │   ├── images/
│   │   └── icons/
│   ├── components/      # 通用组件
│   │   ├── common/      # 基础组件
│   │   ├── layout/      # 布局组件
│   │   └── features/    # 业务组件
│   ├── pages/           # 页面组件
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Trips/
│   │   └── Profile/
│   ├── services/        # API 服务
│   │   ├── supabase.ts
│   │   ├── speech.ts
│   │   ├── map.ts
│   │   └── llm.ts
│   ├── stores/          # 状态管理
│   │   ├── authStore.ts
│   │   ├── tripStore.ts
│   │   └── uiStore.ts
│   ├── hooks/           # 自定义 Hooks
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript 类型
│   ├── constants/       # 常量
│   ├── router/          # 路由配置
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── .env.local
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 6. 启动项目

### 6.1 开发环境

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 6.2 生产构建

```bash
# 类型检查
npm run type-check

# 代码检查
npm run lint

# 构建
npm run build

# 预览构建结果
npm run preview
```

---

## 7. 常见问题

### 7.1 Node 版本问题

```bash
# 检查 Node 版本
node -v

# 使用 nvm 切换版本（推荐）
nvm install 18
nvm use 18
```

### 7.2 依赖安装失败

```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 7.3 端口被占用

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5173
kill -9 <PID>
```

### 7.4 路径别名不生效

确保已安装并配置：

```bash
npm install -D @types/node
```

然后在 `vite.config.ts` 中配置 alias。

---

## 8. 开发工具推荐

### 8.1 Chrome 扩展

- React Developer Tools
- Redux DevTools
- JSON Viewer
- Wappalyzer

### 8.2 命令行工具

```bash
# 全局安装常用工具
npm install -g pnpm
npm install -g vercel
npm install -g @supabase/cli
```

---

## 9. 下一步

环境搭建完成后，请参考以下文档继续配置：

1. [Supabase 配置指南](./SUPABASE_SETUP.md) - 配置数据库和认证
2. [API 配置指南](./API_SETUP.md) - 配置各项第三方 API
3. [数据库设计文档](./DATABASE_DESIGN.md) - 了解数据库结构
4. [Git 工作流程](./GIT_WORKFLOW.md) - 代码版本管理规范

---

**文档版本**: v1.0  
**维护人**: 开发团队  
**最后更新**: 2025-01-XX
