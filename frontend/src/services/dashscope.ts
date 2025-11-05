/**
 * 阿里云百炼平台（DashScope）服务
 * 使用通义千问模型进行旅行规划和预算分析
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';

// 模型选项
export const QwenModel = {
  TURBO: 'qwen-turbo', // 快速响应，适合开发测试
  PLUS: 'qwen-plus', // 平衡性能，推荐生产环境
  MAX: 'qwen-max', // 最高质量
  LONG: 'qwen-long', // 长文本处理
} as const;

export type QwenModelType = typeof QwenModel[keyof typeof QwenModel];

// API 响应类型
export interface DashScopeResponse {
  output: {
    text?: string;
    finish_reason?: string;
    choices?: Array<{
      message: {
        role: string;
        content: string;
      };
      finish_reason: string;
    }>;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
}

// 消息类型
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 生成参数
export interface GenerationParams {
  model?: QwenModelType;
  messages: Message[];
  temperature?: number; // 0-2，控制随机性
  top_p?: number; // 0-1，控制多样性
  max_tokens?: number; // 最大生成长度
  enable_search?: boolean; // 是否启用互联网搜索
}

/**
 * DashScope 服务类
 */
export class DashScopeService {
  private apiKey: string;
  private baseURL: string;
  private client: AxiosInstance;
  private defaultModel: QwenModelType;

