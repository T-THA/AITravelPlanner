# Supabase 配置指南

## 文档信息

- **服务**: Supabase (PostgreSQL + Auth)
- **预计时间**: 20-30 分钟
- **最后更新**: 2025-01-XX

---

## 1. 创建 Supabase 项目

### 1.1 注册账号

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project"
3. 使用 GitHub 账号登录（推荐）

### 1.2 创建项目

1. 点击 "New Project"
2. 填写项目信息：
   - **Name**: `ai-travel-planner`
   - **Database Password**: 生成强密码并保存
   - **Region**: 选择最近的区域（如 `Northeast Asia (Tokyo)`）
   - **Pricing Plan**: Free（开发测试用）

3. 点击 "Create new project"
4. 等待 2-3 分钟完成初始化

---

## 2. 获取 API 凭证

### 2.1 项目设置

1. 进入项目后，点击左侧 "Settings" → "API"
2. 找到以下信息并复制：

```
Project URL: https://xxx.supabase.co
anon (public) key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 更新环境变量

将凭证添加到 `.env.local`:

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

⚠️ **注意**: `service_role key` 仅在后端使用，不要暴露在前端！

---

## 3. 配置数据库

### 3.1 运行 SQL 脚本

1. 点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制粘贴以下完整脚本：

```sql
-- ============================================
-- AI 旅行规划师 - 数据库初始化脚本
-- ============================================

-- 1. 创建用户扩展表
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(100),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建旅行计划表
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(10, 2) NOT NULL CHECK (budget > 0),
  travelers_count INT NOT NULL DEFAULT 1 CHECK (travelers_count > 0),
  travelers_type JSONB DEFAULT '[]'::jsonb,
  preferences JSONB DEFAULT '[]'::jsonb,
  accommodation_preference VARCHAR(50),
  pace VARCHAR(50),
  special_needs TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'in_progress', 'completed', 'archived')),
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建行程项表
CREATE TABLE itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day INT NOT NULL CHECK (day > 0),
  time TIME,
  type VARCHAR(50) NOT NULL CHECK (type IN ('attraction', 'restaurant', 'hotel', 'transport', 'activity', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location JSONB,
  cost DECIMAL(10, 2) DEFAULT 0 CHECK (cost >= 0),
  duration VARCHAR(50),
  image_url TEXT,
  tips TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建费用记录表
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('transportation', 'accommodation', 'food', 'ticket', 'shopping', 'entertainment', 'other')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  expense_date DATE NOT NULL,
  payment_method VARCHAR(50),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 为表添加触发器
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 创建索引
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_start_date ON trips(start_date);
CREATE INDEX idx_trips_user_status ON trips(user_id, status);
CREATE INDEX idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX idx_itinerary_items_trip_day_order ON itinerary_items(trip_id, day, order_index);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_trip_date ON expenses(trip_id, expense_date);

-- 8. 启用行级安全
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 9. 创建 RLS 策略 - user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 10. 创建 RLS 策略 - trips
CREATE POLICY "Users can view own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON trips
  FOR DELETE USING (auth.uid() = user_id);

-- 11. 创建 RLS 策略 - itinerary_items
CREATE POLICY "Users can view own itinerary items" ON itinerary_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own itinerary items" ON itinerary_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own itinerary items" ON itinerary_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own itinerary items" ON itinerary_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- 12. 创建 RLS 策略 - expenses
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );
```

4. 点击 "Run" 执行脚本
5. 确认所有语句执行成功（显示绿色勾号）

### 3.2 验证数据库

点击左侧 "Table Editor"，确认看到以下表：
- ✅ user_profiles
- ✅ trips
- ✅ itinerary_items
- ✅ expenses

---

## 4. 配置认证

### 4.1 邮箱认证设置

1. 点击 "Authentication" → "Providers"
2. 确认 "Email" 已启用
3. 配置邮件模板：

#### 确认邮件模板

进入 "Email Templates" → "Confirm signup"：

```html
<h2>确认您的邮箱</h2>
<p>点击下面的链接完成注册：</p>
<p><a href="{{ .ConfirmationURL }}">确认邮箱</a></p>
```

#### 密码重置模板

"Reset Password"：

```html
<h2>重置密码</h2>
<p>点击下面的链接重置密码：</p>
<p><a href="{{ .ConfirmationURL }}">重置密码</a></p>
```

### 4.2 URL 配置

在 "Authentication" → "URL Configuration":

- **Site URL**: `http://localhost:5173` (开发环境)
- **Redirect URLs**: 添加 `http://localhost:5173/**`

生产环境时更新为实际域名。

---

## 5. 存储配置（可选）

### 5.1 创建 Storage Bucket

1. 点击 "Storage"
2. 点击 "Create a new bucket"
3. 配置：
   - **Name**: `avatars`
   - **Public**: 启用
   - **File size limit**: 2 MB
   - **Allowed MIME types**: `image/*`

4. 重复创建 `receipts` bucket（用于票据照片）

### 5.2 设置存储策略

在 Bucket 的 "Policies" 中添加：

```sql
-- 用户可以上传自己的头像
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 用户可以查看所有头像（公开）
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

---

## 6. 项目集成

### 6.1 安装 Supabase 客户端

```bash
npm install @supabase/supabase-js
```

### 6.2 创建 Supabase 客户端

创建 `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 类型定义
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          preferences: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          preferences?: Record<string, any>
        }
        Update: {
          username?: string | null
          avatar_url?: string | null
          preferences?: Record<string, any>
        }
      }
      // ...其他表的类型定义
    }
  }
}
```

### 6.3 测试连接

创建 `src/services/auth.ts`:

```typescript
import { supabase } from '@/lib/supabase'

