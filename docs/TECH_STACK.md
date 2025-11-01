# 技术选型文档

## 文档信息

- **项目名称**: AI 旅行规划师
- **文档版本**: v1.0
- **最后更新**: 2025-01-XX

---

## 1. 技术选型总览

### 1.1 技术栈概览表

| 技术层 | 技术选型 | 版本 | 说明 |
|--------|---------|------|------|
| **前端框架** | React | 18.x | 现代化前端框架 |
| **开发语言** | TypeScript | 5.x | 类型安全 |
| **构建工具** | Vite | 5.x | 快速构建 |
| **UI 组件库** | Ant Design | 5.x | 企业级组件 |
| **状态管理** | Zustand | 4.x | 轻量级状态管理 |
| **路由** | React Router | 6.x | 单页应用路由 |
| **HTTP 客户端** | Axios | 1.x | HTTP 请求 |
| **数据可视化** | ECharts | 5.x | 图表展示 |
| **数据库** | Supabase (PostgreSQL) | - | 云端数据库 |
| **用户认证** | Supabase Auth | - | 邮箱认证 |
| **语音识别** | 科大讯飞 Web API | - | 中英文语音识别 |
| **地图服务** | 高德地图 Web API | 2.0 | 地图展示与导航 |
| **LLM** | 阿里云百炼 (通义千问) | - | 行程规划与分析 |

---

## 2. 前端技术栈

### 2.1 React 18

**选择原因**:
- ✅ 生态成熟，社区活跃
- ✅ 组件化开发，代码复用性强
- ✅ 虚拟 DOM，性能优秀
- ✅ Hooks 编程模式，代码简洁
- ✅ 并发特性（Concurrent Features）

**核心特性使用**:
```typescript
// Concurrent Features
import { startTransition } from 'react'

// 低优先级更新
startTransition(() => {
  setSearchResults(newResults)
})

// Suspense for data fetching
<Suspense fallback={<Loading />}>
  <TripList />
</Suspense>
```

**替代方案对比**:
| 框架 | 优势 | 劣势 |
|------|------|------|
| Vue 3 | 学习曲线平缓 | 生态相对较小 |
| Svelte | 编译时优化，体积小 | 生态不够成熟 |
| Angular | 完整框架，大型项目适用 | 学习成本高 |

---

### 2.2 TypeScript

**选择原因**:
- ✅ 类型安全，减少运行时错误
- ✅ 代码提示完善，开发效率高
- ✅ 重构友好
- ✅ 企业级项目标准

**使用示例**:
```typescript
// 类型定义
interface Trip {
  id: string
  title: string
  destination: string
  startDate: Date
  endDate: Date
  budget: number
  status: 'draft' | 'generated' | 'in_progress' | 'completed'
}

// 泛型使用
function createAsyncThunk<T, P>(
  action: (params: P) => Promise<T>
) {
  return async (params: P): Promise<T> => {
    return await action(params)
  }
}
```

**配置建议**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

---

### 2.3 Vite

**选择原因**:
- ✅ 极速冷启动（ESM）
- ✅ 热更新速度快
- ✅ 开箱即用 TypeScript 支持
- ✅ 构建体积优化

**性能对比**:
| 构建工具 | 冷启动 | 热更新 | 生产构建 |
|---------|--------|--------|---------|
| Vite | < 1s | < 100ms | 快 |
| Webpack | 3-5s | 500ms+ | 中 |
| Create React App | 5-10s | 1s+ | 慢 |

**配置示例**:
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'antd': ['antd'],
          'maps': ['@amap/amap-jsapi-loader']
        }
      }
    }
  }
})
```

---

### 2.4 Ant Design

**选择原因**:
- ✅ 企业级 UI 组件库
- ✅ 组件丰富，设计统一
- ✅ 国际化支持
- ✅ TypeScript 支持完善
- ✅ 定制主题方便

**核心组件使用**:
```typescript
import { 
  Button, 
  Form, 
  Input, 
  DatePicker, 
  Modal, 
  Table,
  Card,
  Steps
} from 'antd'

// 表单使用
<Form
  form={form}
  onFinish={onSubmit}
  layout="vertical"
>
  <Form.Item name="destination" label="目的地" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
</Form>
```

**主题定制**:
```typescript
// theme.ts
export const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
    fontSize: 14
  }
}
```

**替代方案**:
- Material-UI: Google Material Design
- Chakra UI: 现代化设计系统
- Tailwind CSS + Headless UI: 高度定制

---

### 2.5 Zustand

**选择原因**:
- ✅ API 简洁，学习成本低
- ✅ 性能优秀（基于订阅）
- ✅ 不需要 Provider
- ✅ DevTools 支持
- ✅ 持久化插件

**使用示例**:
```typescript
// stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const { data } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        set({ user: data.user, token: data.session?.access_token })
      },
      logout: () => {
        set({ user: null, token: null })
      }
    }),
    { name: 'auth-storage' }
  )
)
```

**对比 Redux**:
| 特性 | Zustand | Redux Toolkit |
|------|---------|--------------|
| 代码量 | 少 | 多 |
| 学习成本 | 低 | 中 |
| 性能 | 优秀 | 良好 |
| 生态 | 较小 | 庞大 |

---

## 3. 后端与数据库

### 3.1 Supabase

**选择原因**:
- ✅ 开源的 Firebase 替代品
- ✅ PostgreSQL 数据库（关系型）
- ✅ 内置认证系统
- ✅ 实时订阅功能
- ✅ 行级安全策略（RLS）
- ✅ 免费额度充足

**核心功能**:
```typescript
// 1. 认证
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// 2. 数据查询
const { data: trips } = await supabase
  .from('trips')
  .select('*')
  .eq('user_id', userId)

