# Prompt 模板文档

## 文档信息

- **用途**: LLM API 调用的 Prompt 模板
- **模型**: 阿里云百炼（通义千问）
- **版本**: v1.0
- **最后更新**: 2025-01-XX

---

## 1. 行程规划 Prompt

### 1.1 基础模板

```typescript
// src/prompts/itinerary.ts
export const ITINERARY_PROMPT = `
你是一位经验丰富的旅行规划师，擅长根据用户需求定制个性化旅行方案。

## 用户需求
- 目的地: {destination}
- 出发日期: {startDate}
- 返程日期: {endDate}
- 旅行天数: {days}天
- 总预算: {budget}元
- 同行人数: {travelers}人
- 人员构成: {travelersType}
- 旅行偏好: {preferences}
- 住宿偏好: {accommodation}
- 行程节奏: {pace}
- 特殊需求: {specialNeeds}

## 任务要求

请生成一份详细的旅行计划，包含：

### 1. 每日行程安排
- 按时间顺序列出每天的活动
- 包含景点、餐厅、交通、住宿
- 时间安排合理，避免过于紧凑或松散
- 路线规划避免走回头路

### 2. 景点推荐
- 符合用户偏好的景点
- 包含景点简介、开放时间、门票价格
- 预估游玩时长
- 游玩建议和注意事项

### 3. 餐饮推荐
- 当地特色餐厅
- 菜系类型和人均消费
- 推荐菜品

### 4. 住宿建议
- 符合预算和偏好的酒店
- 位置便利性说明
- 价格区间和特色

### 5. 交通方案
- 往返目的地的交通方式
- 市内交通建议
- 预估交通费用

### 6. 预算分配
- 详细列出各项费用
- 确保总费用不超过预算

## 输出格式

请严格按照以下 JSON 格式输出，不要包含任何额外的解释文字：

