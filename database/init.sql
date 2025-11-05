-- ============================================
-- AI 旅行规划师 - 数据库初始化脚本
-- ============================================

-- 1. 创建用户扩展表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(100),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建旅行计划表
CREATE TABLE IF NOT EXISTS trips (
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
CREATE TABLE IF NOT EXISTS itinerary_items (
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
CREATE TABLE IF NOT EXISTS expenses (
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
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_user_status ON trips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_trip_day_order ON itinerary_items(trip_id, day, order_index);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_date ON expenses(trip_id, expense_date);

-- 8. 启用行级安全
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 9. 创建 RLS 策略 - user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 10. 创建 RLS 策略 - trips
DROP POLICY IF EXISTS "Users can view own trips" ON trips;
CREATE POLICY "Users can view own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trips" ON trips;
CREATE POLICY "Users can insert own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trips" ON trips;
CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trips" ON trips;
CREATE POLICY "Users can delete own trips" ON trips
  FOR DELETE USING (auth.uid() = user_id);

-- 11. 创建 RLS 策略 - itinerary_items
DROP POLICY IF EXISTS "Users can view own itinerary items" ON itinerary_items;
CREATE POLICY "Users can view own itinerary items" ON itinerary_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own itinerary items" ON itinerary_items;
CREATE POLICY "Users can insert own itinerary items" ON itinerary_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own itinerary items" ON itinerary_items;
CREATE POLICY "Users can update own itinerary items" ON itinerary_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own itinerary items" ON itinerary_items;
CREATE POLICY "Users can delete own itinerary items" ON itinerary_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- 12. 创建 RLS 策略 - expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- 完成！
