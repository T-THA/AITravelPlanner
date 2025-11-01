# AI 旅行规划师 - 工作计划文档

## 项目信息

- **项目名称**: AI 旅行规划师 (AITravelPlanner)
- **项目周期**: 7 周
- **开发模式**: 敏捷开发（每周迭代）
- **文档版本**: v1.0
- **最后更新**: 2025-01-XX

---

## 技术选型确认

| 技术模块 | 选型方案 | 说明 |
|---------|---------|------|
| 用户认证 | 邮箱注册 + Supabase Auth | 仅支持邮箱注册登录 |
| 数据库 | Supabase (PostgreSQL) | 云端数据库 + 实时同步 |
| 语音识别 | 科大讯飞 Web API | 支持中英文语音转文字 |
| 地图服务 | 高德地图 Web API | 地图展示 + POI 搜索 + 路径规划 |
| 大语言模型 | 阿里云百炼平台 | 行程规划 + 预算分析 |
| 前端框架 | React 18 + TypeScript + Vite | 现代化前端技术栈 |
| UI 组件库 | Ant Design | 企业级 UI 组件 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 数据可视化 | ECharts | 费用图表展示 |

---

## 阶段一：环境搭建与 API 调试（第 1 周）

### 1.1 项目初始化（1 天）

**任务清单**:
- [ ] 创建 React + TypeScript + Vite 项目
- [ ] 配置 ESLint + Prettier
- [ ] 配置 Git 仓库和 .gitignore
- [ ] 安装基础依赖包

**命令参考**:
```bash
npm create vite@latest ai-travel-planner -- --template react-ts
cd ai-travel-planner
npm install
npm install zustand axios react-router-dom antd
npm install -D @types/node eslint prettier
```

**验收标准**:
- [ ] 项目可正常启动（npm run dev）
- [ ] 代码格式化规则生效
- [ ] Git 提交记录规范

---

### 1.2 Supabase 配置与调试（1 天）

**任务清单**:
- [ ] 注册 Supabase 账号并创建项目
- [ ] 获取 API Keys (anon key + service_role key)
- [ ] 配置数据库表结构（users, trips, itinerary_items, expenses）
- [ ] 测试 Supabase Client 连接
- [ ] 实现邮箱注册/登录 API 调用

**Supabase 表结构**:
```sql
-- 用户表（由 Supabase Auth 自动管理，扩展字段）
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username VARCHAR(100),
  avatar_url TEXT,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 旅行计划表
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  destination VARCHAR(255),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10, 2),
  travelers_count INT,
  preferences JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 行程项表
CREATE TABLE itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  day INT,
  time TIME,
  type VARCHAR(50), -- 'attraction', 'restaurant', 'hotel', 'transport'
  title VARCHAR(255),
  description TEXT,
  location JSONB, -- {lat, lng, address, poi_id}
  cost DECIMAL(10, 2),
  image_url TEXT,
  order_index INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 费用记录表
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  category VARCHAR(50), -- 'transport', 'accommodation', 'food', 'ticket', 'shopping', 'other'
  amount DECIMAL(10, 2),
  description TEXT,
  expense_date DATE,
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 启用行级安全策略 (RLS)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can view their own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips" ON trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips" ON trips
  FOR DELETE USING (auth.uid() = user_id);
```

**测试代码**:
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 测试注册
const testSignUp = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'password123'
  })
  console.log('SignUp:', data, error)
}
```

**验收标准**:
- [ ] 数据库表创建成功
- [ ] RLS 策略生效
- [ ] 邮箱注册功能正常（收到验证邮件）
- [ ] 登录功能正常（返回 JWT Token）

---

### 1.3 科大讯飞语音识别 API 调试（1 天）

**任务清单**:
- [ ] 注册科大讯飞账号并创建应用
- [ ] 获取 APPID、APISecret、APIKey
- [ ] 阅读 Web API 文档（WebSocket 接口）
- [ ] 实现语音录制功能（MediaRecorder）
- [ ] 实现 WebSocket 连接和音频流传输
- [ ] 测试语音转文字功能

**核心代码结构**:
```typescript
// src/services/speech.ts
class XunfeiASR {
  private ws: WebSocket | null = null
  private mediaRecorder: MediaRecorder | null = null
  
