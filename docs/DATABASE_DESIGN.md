# 数据库设计文档

## 文档信息

- **项目名称**: AI 旅行规划师
- **数据库类型**: PostgreSQL (Supabase)
- **版本**: v1.0
- **最后更新**: 2025-01-XX

---

## 1. 数据库架构概览

### 1.1 核心表

| 表名 | 说明 | 优先级 |
|------|------|--------|
| auth.users | 用户认证表（Supabase 内置） | P0 |
| user_profiles | 用户扩展信息表 | P0 |
| trips | 旅行计划表 | P0 |
| itinerary_items | 行程项表 | P0 |
| expenses | 费用记录表 | P1 |

### 1.2 ER 图

```
┌─────────────┐
│  auth.users │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────┐
│  user_profiles  │
└─────────────────┘

┌─────────────┐       ┌──────────────────┐
│  auth.users │───┐   │  itinerary_items │
└─────────────┘   │   └────────┬─────────┘
                  │ 1         N│
                  │            │
                  │ N    1 ┌───┴────┐
                  └────────│ trips  │
                           └───┬────┘
                             1 │
                               │
                               │ N
                        ┌──────┴────────┐
                        │   expenses    │
                        └───────────────┘
```

---

## 2. 表结构详细设计

### 2.1 用户扩展信息表 (user_profiles)

**表名**: `user_profiles`

**说明**: 存储用户的个人信息和偏好设置

**字段定义**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK, FK → auth.users(id) | 用户 ID |
| username | VARCHAR(100) | NULLABLE | 用户昵称 |
| avatar_url | TEXT | NULLABLE | 头像 URL |
| preferences | JSONB | DEFAULT '{}' | 旅行偏好 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**SQL 创建语句**:

```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(100),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
```

**preferences JSONB 示例**:

```json
{
  "favorite_destinations": ["日本", "法国", "新西兰"],
  "travel_style": ["文化", "美食", "摄影"],
  "budget_preference": "舒适型",
  "accommodation_type": ["酒店", "民宿"],
  "diet_restrictions": ["素食"]
}
```

---

### 2.2 旅行计划表 (trips)

**表名**: `trips`

**说明**: 存储用户创建的旅行计划主表

**字段定义**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 行程 ID |
| user_id | UUID | NOT NULL, FK → auth.users(id) | 用户 ID |
| title | VARCHAR(255) | NOT NULL | 行程标题 |
| destination | VARCHAR(255) | NOT NULL | 目的地 |
| start_date | DATE | NOT NULL | 出发日期 |
| end_date | DATE | NOT NULL | 返程日期 |
| budget | DECIMAL(10, 2) | NOT NULL | 总预算 |
| travelers_count | INT | NOT NULL, DEFAULT 1 | 同行人数 |
| travelers_type | JSONB | DEFAULT '[]' | 人员构成 |
| preferences | JSONB | DEFAULT '[]' | 旅行偏好 |
| accommodation_preference | VARCHAR(50) | | 住宿偏好 |
| pace | VARCHAR(50) | | 行程节奏 |
| special_needs | TEXT | | 特殊需求 |
| status | VARCHAR(50) | DEFAULT 'draft' | 状态 |
| cover_image | TEXT | | 封面图 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**SQL 创建语句**:

```sql
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

-- 创建触发器
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_start_date ON trips(start_date);
CREATE INDEX idx_trips_destination ON trips(destination);

-- 复合索引：用户 + 状态
CREATE INDEX idx_trips_user_status ON trips(user_id, status);
```

**字段说明**:

- **status 枚举值**:
  - `draft`: 草稿
  - `generated`: 已生成
  - `in_progress`: 进行中
  - `completed`: 已完成
  - `archived`: 已归档

- **travelers_type 示例**: `["成人:2", "儿童:1"]`
- **preferences 示例**: `["美食", "文化", "摄影"]`

---

### 2.3 行程项表 (itinerary_items)

**表名**: `itinerary_items`

**说明**: 存储行程的每一个具体项（景点、餐厅、酒店、交通）

**字段定义**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 行程项 ID |
| trip_id | UUID | NOT NULL, FK → trips(id) | 所属行程 |
| day | INT | NOT NULL | 第几天 |
| time | TIME | | 时间 |
| type | VARCHAR(50) | NOT NULL | 类型 |
| title | VARCHAR(255) | NOT NULL | 标题 |
| description | TEXT | | 描述 |
| location | JSONB | | 位置信息 |
| cost | DECIMAL(10, 2) | DEFAULT 0 | 费用 |
| duration | VARCHAR(50) | | 时长 |
| image_url | TEXT | | 图片 URL |
| tips | TEXT | | 游玩建议 |
| order_index | INT | NOT NULL | 排序索引 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**SQL 创建语句**:

```sql
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

-- 创建索引
CREATE INDEX idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX idx_itinerary_items_day ON itinerary_items(day);
CREATE INDEX idx_itinerary_items_type ON itinerary_items(type);

-- 复合索引：行程 + 天数 + 顺序
CREATE INDEX idx_itinerary_items_trip_day_order ON itinerary_items(trip_id, day, order_index);
```

**字段说明**:

- **type 枚举值**:
  - `attraction`: 景点
  - `restaurant`: 餐厅
  - `hotel`: 酒店
  - `transport`: 交通
  - `activity`: 活动
  - `other`: 其他

- **location JSONB 结构**:

```json
{
  "address": "北京市东城区景山前街4号",
  "lat": 39.9163,
  "lng": 116.3972,
  "poi_id": "B000A8URXQ",
  "city": "北京市",
  "district": "东城区"
}
```

---

### 2.4 费用记录表 (expenses)

**表名**: `expenses`

**说明**: 记录旅行中的实际开销

