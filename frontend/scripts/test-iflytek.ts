/**
 * 科大讯飞语音识别 API 测试脚本
 * 用于验证 API 配置和连接
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import CryptoJS from 'crypto-js';
import WebSocket from 'ws';

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// API 配置
const config = {
  appId: process.env.VITE_IFLYTEK_APP_ID || '',
  apiKey: process.env.VITE_IFLYTEK_API_KEY || '',
  apiSecret: process.env.VITE_IFLYTEK_API_SECRET || '',
};

/**
 * 生成 WebSocket 鉴权 URL
 */
function generateAuthUrl(): string {
  const url = 'wss://iat-api.xfyun.cn/v2/iat';
  const host = 'iat-api.xfyun.cn';
  const date = new Date().toUTCString();
  const algorithm = 'hmac-sha256';
  const headers = 'host date request-line';

  // 拼接签名原文
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`;

  // 使用 hmac-sha256 加密
  const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret);
  const signature = CryptoJS.enc.Base64.stringify(signatureSha);

  // 拼接 authorization
  const authorizationOrigin = `api_key="${config.apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');

  // 拼接 URL
  return `${url}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
}

/**
 * 测试 WebSocket 连接
 */
async function testWebSocketConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('🔄 正在测试 WebSocket 连接...');

    const authUrl = generateAuthUrl();
    const ws = new WebSocket(authUrl);

    let connected = false;

    ws.on('open', () => {
      console.log('✅ WebSocket 连接成功！');
      connected = true;

      // 发送测试参数
      const params = {
        common: {
          app_id: config.appId,
        },
        business: {
          language: 'zh_cn',
          domain: 'iat',
          accent: 'mandarin',
        },
        data: {
          status: 2, // 直接发送结束标识进行测试
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: '',
        },
      };

      ws.send(JSON.stringify(params));
    });

    ws.on('message', (data: Buffer) => {
      const response = JSON.parse(data.toString());
      
      if (response.code === 0) {
        console.log('✅ API 鉴权成功！');
        console.log('📊 响应数据:', JSON.stringify(response, null, 2));
      } else {
        console.error('❌ API 错误:', response.code, response.message);
      }
      
      ws.close();
      resolve(connected && response.code === 0);
    });

    ws.on('error', (error: Error) => {
      console.error('❌ WebSocket 错误:', error.message);
      ws.close();
      resolve(false);
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket 连接已关闭');
      if (!connected) {
        resolve(false);
      }
    });

    // 超时处理
    setTimeout(() => {
      if (!connected) {
        console.error('❌ 连接超时');
        ws.close();
        resolve(false);
      }
    }, 10000);
  });
}

/**
 * 主测试函数
 */
async function main() {
  console.log('\n🚀 开始测试科大讯飞语音识别 API...\n');

  // 1. 检查配置
  console.log('📋 配置检查:');
  console.log(`   APP_ID: ${config.appId ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   API_KEY: ${config.apiKey ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   API_SECRET: ${config.apiSecret ? '✅ 已配置' : '❌ 未配置'}`);
  console.log();

  if (!config.appId || !config.apiKey || !config.apiSecret) {
    console.error('❌ 测试失败：API 配置不完整！');
    console.log('\n请在 frontend/.env 文件中配置以下环境变量：');
    console.log('   VITE_IFLYTEK_APP_ID=你的APP_ID');
    console.log('   VITE_IFLYTEK_API_KEY=你的API_KEY');
    console.log('   VITE_IFLYTEK_API_SECRET=你的API_SECRET\n');
    process.exit(1);
  }

  // 2. 测试 WebSocket 连接
  const connectionSuccess = await testWebSocketConnection();
  console.log();

  // 3. 输出测试结果
  if (connectionSuccess) {
    console.log('🎉 所有测试通过！科大讯飞 API 配置正确！');
    console.log('\n📝 下一步：');
    console.log('   1. 启动开发服务器: npm run dev');
    console.log('   2. 访问语音测试页面: http://localhost:5173/voice-test');
    console.log('   3. 点击"开始录音"按钮进行实际语音测试\n');
    process.exit(0);
  } else {
    console.error('❌ 测试失败！请检查 API 配置是否正确。');
    console.log('\n💡 故障排除：');
    console.log('   1. 确认科大讯飞控制台中 APP_ID 和密钥是否正确');
    console.log('   2. 检查网络连接是否正常');
    console.log('   3. 确认 API 服务是否已开通\n');
    process.exit(1);
  }
}

// 运行测试
main().catch((error) => {
  console.error('❌ 测试过程中发生错误:', error);
  process.exit(1);
});