  async startRecording(onResult: (text: string) => void) {
    // 1. 获取麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // 2. 创建 WebSocket 连接（需要鉴权）
    const wsUrl = this.generateWebSocketUrl()
    this.ws = new WebSocket(wsUrl)
    
    // 3. 录音并发送音频数据
    this.mediaRecorder = new MediaRecorder(stream)
    this.mediaRecorder.ondataavailable = (event) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(event.data)
      }
    }
    
    // 4. 接收识别结果
    this.ws.onmessage = (event) => {
      const result = JSON.parse(event.data)
      onResult(result.data.result.ws[0].cw[0].w)
    }
    
    this.mediaRecorder.start(100) // 每 100ms 发送一次
  }
  
  stopRecording() {
    this.mediaRecorder?.stop()
    this.ws?.close()
  }
}
```

**测试步骤**:
1. 点击录音按钮
2. 说话："我想去北京旅游，5天预算1万元"
3. 停止录音
4. 查看识别结果是否准确

**验收标准**:
- [ ] 成功获取麦克风权限
- [ ] WebSocket 连接成功
- [ ] 语音实时转文字（延迟 < 2 秒）
- [ ] 识别准确率 > 85%（测试 10 条语音）

---

### 1.4 高德地图 API 调试（1 天）

**任务清单**:
- [ ] 注册高德开放平台账号
- [ ] 创建 Web 端应用并获取 Key
- [ ] 集成高德地图 JS API
- [ ] 测试地图显示功能
- [ ] 测试 POI 搜索功能
- [ ] 测试路径规划功能

**集成代码**:
```html
<!-- public/index.html -->
<script src="https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY&plugin=AMap.PlaceSearch,AMap.Geocoder,AMap.Driving"></script>
```

```typescript
// src/services/map.ts
export class AmapService {
  private map: any
  
  initMap(container: string) {
    this.map = new AMap.Map(container, {
      zoom: 11,
      center: [116.397428, 39.90923] // 北京
    })
  }
  
  // POI 搜索
  async searchPOI(keyword: string, city: string) {
    return new Promise((resolve) => {
      const placeSearch = new AMap.PlaceSearch({ city })
      placeSearch.search(keyword, (status: string, result: any) => {
        if (status === 'complete') {
          resolve(result.poiList.pois)
        }
      })
    })
  }
  
  // 添加标记
  addMarker(position: [number, number], title: string, icon: string) {
    const marker = new AMap.Marker({
      position,
      title,
      icon: new AMap.Icon({ image: icon, size: new AMap.Size(32, 32) })
    })
    this.map.add(marker)
    return marker
  }
  
  // 路径规划
  async routePlanning(start: [number, number], end: [number, number]) {
    const driving = new AMap.Driving()
    return new Promise((resolve) => {
      driving.search(start, end, (status: string, result: any) => {
        if (status === 'complete') {
          resolve(result.routes[0])
        }
      })
    })
  }
}
```

**测试场景**:
- [ ] 在北京市搜索"故宫"，显示结果
- [ ] 在地图上标注多个景点
- [ ] 规划从天安门到颐和园的路线

**验收标准**:
- [ ] 地图正常显示
- [ ] POI 搜索返回准确结果
- [ ] 标记正确显示在地图上
- [ ] 路径规划显示完整路线

---

### 1.5 阿里云百炼平台 API 调试（2 天）

**任务清单**:
- [ ] 注册阿里云账号并开通百炼服务
- [ ] 获取 API Key
- [ ] 阅读 API 文档（通义千问系列模型）
- [ ] 设计行程规划 Prompt 模板
- [ ] 测试行程生成功能
- [ ] 设计预算分析 Prompt 模板
- [ ] 测试预算分析功能
- [ ] 优化 Prompt 提升输出质量

**Prompt 设计**:

```typescript
// src/prompts/itinerary.ts
export const ITINERARY_PROMPT = `
你是一位专业的旅行规划师。请根据以下信息生成详细的旅行计划：

**用户需求**:
- 目的地: {destination}
- 旅行天数: {days}天
- 预算: {budget}元
- 同行人数: {travelers}人
- 旅行偏好: {preferences}

**输出要求**:
1. 每天的详细行程安排（包括时间、地点、活动）
2. 推荐景点（含简介、门票价格、游玩时长）
3. 推荐餐厅（含菜系、人均消费、特色菜）
4. 交通方式建议（含预估费用）
5. 住宿推荐（含价格区间、位置）

**输出格式**（严格按照 JSON 格式）:
{
  "trip_title": "行程标题",
  "total_days": 5,
  "daily_itinerary": [
    {
      "day": 1,
      "date": "2025-02-01",
      "theme": "当日主题",
      "items": [
        {
          "time": "09:00",
          "type": "attraction",
          "title": "景点名称",
          "description": "简介",
          "location": "具体地址",
          "duration": "2小时",
          "cost": 60,
          "tips": "游玩建议"
        },
        {
          "time": "12:00",
          "type": "restaurant",
          "title": "餐厅名称",
          "description": "菜系和特色",
          "location": "地址",
          "cost": 150,
          "recommended_dishes": ["菜品1", "菜品2"]
        }
      ]
    }
  ],
  "accommodation": [
    {
      "day": 1,
      "hotel_name": "酒店名称",
      "location": "位置",
      "price_range": "300-500元/晚",
      "features": ["特点1", "特点2"]
    }
  ],
  "transportation": {
    "to_destination": "交通方式",
    "local": "市内交通建议",
    "estimated_cost": 1000
  },
  "budget_breakdown": {
    "accommodation": 1500,
    "food": 2000,
    "tickets": 800,
    "transportation": 1200,
    "shopping": 1500,
    "other": 1000
  }
}

请确保返回的是可解析的 JSON 格式，不要包含任何额外的文字说明。
`

