import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// 从环境变量加载配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 错误: Supabase 环境变量未配置');
  console.log('请检查 .env 文件中的以下变量:');
  console.log('  - VITE_SUPABASE_URL');
  console.log('  - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

/**
 * 测试 Supabase 连接和基本功能
 */
async function testSupabaseConnection() {
  console.log('🔍 开始测试 Supabase 连接...\n');

  try {
    // 1. 测试连接
    console.log('1️⃣ 测试基本连接...');
    console.log('   URL:', supabaseUrl);
    console.log('   Key:', supabaseAnonKey.substring(0, 20) + '...');
    console.log('✅ 配置已加载!\n');

    // 2. 测试会话
    console.log('2️⃣ 测试会话状态...');
    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      console.log('✅ 已登录:', session.session.user.email);
    } else {
      console.log('ℹ️  未登录（这是正常的）');
    }
    console.log();

    // 3. 检查数据库表
    console.log('3️⃣ 检查数据库表结构...');
    
    const tables = ['user_profiles', 'trips', 'itinerary_items', 'expenses'];
    const tableStatus = [];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === 'PGRST116') {
          tableStatus.push({ table, status: '❌ 未创建' });
        } else {
          tableStatus.push({ table, status: '⚠️  ' + error.message });
        }
      } else {
        tableStatus.push({ table, status: '✅ 存在' });
      }
    }

    console.table(tableStatus);
    console.log();

    // 4. 测试总结
    const allTablesExist = tableStatus.every(t => t.status.includes('✅'));
    
    if (allTablesExist) {
      console.log('✅ 所有测试通过! Supabase 配置正确。');
      return true;
    } else {
      console.log('⚠️  数据库表未完全创建。请运行初始化 SQL 脚本:');
      console.log('   1. 访问 Supabase Dashboard: https://supabase.com/dashboard');
      console.log('   2. 选择你的项目');
      console.log('   3. 进入 SQL Editor');
      console.log('   4. 复制并运行 database/init.sql 中的脚本');
      console.log('   5. 再次运行此测试: npm run test:supabase');
      return false;
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    return false;
  }
}

/**
 * 测试用户注册功能
 */
async function testUserRegistration() {
  console.log('\n📝 测试用户注册功能...\n');

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Test123456!';

  try {
    // 注册测试用户
    console.log(`尝试注册测试用户: ${testEmail}`);
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.log('❌ 注册失败:', error.message);
      return false;
    }

    if (data.user) {
      console.log('✅ 注册成功!');
      console.log('   用户 ID:', data.user.id);
      console.log('   邮箱:', data.user.email);
      console.log('   ℹ️  请检查邮箱验证邮件');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    return false;
  }
}

// 运行测试
(async () => {
  console.log('🚀 AI 旅行规划师 - Supabase 配置测试\n');
  console.log('='.repeat(50));
  console.log();

  const connectionTest = await testSupabaseConnection();
  
  if (connectionTest) {
    await testUserRegistration();
  }

  console.log();
  console.log('='.repeat(50));
  console.log('\n✨ 测试完成!\n');
})();
