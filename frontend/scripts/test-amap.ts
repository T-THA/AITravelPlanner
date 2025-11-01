/**
 * 高德地图 API 测试脚本
 * 用于验证 API 配置和基本功能
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// API 配置
const config = {
  key: process.env.VITE_AMAP_KEY || '',
  secret: process.env.VITE_AMAP_SECRET || '',
};

/**
 * 测试 Web 服务 API（POI 搜索）
 */
async function testPOISearch(): Promise<boolean> {
  console.log('🔄 正在测试 POI 搜索...');

  try {
    const response = await axios.get('https://restapi.amap.com/v3/place/text', {
      params: {
        key: config.key,
        keywords: '故宫',
        city: '北京',
        output: 'json',
      },
    });

    if (response.data.status === '1' && response.data.pois && response.data.pois.length > 0) {
      console.log('✅ POI 搜索成功！');
      console.log(`📊 找到 ${response.data.pois.length} 个结果`);
      console.log('📍 第一个结果:');
      console.log(`   名称: ${response.data.pois[0].name}`);
      console.log(`   地址: ${response.data.pois[0].address}`);
      console.log(`   坐标: ${response.data.pois[0].location}`);
      return true;
    } else {
      console.error('❌ POI 搜索失败:', response.data);
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ API 请求失败:', error.response?.data || error.message);
    } else {
      console.error('❌ 未知错误:', error);
    }
    return false;
  }
}

/**
 * 测试地理编码（地址转坐标）
 */
async function testGeocode(): Promise<boolean> {
  console.log('\n🔄 正在测试地理编码...');

  try {
    const response = await axios.get('https://restapi.amap.com/v3/geocode/geo', {
      params: {
        key: config.key,
        address: '北京市朝阳区阜通东大街6号',
        output: 'json',
      },
    });

    if (response.data.status === '1' && response.data.geocodes && response.data.geocodes.length > 0) {
      console.log('✅ 地理编码成功！');
      console.log(`📍 坐标: ${response.data.geocodes[0].location}`);
      console.log(`🏙️  城市: ${response.data.geocodes[0].city}`);
      return true;
    } else {
      console.error('❌ 地理编码失败:', response.data);
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ API 请求失败:', error.response?.data || error.message);
    } else {
      console.error('❌ 未知错误:', error);
    }
    return false;
  }
}

/**
 * 测试路径规划
 */
async function testDriving(): Promise<boolean> {
  console.log('\n🔄 正在测试路径规划...');

  try {
    const response = await axios.get('https://restapi.amap.com/v3/direction/driving', {
      params: {
        key: config.key,
        origin: '116.397428,39.90923', // 天安门
        destination: '116.2317,39.9065', // 颐和园
        output: 'json',
      },
    });

    if (response.data.status === '1' && response.data.route && response.data.route.paths) {
      const path = response.data.route.paths[0];
      console.log('✅ 路径规划成功！');
      console.log(`📏 距离: ${(path.distance / 1000).toFixed(2)} 公里`);
      console.log(`⏱️  预计时间: ${Math.round(path.duration / 60)} 分钟`);
      return true;
    } else {
      console.error('❌ 路径规划失败:', response.data);
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ API 请求失败:', error.response?.data || error.message);
    } else {
      console.error('❌ 未知错误:', error);
    }
    return false;
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('\n🚀 开始测试高德地图 API...\n');

  // 1. 检查配置
  console.log('📋 配置检查:');
  console.log(`   API Key: ${config.key ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   API Secret: ${config.secret ? '✅ 已配置' : '❌ 未配置'}`);
  console.log();

  if (!config.key) {
    console.error('❌ 测试失败：API Key 未配置！');
    console.log('\n请在 frontend/.env 文件中配置以下环境变量：');
    console.log('   VITE_AMAP_KEY=你的API_KEY');
    console.log('   VITE_AMAP_SECRET=你的安全密钥\n');
    process.exit(1);
  }

  const results: boolean[] = [];

  // 2. 测试 POI 搜索
  results.push(await testPOISearch());

  // 3. 测试地理编码
  results.push(await testGeocode());

  // 4. 测试路径规划
  results.push(await testDriving());

  // 5. 输出测试结果
  console.log('\n' + '='.repeat(50));
  const successCount = results.filter((r) => r).length;
  const totalCount = results.length;

  if (successCount === totalCount) {
    console.log('🎉 所有测试通过！高德地图 API 配置正确！');
    console.log('\n📝 下一步：');
    console.log('   1. 启动开发服务器: npm run dev');
    console.log('   2. 访问地图测试页面: http://localhost:5173/map-test');
    console.log('   3. 测试地图显示、POI 搜索和路径规划功能\n');
    process.exit(0);
  } else {
    console.log(`❌ 测试失败！通过 ${successCount}/${totalCount} 项测试`);
    console.log('\n💡 故障排除：');
    console.log('   1. 确认高德开放平台控制台中 API Key 是否正确');
    console.log('   2. 检查网络连接是否正常');
    console.log('   3. 确认 API 服务是否已开通（Web 服务 API）');
    console.log('   4. 检查是否设置了白名单限制\n');
    process.exit(1);
  }
}

// 运行测试
main().catch((error) => {
  console.error('❌ 测试过程中发生错误:', error);
  process.exit(1);
});
