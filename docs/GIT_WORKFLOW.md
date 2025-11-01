# Git 工作流程文档

## 文档信息

- **版本控制系统**: Git
- **代码托管平台**: GitHub
- **工作流模式**: Git Flow (简化版)
- **最后更新**: 2025-01-XX

---

## 1. 分支策略

### 1.1 主要分支

```
main (生产环境)
 ↑
dev (开发环境)
 ↑
feature/* (功能分支)
```

#### main 分支
- **用途**: 生产环境代码
- **保护**: 禁止直接推送
- **合并**: 仅接受来自 `dev` 的 Pull Request
- **命名**: `main`

#### dev 分支
- **用途**: 开发环境集成分支
- **保护**: 禁止直接推送
- **合并**: 接受来自 `feature/*` 的 Pull Request
- **命名**: `dev`

#### feature 分支
- **用途**: 功能开发
- **命名**: `feature/功能名称`
- **示例**: 
  - `feature/user-auth`
  - `feature/trip-generation`
  - `feature/voice-input`

### 1.2 辅助分支

#### hotfix 分支
- **用途**: 紧急修复生产环境bug
- **命名**: `hotfix/问题描述`
- **示例**: `hotfix/login-error`
- **合并**: 同时合并到 `main` 和 `dev`

#### bugfix 分支
- **用途**: 修复开发环境bug
- **命名**: `bugfix/问题描述`
- **示例**: `bugfix/map-loading`
- **合并**: 合并到 `dev`

---

## 2. Commit 规范

### 2.1 Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | `feat(auth): 添加邮箱登录功能` |
| fix | Bug修复 | `fix(map): 修复地图标记不显示问题` |
| docs | 文档更新 | `docs(readme): 更新安装说明` |
| style | 代码格式 | `style: 格式化代码缩进` |
| refactor | 重构 | `refactor(api): 重构LLM服务` |
| perf | 性能优化 | `perf(map): 优化地图加载速度` |
| test | 测试 | `test(auth): 添加登录单元测试` |
| chore | 构建/工具 | `chore: 更新依赖包版本` |
| revert | 回滚 | `revert: 回滚feat(auth)` |

#### Scope 范围

```typescript
// 常用 scope
const scopes = [
  'auth',        // 认证相关
  'trip',        // 行程相关
  'map',         // 地图相关
  'voice',       // 语音相关
  'budget',      // 预算相关
  'ui',          // UI组件
  'api',         // API服务
  'db',          // 数据库
  'config',      // 配置
  'deps'         // 依赖
]
```

#### Subject 主题

- 使用中文描述
- 不超过 50 个字符
- 不加句号
- 使用祈使句（"添加"而不是"添加了"）

#### Body 正文（可选）

- 详细描述改动原因和内容
- 可以分多行
- 与 subject 空一行

#### Footer 页脚（可选）

- 关联 Issue: `Closes #123`
- Breaking Changes: `BREAKING CHANGE: xxx`

### 2.2 Commit 示例

```bash
# 好的 commit
git commit -m "feat(auth): 添加邮箱注册功能

- 实现邮箱验证逻辑
- 添加密码强度检查
- 集成Supabase Auth

Closes #15"

# 简单 commit
git commit -m "fix(map): 修复地图标记点击事件"

# 文档 commit
git commit -m "docs(api): 补充语音识别API文档"
```

---

## 3. 工作流程

### 3.1 开始新功能

```bash
# 1. 切换到 dev 分支并更新
git checkout dev
git pull origin dev

# 2. 创建功能分支
git checkout -b feature/user-profile

# 3. 开发...
# 编写代码，定期提交

# 4. 提交代码
git add .
git commit -m "feat(profile): 添加用户资料编辑功能"

# 5. 推送到远程
git push origin feature/user-profile

# 6. 在 GitHub 创建 Pull Request
# dev ← feature/user-profile
```

### 3.2 代码审查流程

#### 提交 PR（Pull Request）

1. **标题**: 清晰描述改动内容
2. **描述**: 使用模板填写
3. **审查者**: 指定团队成员
4. **标签**: 添加相关标签

#### PR 描述模板