**字段定义**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 费用 ID |
| trip_id | UUID | NOT NULL, FK → trips(id) | 所属行程 |
| category | VARCHAR(50) | NOT NULL | 费用类别 |
| amount | DECIMAL(10, 2) | NOT NULL | 金额 |
| description | TEXT | | 描述 |
| expense_date | DATE | NOT NULL | 消费日期 |
| payment_method | VARCHAR(50) | | 支付方式 |
| receipt_url | TEXT | | 票据照片 URL |
| notes | TEXT | | 备注 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**SQL 创建语句**:

```sql
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

-- 创建索引
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- 复合索引：行程 + 日期
CREATE INDEX idx_expenses_trip_date ON expenses(trip_id, expense_date);
```

**字段说明**:

- **category 枚举值**:
  - `transportation`: 交通
  - `accommodation`: 住宿
  - `food`: 餐饮
  - `ticket`: 门票
  - `shopping`: 购物
  - `entertainment`: 娱乐
  - `other`: 其他

---

## 3. 行级安全策略 (RLS)

### 3.1 启用 RLS

```sql
-- 启用所有表的行级安全
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
```

### 3.2 user_profiles 策略

```sql
-- 用户只能查看和编辑自己的信息
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 3.3 trips 策略

```sql
-- 用户只能访问自己的行程
CREATE POLICY "Users can view own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON trips
  FOR DELETE USING (auth.uid() = user_id);
```

### 3.4 itinerary_items 策略

```sql
-- 通过 trip_id 关联验证权限
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
```

### 3.5 expenses 策略

```sql
-- 同样通过 trip_id 验证
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

---

## 4. 常用查询示例

### 4.1 获取用户的所有行程

```sql
SELECT 
  id,
  title,
  destination,
  start_date,
  end_date,
  budget,
  status,
  created_at
FROM trips
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### 4.2 获取行程详情（包含所有行程项）

```sql
SELECT 
  t.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', i.id,
        'day', i.day,
        'time', i.time,
        'type', i.type,
        'title', i.title,
        'description', i.description,
        'location', i.location,
        'cost', i.cost
      ) ORDER BY i.day, i.order_index
    ) FILTER (WHERE i.id IS NOT NULL),
    '[]'
  ) AS itinerary_items
FROM trips t
LEFT JOIN itinerary_items i ON i.trip_id = t.id
WHERE t.id = $1 AND t.user_id = auth.uid()
GROUP BY t.id;
```

### 4.3 统计行程总费用

```sql
SELECT 
  trip_id,
  SUM(amount) AS total_spent,
  COUNT(*) AS expense_count,
  json_object_agg(category, category_total) AS breakdown
FROM (
  SELECT 
    trip_id,
    category,
    SUM(amount) AS category_total
  FROM expenses
  WHERE trip_id = $1
  GROUP BY trip_id, category
) AS category_totals
GROUP BY trip_id;
```

### 4.4 获取某天的行程

```sql
SELECT *
FROM itinerary_items
WHERE trip_id = $1 AND day = $2
ORDER BY order_index;
```

---

## 5. 性能优化建议

### 5.1 索引策略

已创建的索引：
- ✅ 用户 ID 索引（所有表）
- ✅ 状态索引（trips）
- ✅ 日期索引（trips, expenses）
- ✅ 复合索引（trip_id + day + order_index）

### 5.2 查询优化

1. **使用连接池**: Supabase 自动处理
2. **分页查询**: 使用 `LIMIT` 和 `OFFSET`
3. **避免 N+1 查询**: 使用 JOIN 或 json_agg
4. **使用 EXPLAIN ANALYZE** 分析慢查询

### 5.3 数据归档

对于已完成的行程，考虑定期归档：

```sql
-- 将6个月前完成的行程归档
UPDATE trips
SET status = 'archived'
WHERE status = 'completed'
AND end_date < NOW() - INTERVAL '6 months';
```

---

## 6. 备份与恢复

### 6.1 Supabase 自动备份

Supabase 提供：
- 每日自动备份（保留 7 天）
- 付费版可延长备份保留时间

### 6.2 手动备份

```bash
# 使用 pg_dump 导出
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# 恢复
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

---

## 7. 数据迁移脚本

### 7.1 初始化脚本

将所有表创建语句整合到一个文件：

```sql
-- filepath: f:\graduate\AITravelPlanner\supabase\migrations\001_initial_schema.sql

-- 创建用户扩展表
-- ...existing code...

-- 创建行程表
-- ...existing code...

-- 创建行程项表
-- ...existing code...

-- 创建费用表
-- ...existing code...

-- 启用 RLS
-- ...existing code...

-- 创建策略
-- ...existing code...
```

### 7.2 版本管理

使用 Supabase CLI 管理迁移：

```bash
# 创建新迁移
supabase migration new add_column_to_trips

# 应用迁移
supabase db push

# 回滚
supabase db reset
```

---

## 8. 附录

### 8.1 表大小估算

假设 10,000 活跃用户，平均每人 5 个行程：

| 表名 | 行数估算 | 单行大小 | 总大小 |
|------|---------|---------|--------|
| user_profiles | 10,000 | 1 KB | 10 MB |
| trips | 50,000 | 2 KB | 100 MB |
| itinerary_items | 500,000 | 1 KB | 500 MB |
| expenses | 200,000 | 0.5 KB | 100 MB |
| **总计** | | | **~710 MB** |

### 8.2 参考资料

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Supabase 数据库文档](https://supabase.com/docs/guides/database)
- [RLS 最佳实践](https://supabase.com/docs/guides/auth/row-level-security)

---

**文档版本**: v1.0  
**维护人**: 开发团队  
**最后更新**: 2025-01-XX