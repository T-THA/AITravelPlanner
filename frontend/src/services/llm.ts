import type { VoiceParsedData } from '../types';

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
  "travelers": 2,
  "preferences": ["历史", "文化", "美食", "亲子"],
  "special_needs": "带孩子出行",
  "confidence": 0.98
}
\`\`\`

示例2:
输入: "3月15号去上海，3天，两个人"
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
  "preferences": [],
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

## 注意事项
1. 如果用户提到"一万"、"1万"、"10000"等，统一转换为数字10000
2. 如果用户说"我和XX"、"带着XX"等，需要推算出总人数
3. 日期必须是未来日期，如果推算的日期已过，则推到明年
4. confidence 表示提取的置信度（0-1之间），根据信息的完整度和明确性判断
5. 只返回 JSON，不要有任何其他文字
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
   * 生成行程计划（后续实现）
   */
  async generateItinerary(_tripRequest: any): Promise<{ data: any | null; error: Error | null }> {
    // TODO: 实现行程生成功能
    return { data: null, error: new Error('功能尚未实现') };
  },

  /**
   * 预算分析（后续实现）
   */
  async analyzeBudget(_tripData: any): Promise<{ data: any | null; error: Error | null }> {
    // TODO: 实现预算分析功能
    return { data: null, error: new Error('功能尚未实现') };
  },
};