```markdown
## 改动说明
简要描述本次改动的内容和目的

## 改动类型
- [ ] 新功能
- [ ] Bug修复
- [ ] 重构
- [ ] 文档更新
- [ ] 其他

## 测试
- [ ] 本地测试通过
- [ ] 添加了单元测试
- [ ] 已在dev环境验证

## 截图（如果适用）
[添加截图]

## 相关 Issue
Closes #issue编号

## Checklist
- [ ] 代码符合规范
- [ ] 已添加必要注释
- [ ] 已更新相关文档
- [ ] 不影响现有功能
```

#### 审查要点

```typescript
// Code Review Checklist
const reviewChecklist = {
  code_quality: {
    readability: '代码可读性',
    consistency: '代码一致性',
    complexity: '复杂度是否合理'
  },
  functionality: {
    requirements: '是否满足需求',
    edge_cases: '边界情况处理',
    error_handling: '错误处理'
  },
  testing: {
    unit_tests: '单元测试覆盖',
    integration_tests: '集成测试'
  },
  documentation: {
    comments: '代码注释',
    readme: 'README更新'
  }
}
```

### 3.3 合并流程

```bash
# 1. 审查通过后，合并到 dev
# 在 GitHub 上点击 "Merge Pull Request"

# 2. 删除功能分支（可选）
git branch -d feature/user-profile
git push origin --delete feature/user-profile

# 3. 更新本地 dev 分支
git checkout dev
git pull origin dev
```

### 3.4 发布到生产

```bash
# 1. 从 dev 创建 release 分支
git checkout dev
git checkout -b release/v1.0.0

# 2. 测试并修复bug（如有）
# ...

# 3. 更新版本号
# 修改 package.json 中的 version

# 4. 合并到 main
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

# 5. 合并回 dev
git checkout dev
git merge release/v1.0.0
git push origin dev

# 6. 删除 release 分支
git branch -d release/v1.0.0
```

### 3.5 紧急修复（Hotfix）

```bash
# 1. 从 main 创建 hotfix 分支
git checkout main
git checkout -b hotfix/critical-bug

# 2. 修复bug
# ...

# 3. 提交
git commit -m "fix: 修复登录失败的严重bug"

# 4. 合并到 main
git checkout main
git merge hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix version 1.0.1"
git push origin main --tags

# 5. 合并到 dev
git checkout dev
git merge hotfix/critical-bug
git push origin dev

# 6. 删除 hotfix 分支
git branch -d hotfix/critical-bug
```

---

## 4. Git 配置

### 4.1 全局配置

```bash
# 用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 默认编辑器
git config --global core.editor "code --wait"

# 默认分支名
git config --global init.defaultBranch main

# 颜色输出
git config --global color.ui auto

# 推送策略
git config --global push.default current

# 自动换行
git config --global core.autocrlf input  # macOS/Linux
git config --global core.autocrlf true   # Windows
```

### 4.2 项目配置

创建 `.gitconfig` 文件：

```ini
[core]
    repositoryformatversion = 0
    filemode = false
    bare = false
    logallrefupdates = true
    ignorecase = true

[remote "origin"]
    url = https://github.com/username/ai-travel-planner.git
    fetch = +refs/heads/*:refs/remotes/origin/*

[branch "main"]
    remote = origin
    merge = refs/heads/main

[branch "dev"]
    remote = origin
    merge = refs/heads/dev
```

---

## 5. Git Hooks

### 5.1 安装 Husky

```bash
npm install -D husky lint-staged
npx husky install
```

### 5.2 配置 Pre-commit Hook

```bash
# 创建 pre-commit hook
npx husky add .husky/pre-commit "npm run lint-staged"
```

更新 `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### 5.3 配置 Commit-msg Hook

```bash
# 创建 commit-msg hook
npx husky add .husky/commit-msg "npx --no -- commitlint --edit $1"
```

安装 commitlint:

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

创建 `.commitlintrc.js`:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert'
      ]
    ],
    'subject-case': [0]  // 允许中文
  }
}
```

---

## 6. 常用命令

### 6.1 日常操作