\`\`\`json
{
  "trip_title": "行程标题（例如：北京5日文化之旅）",
  "summary": "行程简介（100字以内）",
  "highlights": ["亮点1", "亮点2", "亮点3"],
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
          "description": "景点简介（100字以内）",
          "location": "详细地址",
          "duration": "2小时",
          "cost": 60,
          "ticket_info": "门票信息",
          "opening_hours": "开放时间",
          "tips": "游玩建议"
        },
        {
          "time": "12:00",
          "type": "restaurant",
          "title": "餐厅名称",
          "description": "餐厅特色（50字以内）",
          "location": "详细地址",
          "cuisine": "菜系",
          "cost": 150,
          "recommended_dishes": ["菜品1", "菜品2", "菜品3"]
        },
        {
          "time": "14:00",
          "type": "attraction",
          "title": "下午景点",
          "description": "简介",
          "location": "地址",
          "duration": "3小时",
          "cost": 80,
          "tips": "建议"
        }
      ]
    }
  ],
  "accommodation": [
    {
      "day": 1,
      "hotel_name": "酒店名称",
      "location": "酒店位置",
      "price_range": "300-500元/晚",
      "rating": "4.5",
      "features": ["特点1", "特点2"],
      "booking_tips": "预订建议"
    }
  ],
  "transportation": {
    "to_destination": {
      "method": "高铁/飞机/自驾",
      "details": "具体方案",
      "estimated_cost": 1000,
      "duration": "3小时"
    },
    "local_transport": {
      "recommendation": "地铁为主，配合打车",
      "daily_cost": 50,
      "tips": "交通建议"
    },
    "return": {
      "method": "返程方式",
      "estimated_cost": 1000
    }
  },
  "budget_breakdown": {
    "transportation": 2000,
    "accommodation": 2000,
    "food": 2500,
    "tickets": 1000,
    "shopping": 1500,
    "other": 1000
  },
  "total_estimated_cost": 10000,
  "packing_list": ["必带物品1", "必带物品2"],
  "travel_tips": ["旅行建议1", "旅行建议2"],
  "emergency_contacts": {
    "police": "110",
    "hospital": "120",
    "tourist_hotline": "12301"
  }
}
\`\`\`

## 注意事项

1. 所有价格为人民币，精确到小数点后两位
2. 时间格式统一为 HH:mm
3. 日期格式为 YYYY-MM-DD
4. 确保 JSON 格式完全正确，可被解析
5. 行程安排要符合实际情况，避免不合理的时间安排
6. 预算分配要合理，总和应接近用户预算
7. 考虑目的地的实际情况（气候、节假日、特殊事件等）
`
```

### 1.2 使用示例

```typescript
// src/services/llm.ts
export async function generateItinerary(request: TripRequest) {
  const prompt = ITINERARY_PROMPT
    .replace('{destination}', request.destination)
    .replace('{startDate}', formatDate(request.startDate))
    .replace('{endDate}', formatDate(request.endDate))
    .replace('{days}', calculateDays(request.startDate, request.endDate).toString())
    .replace('{budget}', request.budget.toString())
    .replace('{travelers}', request.travelersCount.toString())
    .replace('{travelersType}', request.travelersType.join(', '))
    .replace('{preferences}', request.preferences.join(', '))
    .replace('{accommodation}', request.accommodation)
    .replace('{pace}', request.pace)
    .replace('{specialNeeds}', request.specialNeeds || '无')

  const response = await callBailianAPI({
    model: 'qwen-plus',
    messages: [
      { role: 'system', content: '你是专业的旅行规划师' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 8000
  })

  return JSON.parse(response)
}
```

---

## 2. 预算分析 Prompt

### 2.1 基础模板

```typescript
// src/prompts/budget.ts
export const BUDGET_ANALYSIS_PROMPT = `
你是一位专业的旅行预算分析师，擅长合理分配旅行预算并提供节省建议。

## 行程信息
{itineraryJSON}

## 用户预算
总预算: {totalBudget}元

## 任务要求

请对以上行程进行预算分析，包含：

1. 详细的预算分配（交通、住宿、餐饮、门票、购物、其他）
2. 计算各项费用的占比
3. 判断是否超出预算
4. 如果超预算，提供节省建议
5. 如果预算充裕，提供升级建议

## 输出格式

\`\`\`json
{
  "total_budget": 10000,
  "estimated_cost": 9500,
  "is_over_budget": false,
  "budget_status": "充裕/合理/紧张/超支",
  "budget_breakdown": {
    "transportation": {
      "amount": 2000,
      "percentage": 21.1,
      "details": "往返交通1000元，市内交通1000元"
    },
    "accommodation": {
      "amount": 2000,
      "percentage": 21.1,
      "details": "4晚住宿，每晚500元"
    },
    "food": {
      "amount": 2500,
      "percentage": 26.3,
      "details": "每天500元，包含早中晚餐和小吃"
    },
    "tickets": {
      "amount": 1000,
      "percentage": 10.5,
      "details": "各景点门票总计"
    },
    "shopping": {
      "amount": 1500,
      "percentage": 15.8,
      "details": "纪念品和特产"
    },
    "other": {
      "amount": 500,
      "percentage": 5.3,
      "details": "应急备用金"
    }
  },
  "comparison_with_budget": {
    "difference": 500,
    "percentage": 5,
    "status": "预算充裕"
  },
  "savings_tips": [
    {
      "category": "住宿",
      "tip": "可选择民宿代替酒店，每晚节省100-200元",
      "potential_savings": 500
    },
    {
      "category": "餐饮",
      "tip": "午餐选择性价比高的快餐，每餐节省20-30元",
      "potential_savings": 150
    }
  ],
  "upgrade_suggestions": [
    {
      "category": "住宿",
      "suggestion": "可升级到五星级酒店",
      "additional_cost": 800
    }
  ],
  "daily_budget_recommendation": {
    "day_1": 2000,
    "day_2": 1800,
    "day_3": 2000,
    "day_4": 1700,
    "day_5": 2000
  },
  "cost_comparison": {
    "with_similar_destinations": "比同类型目的地平均费用低10%",
    "seasonality": "当前为淡季，价格较旺季低20%"
  },
  "risk_assessment": {
    "budget_risk": "低/中/高",
    "contingency_plan": "建议额外准备500元应急资金"
  }
}
\`\`\`
`
```

---

## 3. 语音输入解析 Prompt

### 3.1 基础模板

```typescript
// src/prompts/voiceParse.ts
export const VOICE_PARSE_PROMPT = `
请从以下用户的语音描述中提取旅行需求信息。

## 用户描述
"{voiceText}"

## 提取要求

识别并提取以下信息：
- 目的地（城市或国家）
- 旅行天数
- 预算金额
- 同行人数
- 旅行偏好（如美食、文化、自然等）
- 其他特殊信息

## 输出格式

\`\`\`json
{
  "destination": "提取的目的地，如果未明确提及则为null",
  "days": 提取的天数，如果未明确提及则为null,
  "budget": 提取的预算金额（数字），如果未明确提及则为null,
  "travelers": 提取的人数（数字），如果未明确提及则为1,
  "preferences": ["提取的偏好1", "提取的偏好2"],
  "special_needs": "其他特殊需求或备注",
  "confidence": 0.95
}
\`\`\`

## 示例

输入: "我想下个月去北京玩5天，预算1万块，喜欢历史文化和美食，带着孩子一起"
输出:
\`\`\`json
{
  "destination": "北京",
  "days": 5,
  "budget": 10000,
  "travelers": 2,
  "preferences": ["历史文化", "美食", "亲子"],
  "special_needs": "带孩子出行",
  "confidence": 0.98
}
\`\`\`
`
```

---

## 4. 费用解析 Prompt

### 4.1 基础模板

```typescript
// src/prompts/expenseParse.ts
export const EXPENSE_PARSE_PROMPT = `
请从以下语音描述中提取费用信息。

## 用户描述
"{voiceText}"

## 提取要求

识别并提取：
- 金额（数字）
- 费用类别（交通/住宿/餐饮/门票/购物/娱乐/其他）
- 描述
- 日期（如果提及）

## 输出格式

\`\`\`json
{
  "amount": 150.00,
  "category": "food",
  "description": "午餐",
  "date": "2025-02-01",
  "confidence": 0.95
}
\`\`\`

## 类别映射

- 打车/出租/地铁/公交/火车/飞机 -> transportation
- 酒店/住宿/民宿 -> accommodation
- 吃饭/餐厅/小吃/饮料 -> food
- 门票/景点 -> ticket
- 买/购物/纪念品 -> shopping
- 娱乐/电影/演出 -> entertainment
- 其他 -> other
`
```

---

## 5. Prompt 优化技巧

### 5.1 提高输出质量

```typescript
// 1. 明确角色定位
const systemPrompt = '你是一位有10年经验的资深旅行规划师，曾服务过1000+客户'

// 2. 提供示例（Few-shot）
const examples = `
示例1:
输入: 北京5天，预算8000元
输出: { "destination": "北京", "days": 5, "budget": 8000 }

示例2:
输入: 下周去上海玩，两个人，喜欢美食
输出: { "destination": "上海", "travelers": 2, "preferences": ["美食"] }
`

// 3. 明确限制条件
const constraints = `
限制条件:
- 每日行程不超过3个主要景点
- 预算误差不超过5%
- 路线规划避免走回头路
`
```

### 5.2 控制输出格式

```typescript
// 1. 强调JSON格式
const formatInstruction = `
⚠️ 重要: 输出必须是有效的JSON格式，不要包含任何额外文字。
输出应该以 { 开始，以 } 结束。
`

// 2. 使用分隔符
const delimiter = `
请在 \`\`\`json 和 \`\`\` 之间输出JSON
`

// 3. 后处理
function extractJSON(response: string): object {
  // 提取代码块中的JSON
  const match = response.match(/```json\n([\s\S]*?)\n```/)
  if (match) {
    return JSON.parse(match[1])
  }
  // 直接解析
  return JSON.parse(response)
}
```

### 5.3 温度参数调优

```typescript
const temperatureGuide = {
  // 创意性任务（行程规划）
  creative: 0.7,
  
  // 信息提取任务
  extraction: 0.3,
  
  // 严格格式输出
  structured: 0.1,
  
  // 平衡
  balanced: 0.5
}
```

---

## 6. 测试与验证

### 6.1 测试用例

```typescript
// src/prompts/__tests__/prompts.test.ts
const testCases = [
  {
    name: '北京5日游',
    input: {
      destination: '北京',
      days: 5,
      budget: 10000,
      preferences: ['历史文化', '美食']
    },
    expectedKeys: ['trip_title', 'daily_itinerary', 'budget_breakdown']
  },
  {
    name: '日本7日游',
    input: {
      destination: '日本东京',
      days: 7,
      budget: 20000,
      preferences: ['动漫', '美食', '购物']
    },
    expectedKeys: ['trip_title', 'daily_itinerary', 'budget_breakdown']
  }
]
```

### 6.2 质量评估

```typescript
interface PromptQualityMetrics {
  json_validity: number    // JSON格式正确性 (0-1)
  completeness: number     // 信息完整性 (0-1)
  relevance: number        // 内容相关性 (0-1)
  logic: number           // 逻辑合理性 (0-1)
  budget_accuracy: number  // 预算准确性 (0-1)
}

function evaluatePromptOutput(output: any): PromptQualityMetrics {
  return {
    json_validity: isValidJSON(output) ? 1 : 0,
    completeness: checkCompleteness(output),
    relevance: checkRelevance(output),
    logic: checkLogic(output),
    budget_accuracy: checkBudgetAccuracy(output)
  }
}
```

---

## 7. 版本管理

### 7.1 Prompt 版本控制

```typescript
// src/prompts/versions.ts
export const PROMPT_VERSIONS = {
  itinerary: {
    v1: ITINERARY_PROMPT_V1,
    v2: ITINERARY_PROMPT_V2,  // 优化后的版本
    current: 'v2'
  }
}

export function getPrompt(type: string, version?: string) {
  const promptType = PROMPT_VERSIONS[type]
  const ver = version || promptType.current
  return promptType[ver]
}
```

### 7.2 A/B 测试

```typescript
// 随机选择不同版本进行测试
function getPromptForABTest() {
  const random = Math.random()
  return random < 0.5 ? PROMPT_V1 : PROMPT_V2
}
```

---

## 8. 最佳实践

### 8.1 Do's ✅

- 明确角色定位
- 提供具体示例
- 使用结构化输出格式
- 设置合理的限制条件
- 处理边界情况
- 定期测试和优化

### 8.2 Don'ts ❌

- 不要使用模糊的描述
- 不要过度依赖模型"理解"能力
- 不要忽略错误处理
- 不要使用过高的温度参数（结构化输出）
- 不要在 Prompt 中包含敏感信息

---

## 9. 调试技巧

### 9.1 日志记录

```typescript
function logPromptExecution(prompt: string, response: string, duration: number) {
  console.log({
    timestamp: new Date().toISOString(),
    prompt: prompt.substring(0, 100) + '...',
    response: response.substring(0, 100) + '...',
    duration,
    tokens: estimateTokens(prompt + response)
  })
}
```

### 9.2 逐步调试

```typescript
// 1. 先测试简单场景
const simpleTest = {
  destination: '北京',
  days: 1,
  budget: 500
}

// 2. 逐步增加复杂度
const complexTest = {
  destination: '日本东京和京都',
  days: 7,
  budget: 20000,
  preferences: ['美食', '动漫', '温泉', '购物'],
  specialNeeds: '带老人和孩子'
}
```

---

**文档版本**: v1.0  
**维护人**: 开发团队  
**最后更新**: 2025-01-XX
