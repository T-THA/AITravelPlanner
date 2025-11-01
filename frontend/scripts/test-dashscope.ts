/**
 * 阿里云百炼平台（DashScope）API 测试脚本
 */

import { config } from 'dotenv';
import axios from 'axios';

// 加载环境变量
config({ path: '.env' });

const API_KEY = process.env.VITE_ALIYUN_API_KEY;
// 使用标准DashScope API端点，不使用兼容模式
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';
const MODEL = process.env.VITE_ALIYUN_MODEL_NAME || 'qwen-turbo';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查配置
function checkConfig() {
  log('\n📋 配置检查:', 'cyan');
  
  if (!API_KEY) {
    log('   ❌ VITE_DASHSCOPE_API_KEY 未配置', 'red');
    log('   请在 .env 文件中添加: VITE_DASHSCOPE_API_KEY=your-api-key', 'yellow');
    return false;
  }
  
  log(`   ✅ API Key: ${API_KEY.substring(0, 10)}...`, 'green');
  log(`   ✅ 模型: ${MODEL}`, 'green');
  return true;
}

// 测试1: 简单对话
async function testSimpleChat() {
  log('\n🔄 测试 1: 简单对话（连接测试）...', 'cyan');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/services/aigc/text-generation/generation`,
      {
        model: MODEL,
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一个测试助手，收到消息后只需简单回复。',
            },
            {
              role: 'user',
              content: '请回复：连接成功',
            },
          ],
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 100,
          result_format: 'message',
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.output.choices[0].message.content;
    const usage = response.data.usage;

    log('✅ 简单对话测试成功！', 'green');
    log(`💬 回复内容: ${content}`, 'blue');
    log(`📊 Token 使用: 输入 ${usage.input_tokens} + 输出 ${usage.output_tokens} = ${usage.total_tokens}`, 'blue');
    return true;
  } catch (error: any) {
    log('❌ 简单对话测试失败', 'red');
    if (error.response) {
      log(`   错误信息: ${error.response.data.message || error.message}`, 'red');
      log(`   状态码: ${error.response.status}`, 'red');
    } else {
      log(`   错误信息: ${error.message}`, 'red');
    }
    return false;
  }
}

// 测试2: 行程规划
async function testItineraryGeneration() {
  log('\n🔄 测试 2: AI 行程规划...', 'cyan');
  log('   生成 "北京5日游" 行程，预算10000元...', 'yellow');
  
  try {
    const userPrompt = `请为我规划一次旅行：

目的地：北京
旅行天数：5天
总预算：10000元
同行人数：2人
旅行偏好：历史文化、美食、摄影

请生成详细的行程规划，包括：
1. 每日景点安排（时间、地点、费用、游玩时长）
2. 餐饮推荐（特色餐厅、人均消费）
3. 住宿建议（酒店推荐、价格区间）
4. 交通方案（往返交通、市内交通）
5. 预算明细（确保总费用不超过10000元）

请以 JSON 格式输出，格式示例：
{
  "trip_title": "北京5日文化之旅",
  "summary": "行程简介",
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
          "location": "详细地址",
          "cost": 60
        }
      ]
    }
  ],
  "budget_breakdown": {
    "transportation": 2000,
    "accommodation": 2000,
    "food": 2000,
    "attractions": 2000,
    "shopping": 2000,
    "total": 10000
  }
}`;

    const response = await axios.post(
      `${BASE_URL}/services/aigc/text-generation/generation`,
      {
        model: MODEL,
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一位经验丰富的旅行规划师，擅长根据用户需求定制个性化旅行方案。请严格按照 JSON 格式输出。',
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
          result_format: 'message',
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60秒超时
      }
    );

    const content = response.data.output.choices[0].message.content;
    const usage = response.data.usage;

    // 尝试提取 JSON
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                      content.match(/(\{[\s\S]*\})/);
    
    if (jsonMatch && jsonMatch[1]) {
      const itinerary = JSON.parse(jsonMatch[1]);
      
      log('✅ 行程规划测试成功！', 'green');
      log(`📝 行程标题: ${itinerary.trip_title}`, 'blue');
      log(`📅 旅行天数: ${itinerary.total_days}天`, 'blue');
      
      if (itinerary.budget_breakdown) {
        log('💰 预算分配:', 'blue');
        Object.entries(itinerary.budget_breakdown).forEach(([key, value]) => {
          const label = key === 'transportation' ? '交通' :
                       key === 'accommodation' ? '住宿' :
                       key === 'food' ? '餐饮' :
                       key === 'attractions' ? '景点' :
                       key === 'shopping' ? '购物' :
                       key === 'total' ? '总计' : key;
          log(`   ${label}: ¥${value}`, 'blue');
        });
      }
      
      if (itinerary.daily_itinerary && itinerary.daily_itinerary.length > 0) {
        log(`📍 第一天安排:`, 'blue');
        log(`   主题: ${itinerary.daily_itinerary[0].theme}`, 'blue');
        if (itinerary.daily_itinerary[0].items && itinerary.daily_itinerary[0].items.length > 0) {
          log(`   行程项数量: ${itinerary.daily_itinerary[0].items.length}`, 'blue');
        }
      }
      
      log(`📊 Token 使用: 输入 ${usage.input_tokens} + 输出 ${usage.output_tokens} = ${usage.total_tokens}`, 'blue');
      log(`💵 估算费用: ¥${(usage.total_tokens / 1000 * 0.004).toFixed(4)}`, 'blue');
      
      return true;
    } else {
      log('⚠️  JSON 提取失败，但API调用成功', 'yellow');
      log(`💬 原始回复（前500字）: ${content.substring(0, 500)}...`, 'yellow');
      return false;
    }
  } catch (error: any) {
    log('❌ 行程规划测试失败', 'red');
    if (error.response) {
      log(`   错误信息: ${error.response.data.message || error.message}`, 'red');
      log(`   状态码: ${error.response.status}`, 'red');
    } else {
      log(`   错误信息: ${error.message}`, 'red');
    }
    return false;
  }
}

// 测试3: 预算分析
async function testBudgetAnalysis() {
  log('\n🔄 测试 3: AI 预算分析...', 'cyan');
  
  try {
    const userPrompt = `请分析以下旅行预算：