```bash
# 查看状态
git status

# 查看差异
git diff
git diff --staged

# 查看日志
git log --oneline --graph --all

# 暂存更改
git stash
git stash pop

# 撤销更改
git checkout -- <file>
git reset HEAD <file>

# 修改最后一次commit
git commit --amend
```

### 6.2 分支操作

```bash
# 查看分支
git branch -a

# 切换分支
git checkout dev
git switch dev  # 新命令

# 创建并切换
git checkout -b feature/new-feature
git switch -c feature/new-feature  # 新命令

# 删除分支
git branch -d feature/old-feature
git push origin --delete feature/old-feature

# 重命名分支
git branch -m old-name new-name
```

### 6.3 远程操作

```bash
# 查看远程仓库
git remote -v

# 拉取更新
git fetch origin
git pull origin dev

# 推送
git push origin feature/my-feature

# 强制推送（谨慎使用）
git push --force-with-lease
```

### 6.4 高级操作

```bash
# 交互式 rebase
git rebase -i HEAD~3

# Cherry-pick
git cherry-pick <commit-hash>

# 查看某个文件的历史
git log --follow <file>

# 查找包含特定内容的commit
git log -S "function_name"

# 恢复已删除的分支
git reflog
git checkout -b recovered-branch <commit-hash>
```

---

## 7. 团队协作规范

### 7.1 分支生命周期

```
feature分支: 1-2周
  ↓
代码审查: 1-2天
  ↓
合并到dev: 立即
  ↓
测试验证: 1-3天
  ↓
发布到main: 每周五
```

### 7.2 Code Review 规则

1. **响应时间**: 24小时内
2. **审查人数**: 至少1人
3. **必须项**:
   - 代码符合规范
   - 功能正常运行
   - 添加必要测试
   - 更新相关文档

### 7.3 冲突解决

```bash
# 1. 更新本地代码
git checkout dev
git pull origin dev

# 2. 切换到功能分支
git checkout feature/my-feature

# 3. 合并 dev（解决冲突）
git merge dev

# 4. 解决冲突后提交
git add .
git commit -m "chore: 解决合并冲突"

# 5. 推送
git push origin feature/my-feature
```

---

## 8. 最佳实践

### 8.1 Do's ✅

- 经常提交，保持 commit 小而专注
- 写清晰的 commit message
- 在推送前先拉取最新代码
- 定期清理已合并的分支
- 使用 `.gitignore` 忽略不必要的文件
- 遇到问题先 `git pull`

### 8.2 Don'ts ❌

- 不要直接推送到 `main` 或 `dev`
- 不要提交大文件（>100MB）
- 不要提交敏感信息（密码、密钥）
- 不要使用 `git push --force`（除非确定）
- 不要在一个 commit 中混合多个功能
- 不要长时间不合并代码

---

## 9. 故障排查

### 9.1 常见问题

#### 问题1: Push 被拒绝

```bash
# 原因: 远程分支有新提交
# 解决:
git pull --rebase origin feature/my-feature
git push origin feature/my-feature
```

#### 问题2: 误删分支

```bash
# 使用 reflog 恢复
git reflog
git checkout -b recovered-branch <commit-hash>
```

#### 问题3: Commit 到错误分支

```bash
# 使用 cherry-pick 转移commit
git checkout correct-branch
git cherry-pick <commit-hash>

# 在错误分支上撤销
git checkout wrong-branch
git reset --hard HEAD~1
```

---

## 10. 工具推荐

### 10.1 GUI 工具

- **GitKraken**: 跨平台，可视化强
- **SourceTree**: 免费，功能全面
- **VS Code Git**: 内置，轻量级

### 10.2 命令行工具

```bash
# Oh My Zsh Git 插件
# 提供大量 git 别名

# 常用别名
gst  = git status
gco  = git checkout
gcb  = git checkout -b
gaa  = git add --all
gcmsg = git commit -m
gp   = git push
gl   = git pull
glog = git log --oneline --graph
```

---

## 11. 参考资料

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Pro Git Book](https://git-scm.com/book/zh/v2)

---

**文档版本**: v1.0  
**维护人**: 开发团队  
**最后更新**: 2025-01-XX
