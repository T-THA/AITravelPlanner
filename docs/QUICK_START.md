# 快速开始指南

## 📋 前置条件检查

在开始之前,请确保你已经安装:

- ✅ Node.js v20.19+ 或 v22.12+ (当前版本: v20.3.1 ⚠️ **需要升级**)
- ✅ npm v9.0+
- ✅ Git v2.30+
- ✅ VS Code (推荐)

## 🚀 快速启动步骤

### 1. 升级 Node.js (必需!)

当前 Node.js 版本 (v20.3.1) 不满足 Vite 7 的要求。

**下载并安装:**
- 访问 https://nodejs.org/
- 下载 LTS 版本 (v20.19+) 或 Current 版本 (v22.12+)
- 安装完成后验证: `node --version`

### 2. 安装依赖

```bash
cd f:\graduate\AITravelPlanner\frontend
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 或在 PowerShell 中
Copy-Item .env.example .env
```

然后编辑 `.env` 文件,填写你的 API 密钥:

```env
# Supabase 配置 (待配置)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# 科大讯飞语音识别 API (待配置)
VITE_IFLYTEK_APP_ID=
VITE_IFLYTEK_API_KEY=
VITE_IFLYTEK_API_SECRET=

# 高德地图 API (待配置)
VITE_AMAP_KEY=
VITE_AMAP_SECRET=

# 阿里云百炼平台 API (待配置)
VITE_ALIYUN_API_KEY=
VITE_ALIYUN_MODEL_NAME=qwen-turbo
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

## 📝 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 (带热更新) |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm run lint:fix` | 自动修复 ESLint 问题 |
| `npm run format` | 使用 Prettier 格式化代码 |
| `npm run format:check` | 检查代码格式是否符合规范 |
| `npm run type-check` | 运行 TypeScript 类型检查 |

## 🎯 下一步任务

### 立即执行 (阶段一 - 1.2 Supabase 配置)

1. **注册 Supabase 账号**
   - 访问 https://supabase.com
   - 创建新项目
   - 获取 API URL 和 anon key

2. **配置数据库**
   - 参考 `docs/SUPABASE_SETUP.md`
   - 运行 SQL 初始化脚本
   - 配置 RLS (行级安全策略)

3. **测试认证功能**
   - 测试用户注册
   - 测试用户登录
   - 验证邮箱验证流程

### 本周计划

- [ ] 完成 Supabase 配置与调试 (1天)
- [ ] 集成科大讯飞语音识别 API (1天)
- [ ] 集成高德地图 API (1天)
- [ ] 集成阿里云百炼平台 API (1天)
- [ ] 集成测试和文档更新 (1天)

## 🐛 常见问题

### Q1: 运行 `npm run dev` 报错

**问题**: `crypto.hash is not a function`

**原因**: Node.js 版本过低 (当前: v20.3.1, 需要: v20.19+)

**解决**: 升级 Node.js 到 v20.19+ 或 v22.12+

---

### Q2: 依赖安装失败

**解决方案**:
```bash
# 清除缓存
rm -rf node_modules package-lock.json
# 或 PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json

# 重新安装
npm install
```

---

### Q3: ESLint 或 Prettier 不工作

**解决方案**:
1. 确保已安装推荐的 VS Code 扩展
2. 重启 VS Code
3. 运行 `npm run lint:fix` 和 `npm run format`

## 📚 相关文档

- [工作计划](../WORK_PLAN.md) - 完整的开发计划
- [项目初始化报告](PROJECT_INIT_REPORT.md) - 初始化详细报告
- [Supabase 配置指南](SUPABASE_SETUP.md) - 数据库配置
- [API 配置指南](API_SETUP.md) - 第三方 API 配置
- [开发环境搭建指南](SETUP_GUIDE.md) - 详细配置说明

## 🎉 项目状态

当前进度: **阶段一 - 任务 1.1 完成** ✅

```
阶段一: 环境搭建与 API 调试
├── 1.1 项目初始化 ✅ 已完成
├── 1.2 Supabase 配置 ⏳ 进行中
├── 1.3 科大讯飞 API ⏳ 待开始
├── 1.4 高德地图 API ⏳ 待开始
└── 1.5 阿里云百炼 API ⏳ 待开始
```

## 💡 开发提示

1. **提交代码前**:
   ```bash
   npm run lint:fix
   npm run format
   npm run type-check
   ```

2. **Git 提交规范**:
   ```
   feat: 添加新功能
   fix: 修复 Bug
   docs: 文档更新
   style: 代码格式
   refactor: 代码重构
   test: 测试相关
   chore: 构建/工具
   ```

3. **环境变量安全**:
   - 永远不要提交 `.env` 文件
   - 使用 `.env.example` 作为模板
   - 敏感信息通过环境变量管理

---

祝开发顺利! 🚀