export const authService = {
  // 注册
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // 登录
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // 登出
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // 获取当前用户
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },
}
```

---

## 7. 测试验证

### 7.1 测试注册

在浏览器控制台运行：

```javascript
await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Test123456!',
})
```

检查邮箱是否收到确认邮件。

### 7.2 测试数据插入

```javascript
const { data, error } = await supabase
  .from('user_profiles')
  .insert({ id: user.id, username: 'testuser' })

console.log(data, error)
```

### 7.3 测试 RLS

尝试访问其他用户的数据（应该失败）：

```javascript
const { data } = await supabase
  .from('trips')
  .select('*')
  .eq('user_id', 'other-user-id')

console.log(data) // 应该返回空数组
```

---

## 8. 常见问题

### 8.1 RLS 策略不生效

```sql
-- 检查 RLS 是否启用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 查看现有策略
SELECT * FROM pg_policies;
```

### 8.2 连接超时

检查网络和区域设置，考虑更换更近的 Region。

### 8.3 邮件未收到

1. 检查垃圾邮件文件夹
2. 在 Supabase 控制台查看 "Authentication" → "Users" 确认用户状态
3. 开发环境可以使用 "Auto Confirm" 跳过邮箱验证

---

## 9. 生产环境配置

### 9.1 升级到付费版（可选）

根据需求考虑升级：
- **Pro Plan** ($25/月): 更大数据库、更多 API 请求
- **Team Plan** ($599/月): 团队协作、优先支持

### 9.2 性能优化

1. **启用 Supabase Cache**
2. **配置 Connection Pooling**
3. **优化查询（使用 EXPLAIN ANALYZE）**

### 9.3 监控设置

在 "Settings" → "Monitoring" 启用：
- 数据库性能监控
- API 请求日志
- 错误追踪

---

## 10. 下一步

Supabase 配置完成后，继续：

1. [API 配置指南](./API_SETUP.md) - 配置其他第三方服务
2. [开发环境搭建](./SETUP_GUIDE.md) - 完成前端配置
3. [数据库设计文档](./DATABASE_DESIGN.md) - 深入了解数据结构

---

**文档版本**: v1.0  
**维护人**: 开发团队  
**最后更新**: 2025-01-XX