  constructor(
    apiKey?: string,
    baseURL = '/api/dashscope/api/v1', // 使用代理路径，避免CORS问题
    defaultModel: QwenModelType = QwenModel.TURBO // 使用 turbo 模型
  ) {
    // 兼容两种环境变量名称
    this.apiKey = apiKey || 
                  import.meta.env.VITE_DASHSCOPE_API_KEY || 
                  import.meta.env.VITE_ALIYUN_API_KEY || 
                  '';
    this.baseURL = baseURL;
    // 优先使用配置的模型名称
    this.defaultModel = (import.meta.env.VITE_ALIYUN_MODEL_NAME as QwenModelType) || defaultModel;

    if (!this.apiKey) {
      console.warn('⚠️ DashScope API Key 未配置');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60秒超时
    });
  }

  /**
   * 检查是否已配置 API Key
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * 生成文本（通用方法）
   */
  async generate(params: GenerationParams): Promise<DashScopeResponse> {
    if (!this.isConfigured()) {
      throw new Error('DashScope API Key 未配置');
    }

    try {
      const response = await this.client.post<DashScopeResponse>(
        '/services/aigc/text-generation/generation',
        {
          model: params.model || this.defaultModel,
          input: {
            messages: params.messages,
          },
          parameters: {
            temperature: params.temperature ?? 0.7,
            top_p: params.top_p ?? 0.8,
            max_tokens: params.max_tokens ?? 2000,
            enable_search: params.enable_search ?? false,
            result_format: 'message',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('DashScope API 调用失败:', error);
      
      if (error.response) {
        // API 返回错误
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error?.message || '未知错误';
        
        if (status === 401) {
          throw new Error('API Key 无效或已过期');
        } else if (status === 429) {
          throw new Error('请求过于频繁，请稍后重试');
        } else if (status === 400) {
          throw new Error(`请求参数错误: ${message}`);
        } else {
          throw new Error(`API 错误 (${status}): ${message}`);
        }
      } else if (error.request) {
        // 网络错误 - 可能是CORS问题
        console.error('请求详情:', error.request);
        if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
          throw new Error('网络连接失败。可能原因：1) 阿里云API存在CORS限制，浏览器无法直接调用 2) 网络连接问题 3) API端点不可达。建议：使用后端代理或在服务器端调用API');
        }
        throw new Error(`网络请求失败: ${error.message}`);
      } else {
        throw new Error(`请求配置错误: ${error.message}`);
      }
    }
  }

  /**
   * 简单对话（单轮）
   */
  async chat(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Message[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt,
    });

    const response = await this.generate({
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // 提取返回内容
    if (response.output.choices && response.output.choices.length > 0) {
      return response.output.choices[0].message.content;
    } else if (response.output.text) {
      return response.output.text;
    } else {
      throw new Error('响应格式异常');
    }
  }

  /**
   * 行程规划
   */
  async generateItinerary(params: {
    destination: string;
    days: number;
    budget: number;
    travelers: number;
    preferences: string[];
    specialNeeds?: string;
  }): Promise<any> {
    const systemPrompt = `你是一位经验丰富的旅行规划师，擅长根据用户需求定制个性化旅行方案。
请严格按照 JSON 格式输出，确保内容详实、安排合理。`;

    const userPrompt = `请为我规划一次旅行：

目的地：${params.destination}
旅行天数：${params.days}天
总预算：${params.budget}元
同行人数：${params.travelers}人
旅行偏好：${params.preferences.join('、')}
${params.specialNeeds ? `特殊需求：${params.specialNeeds}` : ''}

请生成详细的行程规划，包括：
1. 每日景点安排（时间、地点、费用、游玩时长）
2. 餐饮推荐（特色餐厅、菜系、人均消费）
3. 住宿建议（酒店推荐、位置、价格区间）
4. 交通方案（往返交通、市内交通、费用）
5. 预算明细（确保总费用不超过${params.budget}元）

请以 JSON 格式输出，格式示例：
{
  "trip_title": "行程标题",
  "summary": "行程简介",
  "total_days": ${params.days},
  "daily_itinerary": [
    {
      "day": 1,
      "date": "日期",
      "theme": "当日主题",
      "items": [
        {
          "time": "09:00",
          "type": "attraction",
          "title": "景点名称",
          "description": "简介",
          "location": "详细地址",
          "duration": "2小时",
          "cost": 60
        }
      ]
    }
  ],
  "budget_breakdown": {
    "transportation": 金额,
    "accommodation": 金额,
    "food": 金额,
    "attractions": 金额,
    "shopping": 金额,
    "total": ${params.budget}
  }
}`;

    const content = await this.chat(userPrompt, systemPrompt);
    
    // 提取 JSON（可能包含在 markdown 代码块中）
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                      content.match(/(\{[\s\S]*\})/);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (error) {
        console.error('JSON 解析失败:', error);
        throw new Error('行程数据格式异常，请重试');
      }
    } else {
      throw new Error('未能提取有效的行程数据');
    }
  }

  /**
   * AI 预算分析
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
  }): Promise<any> {
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

    try {
      const response = await this.chat(userPrompt, systemPrompt);
      
      // 尝试提取 JSON
      let jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (!jsonMatch) {
        jsonMatch = response.match(/(\{[\s\S]*\})/);
      }
      
      if (jsonMatch && jsonMatch[1]) {
        const analysisData = JSON.parse(jsonMatch[1]);
        console.log('✅ 预算分析成功:', analysisData);
        return analysisData;
      } else {
        console.error('❌ 无法提取 JSON:', response);
        throw new Error('AI 返回格式异常');
      }
    } catch (error: any) {
      console.error('预算分析失败:', error);
      throw new Error(error.message || '预算分析失败，请重试');
    }
  }

  /**
   * 解析语音费用记录
   * 将语音识别的文本转换为结构化的费用数据
   */
  async parseExpense(text: string): Promise<any> {
    const systemPrompt = `你是一个专业的费用记录解析助手。
你的任务是将用户的语音描述转换为结构化的费用数据。

费用类别包括：
- transportation（交通）：打车、公交、地铁、火车、飞机等
- accommodation（住宿）：酒店、民宿、旅馆等
- food（餐饮）：早餐、午餐、晚餐、小吃、饮料等
- ticket（门票）：景点门票、表演票等
- shopping（购物）：商场购物、纪念品等
- entertainment（娱乐）：KTV、电影、游乐场等
- other（其他）：无法归类的费用

支付方式包括：
- cash（现金）
- credit_card（信用卡）
- debit_card（借记卡）
- mobile_payment（移动支付）：支付宝、微信支付等
- other（其他）

你需要从用户的描述中提取以下信息：
1. amount（金额）：数字，单位元
2. category（类别）：从上述类别中选择最合适的
3. description（描述）：简短描述，保留关键信息
4. expense_date（日期）：YYYY-MM-DD格式，如果用户说"今天"则使用今天日期
5. payment_method（支付方式）：从上述方式中选择，如果没提到则留空

请以JSON格式返回结果，只返回JSON，不要其他内容：
{
  "amount": 数字,
  "category": "类别",
  "description": "描述",
  "expense_date": "日期",
  "payment_method": "支付方式（可选）"
}`;

    const userPrompt = `请解析以下费用记录：
"${text}"

今天的日期是：${new Date().toISOString().slice(0, 10)}`;

    try {
      const response = await this.chat(userPrompt, systemPrompt);
      
      // 提取JSON
      let jsonStr = response.trim();
      const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/) || 
                       jsonStr.match(/```\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      // 解析JSON
      const parsed = JSON.parse(jsonStr);
      
      // 验证必填字段
      if (!parsed.amount || !parsed.category) {
        throw new Error('解析结果缺少必填字段');
      }
      
      return {
        amount: Number(parsed.amount),
        category: parsed.category,
        description: parsed.description || '',
        expense_date: parsed.expense_date || new Date().toISOString().slice(0, 10),
        payment_method: parsed.payment_method || undefined,
      };
    } catch (error: any) {
      console.error('费用解析失败:', error);
      throw new Error('无法理解您的费用描述，请重新描述或手动输入');
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      await this.chat(
        '请回复：连接成功',
        '你是一个测试助手，收到消息后只需简单回复即可。'
      );

      return {
        success: true,
        message: '连接成功',
        model: this.defaultModel,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '连接失败',
      };
    }
  }
}

// 导出单例
export const dashScopeService = new DashScopeService();