// 3. 实时订阅
supabase
  .channel('trips')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'trips' },
    (payload) => console.log('New trip:', payload)
  )
  .subscribe()

// 4. 存储
const { data } = await supabase.storage
  .from('avatars')
  .upload('user1/avatar.png', file)
```

**配额说明**:
| 项目 | 免费版 | Pro 版 ($25/月) |
|------|--------|----------------|
| 数据库空间 | 500 MB | 8 GB |
| 存储空间 | 1 GB | 100 GB |
| 月流量 | 5 GB | 250 GB |
| 并发连接 | 60 | 400 |

**替代方案**:
- Firebase: Google 产品,生态完善
- MongoDB Atlas: NoSQL 数据库
- AWS Amplify: AWS 全家桶

---

## 4. 第三方服务

### 4.1 科大讯飞语音识别

**选择原因**:
- ✅ 国内领先的语音识别技术
- ✅ 中文识别准确率高（> 95%）
- ✅ WebSocket 实时识别
- ✅ 免费额度充足（500次/天）

**技术架构**:
```
前端录音 → WebSocket 连接 → 讯飞服务器 → 实时返回文字
```

**核心代码**:
```typescript
class XunfeiASR {
  private ws: WebSocket
  
  connect() {
    // 1. 生成鉴权 URL
    const authUrl = this.generateAuthUrl()
    
    // 2. 建立 WebSocket 连接
    this.ws = new WebSocket(authUrl)
    
    // 3. 监听消息
    this.ws.onmessage = (event) => {
      const result = JSON.parse(event.data)
      this.onResult(result.data.result.ws[0].cw[0].w)
    }
  }
  
  // 发送音频数据
  sendAudio(audioData: Blob) {
    this.ws.send(audioData)
  }
}
```

**替代方案**:
- Web Speech API: 浏览器内置，免费但准确率较低
- 阿里云语音: 阿里云全家桶
- 腾讯云语音: 腾讯云生态

---

### 4.2 高德地图 API

**选择原因**:
- ✅ 国内地图数据准确
- ✅ POI 数据丰富
- ✅ 免费额度高（30万次/天）
- ✅ 文档完善

**核心功能**:
```typescript
// 1. 地图初始化
const map = new AMap.Map('container', {
  zoom: 11,
  center: [116.397428, 39.90923]
})

// 2. POI 搜索
const placeSearch = new AMap.PlaceSearch({
  city: '北京'
})
placeSearch.search('故宫', (status, result) => {
  console.log(result.poiList.pois)
})

// 3. 路径规划
const driving = new AMap.Driving()
driving.search(
  [116.397428, 39.90923],
  [116.404, 39.915],
  (status, result) => {
    console.log(result.routes[0])
  }
)