目的地：北京
旅行天数：5天
总预算：10000元
已花费：9800元
剩余：200元

费用明细：
- 交通: 2000元
- 住宿: 2500元
- 餐饮: 3000元
- 景点: 1500元
- 购物: 800元

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

    const response = await axios.post(
      `${BASE_URL}/services/aigc/text-generation/generation`,
      {
        model: MODEL,
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一位财务分析师，擅长旅行预算规划和费用分析。请严格按照 JSON 格式输出。',
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 1000,
          result_format: 'message',
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.output.choices[0].message.content;
    const usage = response.data.usage;

    // 尝试提取 JSON
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                      content.match(/(\{[\s\S]*\})/);
    
    if (jsonMatch && jsonMatch[1]) {
      const analysis = JSON.parse(jsonMatch[1]);
      
      log('✅ 预算分析测试成功！', 'green');
      log(`📊 状态: ${analysis.status}`, 'blue');
      log(`💬 分析: ${analysis.analysis}`, 'blue');
      
      if (analysis.suggestions && analysis.suggestions.length > 0) {
        log(`💡 建议 (${analysis.suggestions.length}条):`, 'blue');
        analysis.suggestions.forEach((suggestion: string, index: number) => {
          log(`   ${index + 1}. ${suggestion}`, 'blue');
        });
      }
      
      log(`📊 Token 使用: 输入 ${usage.input_tokens} + 输出 ${usage.output_tokens} = ${usage.total_tokens}`, 'blue');
      log(`💵 估算费用: ¥${(usage.total_tokens / 1000 * 0.004).toFixed(4)}`, 'blue');
      
      return true;
    } else {
      log('⚠️  JSON 提取失败，但API调用成功', 'yellow');
      log(`💬 原始回复（前300字）: ${content.substring(0, 300)}...`, 'yellow');
      return false;
    }
  } catch (error: any) {
    log('❌ 预算分析测试失败', 'red');
    if (error.response) {
      log(`   错误信息: ${error.response.data.message || error.message}`, 'red');
      log(`   状态码: ${error.response.status}`, 'red');
    } else {
      log(`   错误信息: ${error.message}`, 'red');
    }
    return false;
  }
}

// 主测试函数
async function main() {
  log('╔════════════════════════════════════════════╗', 'cyan');
  log('║  阿里云百炼平台 API 测试                ║', 'cyan');
  log('╚════════════════════════════════════════════╝', 'cyan');

  // 配置检查
  if (!checkConfig()) {
    process.exit(1);
  }

  let passedTests = 0;
  const totalTests = 3;

  // 测试1: 简单对话
  if (await testSimpleChat()) {
    passedTests++;
  }

  // 等待1秒避免请求过快
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 测试2: 行程规划
  if (await testItineraryGeneration()) {
    passedTests++;
  }

  // 等待1秒
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 测试3: 预算分析
  if (await testBudgetAnalysis()) {
    passedTests++;
  }

  // 总结
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║  测试总结                                ║', 'cyan');
  log('╚════════════════════════════════════════════╝', 'cyan');
  log(`\n测试结果: ${passedTests}/${totalTests} 通过`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 所有测试通过！阿里云百炼 API 配置正确！', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查配置和网络连接', 'yellow');
  }
}

// 运行测试
main().catch(error => {
  log(`\n❌ 测试运行失败: ${error.message}`, 'red');
  process.exit(1);
});