// src/prompts/budget.ts
export const BUDGET_PROMPT = `
作为旅行预算分析师，请根据以下行程计划进行预算分析：

**行程信息**: {itinerary}

**用户预算**: {total_budget}元

**分析要求**:
1. 详细列出各项费用（交通、住宿、餐饮、门票、购物、其他）
2. 计算预算分配比例
3. 判断是否超预算
4. 提供节省建议（如超预算）
5. 推荐备用方案

输出 JSON 格式:
{
  "total_budget": 10000,
  "estimated_cost": 9500,
  "is_over_budget": false,
  "budget_breakdown": {
    "transportation": { "amount": 1200, "percentage": 12.6 },
    "accommodation": { "amount": 2500, "percentage": 26.3 },
    "food": { "amount": 3000, "percentage": 31.6 },
    "tickets": { "amount": 1500, "percentage": 15.8 },
    "shopping": { "amount": 1000, "percentage": 10.5 },
    "other": { "amount": 300, "percentage": 3.2 }
  },
  "savings_tips": ["建议1", "建议2"],
  "alternative_options": ["备选方案1"]
}
`
```

**API 调用代码**:
```typescript
// src/services/llm.ts
import axios from 'axios'

export class BailianLLMService {
  private apiKey: string
  private baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  async generateItinerary(params: any) {
    const prompt = ITINERARY_PROMPT
      .replace('{destination}', params.destination)
      .replace('{days}', params.days)
      .replace('{budget}', params.budget)
      .replace('{travelers}', params.travelers)
      .replace('{preferences}', params.preferences.join(', '))
    
    const response = await axios.post(
      this.baseURL,
      {
        model: 'qwen-plus', // 或 'qwen-max'
        input: {
          messages: [
            { role: 'system', content: '你是专业的旅行规划师' },
            { role: 'user', content: prompt }
          ]
        },
        parameters: {
          result_format: 'message',
          temperature: 0.7
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const result = response.data.output.choices[0].message.content
    return JSON.parse(result)
  }
  
  async analyzeBudget(itinerary: any, totalBudget: number) {
    // 类似实现
  }
}
```

**测试案例**:
```typescript
// 测试用例 1: 北京5日游
const testCase1 = {
  destination: '北京',
  days: 5,
  budget: 10000,
  travelers: 2,
  preferences: ['历史文化', '美食', '摄影']
}

// 测试用例 2: 日本东京7日游
const testCase2 = {
  destination: '日本东京',
  days: 7,
  budget: 20000,
  travelers: 3,
  preferences: ['美食', '动漫', '购物', '亲子']
}
```

**Prompt 优化检查清单**:
- [ ] 输出是否为有效 JSON 格式
- [ ] 行程安排是否逻辑合理（景点顺序、时间分配）
- [ ] 费用预估是否接近实际
- [ ] 推荐内容是否符合用户偏好
- [ ] 路线是否避免绕路
- [ ] 每日行程是否过于紧凑或松散

**验收标准**:
- [ ] API 调用成功，响应时间 < 30 秒
- [ ] 返回 JSON 格式可正常解析
- [ ] 行程内容完整（包含所有必需字段）
- [ ] 预算分析合理（误差 < 20%）
- [ ] 测试 5 个不同目的地，成功率 100%

---

## 阶段二：用户系统与基础界面（第 2 周）

### 2.1 用户注册/登录模块（2 天）

**任务清单**:
- [ ] 设计登录/注册页面 UI
- [ ] 实现邮箱注册功能
- [ ] 实现邮箱验证流程
- [ ] 实现登录功能
- [ ] 实现密码找回功能
- [ ] JWT Token 管理（存储、刷新、过期处理）
- [ ] 路由守卫（未登录跳转）

**页面组件**:
```typescript
// src/pages/Auth/Login.tsx
// src/pages/Auth/Register.tsx
// src/pages/Auth/ResetPassword.tsx
```

**状态管理**:
```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        set({ user: data.user, token: data.session?.access_token })
      },
      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, token: null })
      },
      checkAuth: async () => {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          set({ user: data.session.user, token: data.session.access_token })
          return true
        }
        return false
      }
    }),
    { name: 'auth-storage' }
  )
)
```

**验收标准**:
- [ ] 注册成功后收到验证邮件
- [ ] 邮箱验证后可正常登录
- [ ] 登录后 Token 正确存储
- [ ] 刷新页面保持登录状态
- [ ] 未登录访问保护页面自动跳转
- [ ] 密码找回流程正常

---

### 2.2 路由与布局搭建（1 天）

**任务清单**:
- [ ] 设计整体路由结构
- [ ] 创建主布局组件（Header + Sidebar + Content）
- [ ] 实现导航菜单
- [ ] 实现面包屑导航

**路由配置**:
```typescript
// src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/auth',
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> }
    ]
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '', element: <Dashboard /> },
      { path: 'trips', element: <TripList /> },
      { path: 'trips/new', element: <CreateTrip /> },
      { path: 'trips/:id', element: <TripDetail /> },
      { path: 'profile', element: <Profile /> }
    ]
  }
])
```

**验收标准**:
- [ ] 所有页面路由正常跳转
- [ ] 布局响应式（移动端适配）
- [ ] 导航菜单高亮当前页面

---

### 2.3 个人中心页面（1 天）

**任务清单**:
- [ ] 查看个人信息
- [ ] 编辑昵称和头像
- [ ] 设置旅行偏好
- [ ] 修改密码

**验收标准**:
- [ ] 信息修改成功保存到数据库
- [ ] 头像上传到 Supabase Storage
- [ ] 偏好设置应用到后续行程生成

---

## 阶段三：核心功能开发 - 行程规划（第 3-4 周）

### 3.1 需求输入界面（2 天）

**任务清单**:
- [ ] 设计需求输入表单（步骤式或单页）
- [ ] 集成语音输入组件
- [ ] 实现语音自动填充表单逻辑
- [ ] 表单字段验证
- [ ] 支持保存草稿

**表单字段**:
```typescript
interface TripRequest {
  destination: string // 目的地
  startDate: Date // 出发日期
  endDate: Date // 返程日期
  budget: number // 预算
  travelersCount: number // 人数
  travelersType: string[] // 人员构成：['成人', '儿童', '老人']
  preferences: string[] // 偏好：['美食', '文化', '自然', '购物', '亲子']
  accommodation: string // 住宿偏好：'经济型' | '舒适型' | '豪华型'
  pace: string // 行程节奏：'轻松' | '适中' | '紧凑'
  specialNeeds: string // 特殊需求（文本）
}
```

**语音填充逻辑**:
```typescript
// 使用 LLM 解析语音文本并提取结构化数据
const parseVoiceInput = async (text: string) => {
  const prompt = `
    请从以下用户描述中提取旅行需求信息：
    "${text}"
    
    输出 JSON:
    {
      "destination": "目的地",
      "days": 天数,
      "budget": 预算金额,
      "travelers": 人数,
      "preferences": ["偏好1", "偏好2"]
    }
  `
  
  const result = await llmService.parse(prompt)
  return JSON.parse(result)
}
```

**验收标准**:
- [ ] 表单所有字段正常工作
- [ ] 语音输入可自动填充至少 80% 的字段
- [ ] 必填项校验有友好提示
- [ ] 草稿自动保存

---

### 3.2 AI 行程生成功能（3 天）

**任务清单**:
- [ ] 实现行程生成 API 调用
- [ ] 处理流式输出（可选）
- [ ] 解析 JSON 结果并存储到数据库
- [ ] 错误处理（超时、格式错误、API 失败）
- [ ] 添加重新生成功能
- [ ] 优化生成速度

**生成流程**:
```typescript
// src/services/tripService.ts
export class TripService {
  async generateTrip(request: TripRequest) {
    // 1. 调用 LLM 生成行程
    const itinerary = await llmService.generateItinerary({
      destination: request.destination,
      days: calculateDays(request.startDate, request.endDate),
      budget: request.budget,
      travelers: request.travelersCount,
      preferences: request.preferences
    })
    
    // 2. 保存到数据库
    const { data: trip } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        title: itinerary.trip_title,
        destination: request.destination,
        start_date: request.startDate,
        end_date: request.endDate,
        budget: request.budget,
        travelers_count: request.travelersCount,
        preferences: request.preferences,
        status: 'generated'
      })
      .select()
      .single()
    
    // 3. 保存行程项
    for (const day of itinerary.daily_itinerary) {
      for (const item of day.items) {
        await supabase.from('itinerary_items').insert({
          trip_id: trip.id,
          day: day.day,
          time: item.time,
          type: item.type,
          title: item.title,
          description: item.description,
          location: { address: item.location },
          cost: item.cost,
          order_index: day.items.indexOf(item)
        })
      }
    }
    
    return trip
  }
}
```

**验收标准**:
- [ ] 生成时间 < 30 秒
- [ ] 生成成功率 > 95%
- [ ] 数据正确存储到数据库
- [ ] 错误有重试机制和友好提示

---

### 3.3 行程展示界面（3 天）

**任务清单**:
- [ ] 设计行程详情页布局（左侧地图 + 右侧时间线）
- [ ] 实现时间线组件（按天/按项展示）
- [ ] 集成高德地图并标注所有地点
- [ ] 地点详情弹窗（点击标记显示）
- [ ] 地图与时间线联动（点击行程项定位地图）
- [ ] 每个景点添加图片（从第三方 API 获取）

**地点标注**:
```typescript
// src/components/TripMap.tsx
const TripMap = ({ itineraryItems }: Props) => {
  useEffect(() => {
    const map = new AMap.Map('map-container', {
      zoom: 12,
      center: [116.397428, 39.90923]
    })
    
    // 标注所有地点
    itineraryItems.forEach((item) => {
      // 先通过地址获取坐标
      const geocoder = new AMap.Geocoder()
      geocoder.getLocation(item.location.address, (status, result) => {
        if (status === 'complete') {
          const position = [result.geocodes[0].location.lng, result.geocodes[0].location.lat]
          
          const marker = new AMap.Marker({
            position,
            title: item.title,
            icon: getIconByType(item.type) // 不同类型不同图标
          })
          
          marker.on('click', () => {
            // 显示详情弹窗
            showItemDetail(item)
          })
          
          map.add(marker)
        }
      })
    })
    
    // 绘制路线
    const path = itineraryItems.map(item => item.location.position)
    const polyline = new AMap.Polyline({
      path,
      strokeColor: '#1890ff',
      strokeWeight: 4
    })
    map.add(polyline)
  }, [itineraryItems])
  
  return <div id="map-container" style={{ height: '100%' }} />
}
```

**验收标准**:
- [ ] 地图正确显示所有地点
- [ ] 路线清晰可见
- [ ] 点击标记显示详情
- [ ] 时间线与地图联动
- [ ] 移动端地图可正常操作

---

### 3.4 行程编辑功能（2 天）

**任务清单**:
- [ ] 添加行程项
- [ ] 删除行程项
- [ ] 修改行程项内容
- [ ] 拖拽调整顺序
- [ ] 修改实时保存

**拖拽排序**:
```typescript
// 使用 react-beautiful-dnd 或 @dnd-kit/core
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

