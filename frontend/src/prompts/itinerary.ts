/**
 * 行程规划 Prompt 模板
 * 用于调用 LLM API 生成详细的旅行行程
 */

import type { TripRequest } from '../types';

/**
 * 生成行程规划的 Prompt
 */
export function generateItineraryPrompt(request: TripRequest, currentDate: string): string {
  // 计算旅行天数
  const days = Math.ceil(
    (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const prompt = `你是一位经验丰富的旅行规划师，擅长根据用户需求定制个性化旅行方案。

## 用户需求
- 目的地: ${request.destination.join('、')}
- 出发日期: ${request.startDate}
- 返程日期: ${request.endDate}
- 旅行天数: ${days}天
- 总预算: ${request.budget}元
- 同行人数: ${request.travelersCount}人
- 人员构成: ${request.travelersType.join('、')}
- 旅行偏好: ${request.preferences.join('、')}
- 住宿偏好: ${request.accommodation}
- 行程节奏: ${request.pace}
- 特殊需求: ${request.specialNeeds || '无'}

## 当前日期
今天是 ${currentDate}

## 任务要求

请生成一份详细的旅行计划，包含：

### 1. 每日行程安排
- 按时间顺序列出每天的活动
- 包含景点、餐厅、交通、住宿
- 时间安排合理，避免过于紧凑或松散
- 路线规划避免走回头路
- 根据行程节奏（${request.pace}）合理安排活动密度

### 2. 景点推荐
- 符合用户偏好（${request.preferences.join('、')}）的景点
- 包含景点简介、开放时间、门票价格
- 预估游玩时长
- 游玩建议和注意事项

### 3. 餐饮推荐
- 当地特色餐厅
- 菜系类型和人均消费
- 推荐菜品
- 考虑${request.travelersCount}人用餐

### 4. 住宿建议
- 符合预算和偏好（${request.accommodation}）的酒店
- 位置便利性说明
- 价格区间和特色

### 5. 交通方案
- 往返目的地的交通方式
- 市内交通建议
- 预估交通费用

### 6. 预算分配
- 详细列出各项费用
- 确保总费用不超过${request.budget}元
- 为${request.travelersCount}人计算总费用

## 输出格式

请严格按照以下 JSON 格式输出，不要包含任何额外的解释文字：

\`\`\`json
{
  "trip_title": "行程标题（例如：北京5日文化之旅）",
  "summary": "行程简介（100字以内）",
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "total_days": ${days},
  "daily_itinerary": [
    {
      "day": 1,
      "date": "${request.startDate}",
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
        },
        {
          "time": "18:00",
          "type": "restaurant",
          "title": "晚餐餐厅",
          "description": "特色",
          "location": "地址",
          "cuisine": "菜系",
          "cost": 200,
          "recommended_dishes": ["菜品1", "菜品2"]
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
  "packing_list": ["必带物品1", "必带物品2", "必带物品3"],
  "travel_tips": ["旅行建议1", "旅行建议2", "旅行建议3"],
  "emergency_contacts": {
    "police": "110",
    "hospital": "120",
    "tourist_hotline": "12301"
  }
}
\`\`\`

## 注意事项

1. 所有价格为人民币，为整数或保留一位小数
2. 时间格式统一为 HH:mm（24小时制）
3. 日期格式为 YYYY-MM-DD
4. 确保 JSON 格式完全正确，可被解析
5. 行程安排要符合实际情况，避免不合理的时间安排
6. 预算分配要合理，总和应接近用户预算${request.budget}元
7. 考虑目的地的实际情况（气候、节假日、特殊事件等）
8. 每天至少安排2个景点、2顿正餐
9. 景点开放时间要准确，避免安排在闭馆时间
10. 考虑人员构成（${request.travelersType.join('、')}），推荐适合的景点和餐厅
11. 特殊需求（${request.specialNeeds || '无'}）必须在行程中体现
12. 只返回 JSON，不要有任何其他解释文字
`;

  return prompt;
}
