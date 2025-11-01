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
    baseURL = 'https://dashscope.aliyuncs.com/api/v1',
    defaultModel: QwenModelType = QwenModel.PLUS
  ) {
    this.apiKey = apiKey || import.meta.env.VITE_DASHSCOPE_API_KEY || '';
    this.baseURL = baseURL;
    this.defaultModel = defaultModel;

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
        const message = error.response.data?.message || '未知错误';
        
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
        // 网络错误
        throw new Error('网络连接失败，请检查网络设置');
      } else {
        throw new Error('请求配置错误');
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
   * 预算分析
   */
  async analyzeBudget(params: {
    destination: string;
    days: number;
    currentBudget: number;
    expenses: Array<{ category: string; amount: number }>;
  }): Promise<any> {
    const systemPrompt = `你是一位财务分析师，擅长旅行预算规划和费用分析。`;

    const totalExpense = params.expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = params.currentBudget - totalExpense;

    const userPrompt = `请分析以下旅行预算：

目的地：${params.destination}
旅行天数：${params.days}天
总预算：${params.currentBudget}元
已花费：${totalExpense}元
剩余：${remaining}元

费用明细：
${params.expenses.map(e => `- ${e.category}: ${e.amount}元`).join('\n')}

请提供：
1. 预算使用情况分析
2. 各类别费用占比是否合理
3. 是否有超支风险
4. 节省建议（如果预算紧张）
5. 剩余预算使用建议

以 JSON 格式输出：
{
  "status": "正常/警告/超支",
  "analysis": "整体分析",
  "suggestions": ["建议1", "建议2"],
  "breakdown_analysis": {
    "transportation": "分析",
    "accommodation": "分析",
    "food": "分析"
  }
}`;

    const content = await this.chat(userPrompt, systemPrompt);
    
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                      content.match(/(\{[\s\S]*\})/);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (error) {
        console.error('JSON 解析失败:', error);
        throw new Error('预算分析数据格式异常，请重试');
      }
    } else {
      throw new Error('未能提取有效的预算分析数据');
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