// 4. 地理编码
const geocoder = new AMap.Geocoder()
geocoder.getLocation('北京市东城区景山前街4号', (status, result) => {
  console.log(result.geocodes[0].location)
})
```

**API 配额**:
| 服务 | 个人开发者 | 企业开发者 |
|------|-----------|-----------|
| Web API | 30万次/天 | 100万次/天 |
| 并发 QPS | 300 | 1000 |

**替代方案**:
- 百度地图: 百度生态
- 腾讯地图: 腾讯生态
- Google Maps: 国际化（需要翻墙）

---

### 4.3 阿里云百炼平台（通义千问）

**选择原因**:
- ✅ 国产大模型,合规性好
- ✅ 中文理解能力强
- ✅ 价格实惠
- ✅ 响应速度快
- ✅ 支持流式输出

**模型选择**:
```typescript
const modelComparison = {
  'qwen-turbo': {
    speed: '快',
    quality: '良好',
    price: '¥0.002/1k tokens',
    useCase: '开发测试、简单任务'
  },
  'qwen-plus': {
    speed: '中等',
    quality: '优秀',
    price: '¥0.004/1k tokens',
    useCase: '生产环境、行程规划'
  },
  'qwen-max': {
    speed: '较慢',
    quality: '极优',
    price: '¥0.02/1k tokens',
    useCase: '复杂规划、高质量要求'
  }
}
```

**API 调用**:
```typescript
async function callBailian(prompt: string) {
  const response = await axios.post(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    {
      model: 'qwen-plus',
      input: {
        messages: [
          { role: 'system', content: '你是专业的旅行规划师' },
          { role: 'user', content: prompt }
        ]
      },
      parameters: {
        result_format: 'message',
        temperature: 0.7,
        max_tokens: 8000
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  return response.data.output.choices[0].message.content
}
```

**费用估算**:
- 单次行程生成: ~5k tokens = ¥0.02
- 月度 1000 用户: ~¥40-80

**替代方案**:
- OpenAI GPT-4: 国际领先，需要翻墙
- Claude 3: Anthropic 产品，质量高
- 文心一言: 百度产品
- 讯飞星火: 科大讯飞产品

---

## 5. 开发工具

### 5.1 代码质量

```json
{
  "tools": {
    "linter": "ESLint",
    "formatter": "Prettier",
    "typeChecker": "TypeScript",
    "gitHooks": "Husky + lint-staged",
    "commitLint": "commitlint"
  }
}
```

### 5.2 测试工具

```typescript
const testingStack = {
  unit: 'Jest + React Testing Library',
  e2e: 'Playwright / Cypress',
  coverage: 'Istanbul'
}
```

### 5.3 部署工具

```typescript
const deployment = {
  frontend: 'Vercel / Netlify',
  backend: 'Supabase (自托管)',
  cdn: 'Cloudflare',
  monitoring: 'Sentry + Google Analytics'
}
```

---

## 6. 技术决策记录

### 6.1 为什么选择 Zustand 而不是 Redux？

**决策**: 选择 Zustand

**理由**:
1. 项目规模中小型，不需要复杂状态管理
2. Zustand API 更简洁，开发效率高
3. 性能优秀，满足需求
4. 学习成本低，团队容易上手

**权衡**:
- 如果项目扩展到大型应用，可能需要迁移到 Redux
- Redux 生态更完善，中间件更多

---

### 6.2 为什么选择 Supabase 而不是 Firebase？

**决策**: 选择 Supabase

**理由**:
1. 开源，避免供应商锁定
2. PostgreSQL 关系型数据库，数据结构更清晰
3. RLS（行级安全）更灵活
4. 价格更实惠
5. 国内访问稳定

**权衡**:
- Firebase 生态更完善
- Firebase 在移动端支持更好

---

### 6.3 为什么选择通义千问而不是 GPT-4？

**决策**: 选择通义千问

**理由**:
1. 合规性好，无需翻墙
2. 中文理解能力强
3. 价格实惠（约为 GPT-4 的 1/5）
4. 响应速度快
5. 国内用户体验好

**权衡**:
- GPT-4 在复杂任务上质量更高
- 可作为备选方案

---

## 7. 技术风险评估

### 7.1 风险矩阵

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 科大讯飞 API 不稳定 | 低 | 高 | 备用 Web Speech API |
| 通义千问响应慢 | 中 | 中 | 使用 qwen-turbo,优化 Prompt |
| Supabase 配额超限 | 低 | 高 | 监控用量,准备升级计划 |
| 高德地图配额超限 | 极低 | 中 | 缓存结果,优化调用 |
| 浏览器兼容性 | 低 | 中 | Polyfill,渐进增强 |

### 7.2 性能风险

```typescript
const performanceRisks = {
  largeDataset: {
    risk: '数据量大导致渲染慢',
    mitigation: '虚拟滚动、分页、懒加载'
  },
  mapLoading: {
    risk: '地图加载慢',
    mitigation: '按需加载、CDN 加速'
  },
  llmTimeout: {
    risk: 'LLM 响应超时',
    mitigation: '设置超时、显示进度、提供取消'
  }
}
```

---

## 8. 技术升级路径

### 8.1 短期（3个月内）

- [ ] 优化 Prompt 提升生成质量
- [ ] 添加更多缓存策略
- [ ] 性能监控和优化
- [ ] 移动端体验优化

### 8.2 中期（6个月内）

- [ ] 考虑引入 React Server Components
- [ ] 实现 PWA（离线访问）
- [ ] 添加更多语音命令
- [ ] 集成更多地图功能（实时路况）

### 8.3 长期（1年内）

- [ ] 微服务架构拆分
- [ ] 引入机器学习推荐系统
- [ ] 多语言支持
- [ ] 小程序版本

---

## 9. 总结

### 9.1 技术栈优势

✅ **开发效率高**: React + TypeScript + Vite
✅ **成本可控**: 大部分服务有免费额度
✅ **性能优秀**: 现代化技术栈
✅ **可扩展性好**: 模块化设计
✅ **学习成本低**: 主流技术栈

### 9.2 关键指标

| 指标 | 目标值 |
|------|--------|
| 首屏加载时间 | < 3s |
| 语音识别延迟 | < 2s |
| AI 生成时间 | < 30s |
| 地图加载时间 | < 3s |
| Lighthouse 分数 | > 80 |

---

## 10. 参考资料

- [React 官方文档](https://react.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Vite 文档](https://vitejs.dev/)
- [Ant Design 文档](https://ant.design/)
- [Supabase 文档](https://supabase.com/docs)
- [阿里云百炼文档](https://help.aliyun.com/zh/dashscope/)

---

**文档版本**: v1.0  
**维护人**: 开发团队  
**最后更新**: 2025-01-XX
