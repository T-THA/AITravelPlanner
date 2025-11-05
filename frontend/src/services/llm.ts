import type { VoiceParsedData, TripRequest, GeneratedItinerary } from '../types';
import { generateItineraryPrompt } from '../prompts/itinerary';

// 获取环境变量
const API_KEY = import.meta.env.VITE_ALIYUN_API_KEY;
const BASE_URL = import.meta.env.VITE_ALIYUN_BASE_URL;
const MODEL_NAME = import.meta.env.VITE_ALIYUN_MODEL_NAME;

// 语音输入解析 Prompt
const VOICE_PARSE_PROMPT = `请从以下用户的语音描述中提取旅行需求信息。

## 用户描述
"{voiceText}"

## 当前日期
今天是 {currentDate}

## 提取要求

识别并提取：
- destination: 目的地（城市名称，可能有多个）
- start_date: 出发日期（YYYY-MM-DD格式）
- end_date: 返程日期（YYYY-MM-DD格式）
- days: 旅行天数（数字）
- budget: 预算金额（数字，单位：元）
- travelers: 同行人数（数字）
- preferences: 旅行偏好（数组）可能的值包括：美食、购物、文化、自然、亲子、摄影、历史、休闲
- special_needs: 其他特殊需求或备注

## 人数识别规则

1. **明确数字**: "两个人"、"3个人"、"四口人" -> 提取数字
2. **代词推算**: 
   - "我" -> 1人
   - "我和老婆"、"我和朋友"、"我们俩" -> 2人
   - "我们一家三口"、"带着孩子" -> 推算为3人（父母+1孩子）
   - "我们一家" -> 默认3人
   - "全家" -> 默认4人
3. **其他**: "一个人"、"独自" -> 1人

## 偏好识别规则

识别以下关键词并映射到对应偏好：
- **美食**: 吃、美食、小吃、特色菜、餐厅、火锅、当地菜
- **购物**: 买、购物、商场、特产、纪念品
- **文化**: 文化、博物馆、展览、艺术、戏曲
- **自然**: 自然、风景、山水、爬山、徒步、户外、海边、湖泊
- **亲子**: 孩子、小孩、儿童、亲子、带娃、家庭游
- **摄影**: 拍照、摄影、打卡
- **历史**: 历史、古迹、寺庙、古城、遗址
- **休闲**: 休闲、放松、度假、悠闲

## 日期解析规则

1. **明确日期**: "3月15日出发" -> 推算为今年或明年3月15日（取最近的未来日期）
2. **相对日期**: "下周五" -> 计算具体日期；"明天" -> 当前日期+1天
3. **月份**: "下个月" -> 推算为下个月的第1天
4. **天数**: "玩5天" -> 如果没有明确出发日期，默认从明天开始，计算出 start_date 和 end_date
5. **默认**: 如果完全没有提到日期，从明天开始算起

## 输出格式

请严格按照以下 JSON 格式输出，不要包含任何额外的解释文字：

\`\`\`json
{
  "destination": "提取的目的地，如果未明确提及则为null",
  "start_date": "出发日期 YYYY-MM-DD，根据日期规则推算",
  "end_date": "返程日期 YYYY-MM-DD，根据日期规则推算",
  "days": 提取的天数，如果未明确提及则为null,
  "budget": 提取的预算金额（数字），如果未明确提及则为null,
  "travelers": 提取的人数（数字），如果未明确提及则为1,
  "preferences": ["提取的偏好1", "提取的偏好2"],
  "special_needs": "其他特殊需求或备注",
  "confidence": 0.95
}
\`\`\`

## 示例

示例1:
输入: "我想下个月去北京玩5天，预算1万块，喜欢历史文化和美食，带着孩子一起"
当前日期: 2025-01-15
输出:
\`\`\`json
{
  "destination": "北京",
  "start_date": "2025-02-01",
  "end_date": "2025-02-05",
  "days": 5,
  "budget": 10000,
  "travelers": 3,
  "preferences": ["历史", "文化", "美食", "亲子"],
  "special_needs": "带孩子出行",
  "confidence": 0.98
}
\`\`\`

示例2:
输入: "3月15号去上海，3天，两个人，喜欢拍照和吃东西"
当前日期: 2025-01-15
输出:
\`\`\`json
{
  "destination": "上海",
  "start_date": "2025-03-15",
  "end_date": "2025-03-17",
  "days": 3,
  "budget": null,
  "travelers": 2,
  "preferences": ["摄影", "美食"],
  "special_needs": null,
  "confidence": 0.95
}
\`\`\`

示例3:
输入: "想去成都玩，大概5天，喜欢美食和自然风光"
当前日期: 2025-01-15
输出:
\`\`\`json
{
  "destination": "成都",
  "start_date": "2025-01-16",
  "end_date": "2025-01-20",
  "days": 5,
  "budget": null,
  "travelers": 1,
  "preferences": ["美食", "自然"],
  "special_needs": null,
  "confidence": 0.90
}
\`\`\`

示例4:
输入: "我和老婆想去杭州，想看西湖，逛逛博物馆，找个地方放松一下"
当前日期: 2025-01-15
输出:
\`\`\`json
{
  "destination": "杭州",
  "start_date": "2025-01-16",
  "end_date": "2025-01-16",
  "days": null,
  "budget": null,
  "travelers": 2,
  "preferences": ["自然", "文化", "休闲"],
  "special_needs": null,
  "confidence": 0.88
}
\`\`\`

## 注意事项
1. **预算识别**: "一万"、"1万"、"10000"、"1w" 统一转换为数字10000；"5千" -> 5000
2. **人数推算**: 仔细分析代词和人员关系，准确推算人数
3. **偏好提取**: 从描述中提取所有相关偏好关键词，可以有多个
4. **日期推算**: 日期必须是未来日期，如果推算的日期已过，则推到明年
5. **置信度**: confidence 表示提取的置信度（0-1之间），根据信息的完整度和明确性判断
6. **输出格式**: 只返回 JSON，不要有任何其他文字
`;

