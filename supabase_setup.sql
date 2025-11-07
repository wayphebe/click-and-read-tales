-- ============================================
-- Supabase Items 表创建 SQL
-- ============================================
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- 路径: https://app.supabase.com/project/[your-project]/sql/new

-- 1. 创建 items 表
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

-- 3. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器，自动更新 updated_at 字段
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 启用 Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 6. 创建策略：允许所有人读取（开发阶段）
CREATE POLICY "Allow public read access" 
  ON items 
  FOR SELECT 
  USING (true);

-- 7. 创建策略：允许所有人插入（开发阶段）
CREATE POLICY "Allow public insert" 
  ON items 
  FOR INSERT 
  WITH CHECK (true);

-- 8. 创建策略：允许所有人更新（开发阶段）
CREATE POLICY "Allow public update" 
  ON items 
  FOR UPDATE 
  USING (true);

-- 9. 创建策略：允许所有人删除（开发阶段）
CREATE POLICY "Allow public delete" 
  ON items 
  FOR DELETE 
  USING (true);

-- ============================================
-- 验证查询（可选，用于测试）
-- ============================================
-- SELECT * FROM items ORDER BY created_at DESC;

-- ============================================
-- 清理脚本（如果需要删除表）
-- ============================================
-- DROP TRIGGER IF EXISTS update_items_updated_at ON items;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS items CASCADE;