const ItineraryTimeline = ({ items, onReorder }) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return
    
    const newItems = Array.from(items)
    const [removed] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, removed)
    
    onReorder(newItems)
  }
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="itinerary">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                    <ItineraryItem item={item} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
```

**验收标准**:
- [ ] 编辑操作实时保存
- [ ] 拖拽流畅无卡顿
- [ ] 修改后地图同步更新

---

## 阶段四：费用管理与高级功能（第 5 周）

### 4.1 AI 预算分析（2 天）

**任务清单**:
- [ ] 调用 LLM 进行预算分析
- [ ] 展示预算分配（饼图/柱状图）
- [ ] 超预算提醒
- [ ] 节省建议展示

**图表组件**:
```typescript
// src/components/BudgetChart.tsx
import * as echarts from 'echarts'

const BudgetChart = ({ budgetData }) => {
  useEffect(() => {
    const chart = echarts.init(document.getElementById('budget-chart'))
    
    chart.setOption({
      title: { text: '预算分配' },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '50%',
        data: [
          { value: budgetData.transportation.amount, name: '交通' },
          { value: budgetData.accommodation.amount, name: '住宿' },
          { value: budgetData.food.amount, name: '餐饮' },
          { value: budgetData.tickets.amount, name: '门票' },
          { value: budgetData.shopping.amount, name: '购物' },
          { value: budgetData.other.amount, name: '其他' }
        ]
      }]
    })
  }, [budgetData])
  
  return <div id="budget-chart" style={{ height: 400 }} />
}
```

**验收标准**:
- [ ] 预算分析合理
- [ ] 图表清晰美观
- [ ] 超预算有明显提示

---

### 4.2 费用记录功能（2 天）

**任务清单**:
- [ ] 手动添加费用记录
- [ ] 语音快速记录费用
- [ ] 费用分类（自动/手动）
- [ ] 上传票据照片
- [ ] 费用统计（按类别/按日期）
- [ ] 实际费用与预算对比

**语音费用记录**:
```typescript
// 语音输入："刚才吃饭花了150块"
const parseExpenseVoice = async (text: string) => {
  const prompt = `
    从以下描述中提取费用信息：
    "${text}"
    
    输出 JSON:
    {
      "amount": 金额,
      "category": "交通|住宿|餐饮|门票|购物|其他",
      "description": "描述",
      "date": "YYYY-MM-DD"
    }
  `
  
  const result = await llmService.parse(prompt)
  return JSON.parse(result)
}
```

**验收标准**:
- [ ] 费用记录成功保存
- [ ] 语音识别准确率 > 80%
- [ ] 统计数据准确
- [ ] 支持导出 Excel

---

### 4.3 行程列表与管理（1 天）

**任务清单**:
- [ ] 行程列表页（卡片展示）
- [ ] 筛选功能（状态/日期）
- [ ] 搜索功能
- [ ] 删除行程（二次确认）
- [ ] 复制行程
- [ ] 行程分享（生成链接）

**验收标准**:
- [ ] 列表加载速度 < 2 秒
- [ ] 分页正常
- [ ] 分享链接可访问

---

## 阶段五：优化与测试（第 6 周）

### 5.1 性能优化（2 天）

**优化项**:
- [ ] 代码分割（React.lazy + Suspense）
- [ ] 图片懒加载
- [ ] 地图组件按需加载
- [ ] API 请求缓存
- [ ] 防抖节流优化
- [ ] 打包体积优化（分析 bundle size）

**测试指标**:
- [ ] 首屏加载时间 < 3 秒
- [ ] Lighthouse 性能分数 > 80

---

### 5.2 移动端适配（2 天）

**任务清单**:
- [ ] 响应式布局调整
- [ ] 移动端手势支持
- [ ] 地图移动端优化
- [ ] 表单移动端友好

**测试设备**:
- iPhone SE (375x667)
- iPhone 12 Pro (390x844)
- iPad (768x1024)

---

### 5.3 测试与 Bug 修复（3 天）

**测试类型**:

**1. 单元测试（简化）**:
```typescript
// src/__tests__/utils.test.ts
import { calculateDays, formatBudget } from '@/utils'