export const llmService = {
  /**
   * 解析语音文本为结构化数据
   */
  async parseVoiceText(voiceText: string): Promise<{ data: VoiceParsedData | null; error: Error | null }> {
    try {
      if (!API_KEY) {
        return { data: null, error: new Error('阿里云 API Key 未配置') };
      }

      // 获取当前日期
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const prompt = VOICE_PARSE_PROMPT
        .replace('{voiceText}', voiceText)
        .replace('{currentDate}', currentDate);

      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的旅行需求分析助手，擅长从用户的自然语言描述中提取结构化的旅行信息。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LLM API Error:', errorText);
        return { data: null, error: new Error(`API 请求失败: ${response.status}`) };
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      if (!content) {
        return { data: null, error: new Error('API 返回内容为空') };
      }

      // 提取 JSON 内容（处理可能包含 ```json 标记的情况）
      let jsonText = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      // 解析 JSON
      const parsedData = JSON.parse(jsonText.trim()) as VoiceParsedData;

      return { data: parsedData, error: null };
    } catch (error) {
      console.error('Parse voice text error:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * 生成行程计划
   */
  async generateItinerary(tripRequest: TripRequest): Promise<{ data: GeneratedItinerary | null; error: Error | null }> {
    try {
      if (!API_KEY) {
        return { data: null, error: new Error('阿里云 API Key 未配置') };
      }

      // 获取当前日期
      const currentDate = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });

      // 生成 Prompt
      const prompt = generateItineraryPrompt(tripRequest, currentDate);

      console.log('生成行程 Prompt:', prompt.substring(0, 500) + '...');

      // 调用 API
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            {
              role: 'system',
              content: '你是一位专业的旅行规划师，擅长根据用户需求定制个性化旅行方案。你的回复必须严格遵守 JSON 格式。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,  // 稍高一些以增加创造性
          max_tokens: 4000,  // 足够长的输出
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LLM API Error:', errorText);
        return { data: null, error: new Error(`API 请求失败: ${response.status}`) };
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      if (!content) {
        return { data: null, error: new Error('API 返回内容为空') };
      }

      console.log('LLM 返回内容:', content.substring(0, 500) + '...');

      // 提取 JSON 内容（处理可能包含 ```json 标记的情况）
      let jsonText = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        // 尝试直接查找 JSON 对象
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonText = jsonObjectMatch[0];
        }
      }

      // 解析 JSON
      const itineraryData = JSON.parse(jsonText.trim()) as GeneratedItinerary;

      // 验证必要字段
      if (!itineraryData.trip_title || !itineraryData.daily_itinerary || itineraryData.daily_itinerary.length === 0) {
        return { data: null, error: new Error('生成的行程数据不完整') };
      }

      console.log('✅ 行程生成成功:', itineraryData.trip_title);

      return { data: itineraryData, error: null };
    } catch (error) {
      console.error('Generate itinerary error:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * 预算分析
   */
  async analyzeBudget(params: {
    userBudget: number;
    budgetBreakdown: {
      transportation: number;
      accommodation: number;
      food: number;
      tickets: number;
      shopping: number;
      other: number;
    };
    destination: string;
    days: number;
    travelers: number;
  }): Promise<{ data: any | null; error: Error | null }> {
    try {
      if (!API_KEY) {
        return { data: null, error: new Error('阿里云 API Key 未配置') };
      }

      const { userBudget, budgetBreakdown, destination, days, travelers } = params;
      
      const totalEstimated = Object.values(budgetBreakdown).reduce((sum, val) => sum + val, 0);
      const difference = userBudget - totalEstimated;
      const differencePercentage = ((difference / userBudget) * 100).toFixed(1);

      const systemPrompt = `你是一位专业的旅行预算分析师，擅长帮助用户合理规划旅行支出。
你需要分析用户的预算和行程费用，提供专业的建议。

分析要点：
1. 对比用户预算与预计费用
2. 分析各项支出的合理性
3. 如果超预算，提供节省建议
4. 如果有剩余预算，提供优化建议
5. 识别潜在的隐性费用

输出格式必须是严格的 JSON，包含以下字段：
{
  "total_budget": 用户总预算(数字),
  "estimated_total": 预计总费用(数字),
  "budget_status": "within" 或 "close" 或 "exceed",
  "difference": 预算差额(数字,正数表示节省),
  "difference_percentage": 差额百分比(数字),
  "breakdown_analysis": {
    "transportation": {
      "budgeted": 交通费用(数字),
      "percentage": 占比(数字),
      "status": "reasonable" 或 "high" 或 "low",
      "comment": "AI评价(字符串)"
    },
    "accommodation": { ... },
    "food": { ... },
    "tickets": { ... },
    "shopping": { ... },
    "other": { ... }
  },
  "saving_suggestions": [
    {
      "category": "类别(字符串)",
      "suggestion": "建议(字符串)",
      "potential_saving": 可能节省金额(数字),
      "priority": "high" 或 "medium" 或 "low"
    }
  ],
  "warnings": ["警告信息数组"],
  "summary": "总体分析总结(字符串)"
}`;

      const userPrompt = `请分析以下旅行预算：

**旅行信息**：
- 目的地：${destination}
- 天数：${days}天
- 人数：${travelers}人
- 用户预算：¥${userBudget}

**预计费用明细**：
- 交通：¥${budgetBreakdown.transportation}
- 住宿：¥${budgetBreakdown.accommodation}
- 餐饮：¥${budgetBreakdown.food}
- 门票：¥${budgetBreakdown.tickets}
- 购物：¥${budgetBreakdown.shopping}
- 其他：¥${budgetBreakdown.other}
- **总计：¥${totalEstimated}**

**当前状况**：
${difference >= 0 ? 
  `预算充足，剩余 ¥${difference} (${differencePercentage}%)` : 
  `预算超支 ¥${Math.abs(difference)} (${Math.abs(parseFloat(differencePercentage))}%)`
}

请提供详细的预算分析和建议。直接返回 JSON，不要包含任何其他文字说明。`;

      console.log('预算分析 Prompt:', userPrompt.substring(0, 500) + '...');

      // 调用 API
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LLM API Error:', errorText);
        return { data: null, error: new Error(`API 请求失败: ${response.status}`) };
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      if (!content) {
        return { data: null, error: new Error('API 返回内容为空') };
      }

      console.log('预算分析返回内容:', content.substring(0, 500) + '...');

      // 尝试提取 JSON
      let jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (!jsonMatch) {
        jsonMatch = content.match(/(\{[\s\S]*\})/);
      }
      
      if (jsonMatch && jsonMatch[1]) {
        const analysisData = JSON.parse(jsonMatch[1]);
        console.log('✅ 预算分析成功:', analysisData);
        return { data: analysisData, error: null };
      } else {
        console.error('❌ 无法提取 JSON:', content);
        return { data: null, error: new Error('AI 返回格式异常') };
      }
    } catch (error) {
      console.error('预算分析失败:', error);
      return { data: null, error: error as Error };
    }
  },
};