describe('Utils', () => {
  test('calculateDays', () => {
    expect(calculateDays('2025-02-01', '2025-02-05')).toBe(5)
  })
  
  test('formatBudget', () => {
    expect(formatBudget(10000)).toBe('¥10,000')
  })
})
```

**2. 集成测试**:
- [ ] 完整流程测试：注册 → 登录 → 创建行程 → 生成行程 → 查看详情 → 记录费用
- [ ] API 调用测试

**3. 浏览器兼容性测试**:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**4. 用户场景测试**:
- [ ] 新用户首次使用
- [ ] 语音输入失败处理
- [ ] 网络断开重连
- [ ] 并发创建多个行程

**Bug 修复优先级**:
- P0: 阻塞功能（无法登录、无法生成行程）
- P1: 严重影响体验（页面崩溃、数据丢失）
- P2: 一般问题（UI 错位、文案错误）

---

## 阶段六：部署上线（第 7 周）

### 6.1 环境配置（1 天）

**任务清单**:
- [ ] 配置生产环境变量
- [ ] 配置 Vercel/Netlify 部署
- [ ] 配置自定义域名（可选）
- [ ] 配置 HTTPS
- [ ] 配置 CDN 加速

**环境变量**:
```bash
# .env.production
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_XUNFEI_APPID=xxx
VITE_XUNFEI_API_KEY=xxx
VITE_AMAP_KEY=xxx
VITE_BAILIAN_API_KEY=xxx
```

---

### 6.2 上线发布（1 天）

**发布步骤**:
1. 代码 Review
2. 最终测试
3. 构建生产版本（npm run build）
4. 部署到 Vercel
5. 烟雾测试（访问线上环境）
6. 监控错误日志

**部署命令**:
```bash
npm run build
vercel --prod
```

---

### 6.3 文档编写（1 天）

**文档内容**:
- [ ] 用户使用指南
- [ ] 开发者文档（如何本地运行）
- [ ] API 文档
- [ ] 部署文档
- [ ] 常见问题 FAQ

---

## 里程碑检查清单

### M1: 基础框架 + API 调试（第 1 周末）
- [ ] 项目可本地运行
- [ ] Supabase 连接成功
- [ ] 科大讯飞语音识别工作正常
- [ ] 高德地图显示正常
- [ ] 阿里云百炼 API 可生成行程

### M2: 用户系统 + 行程规划（第 4 周末）
- [ ] 用户可注册登录
- [ ] 可通过语音输入需求
- [ ] AI 可生成完整行程
- [ ] 行程在地图上正确显示
- [ ] 可编辑行程内容

### M3: 费用管理 + 高级功能（第 5 周末）
- [ ] 预算分析功能正常
- [ ] 可记录费用（手动+语音）
- [ ] 行程列表和管理功能完整
- [ ] 数据云端同步正常

### M4: MVP 版本上线（第 7 周末）
- [ ] 所有核心功能完成
- [ ] 性能达标
- [ ] 移动端适配完成
- [ ] 测试通过
- [ ] 成功部署到生产环境

---

## 风险应对

| 风险 | 应对措施 | 负责人 |
|------|---------|--------|
| API 配额不足 | 申请更高配额，准备备用 API | 开发 |
| 生成时间过长 | 优化 Prompt，使用更快的模型 | 开发 |
| 语音识别不准 | 提供手动修正，增加确认步骤 | 开发 |
| 地图加载慢 | 使用 CDN，缓存地图资源 | 开发 |
| 数据库并发问题 | 增加索引，优化查询 | 开发 |

---

## 每日站会（Daily Standup）

每天 10:00，回答三个问题：
1. 昨天完成了什么？
2. 今天计划做什么？
3. 遇到了什么阻碍？

---

## 周报模板

**本周完成**:
- [ ] 任务 1
- [ ] 任务 2

**下周计划**:
- [ ] 任务 1
- [ ] 任务 2

**遇到的问题**:
- 问题描述

**需要的支持**:
- 支持内容

---

## 附录：快速启动指南

### 本地开发环境搭建

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

### 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint

# 格式化代码
npm run format

# 运行测试
npm run test
```

---

**文档版本**: v1.0  
**创建时间**: 2025-01-XX  
**最后更新**: 2025-01-XX
