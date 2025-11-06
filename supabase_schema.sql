-- Supabase 数据库表结构
-- 在 Supabase Dashboard > SQL Editor 中执行此脚本

-- 创建 stories 表
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  cover_url TEXT,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 创建 story_pages 表
CREATE TABLE IF NOT EXISTS story_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  background_url TEXT,
  text TEXT NOT NULL,
  page_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 user_events 表
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_pages_story_id ON story_pages(story_id);
CREATE INDEX IF NOT EXISTS idx_story_pages_page_number ON story_pages(story_id, page_number);
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_story_id ON user_events(story_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户可以查看自己的故事
CREATE POLICY "Users can view their own stories"
  ON stories FOR SELECT
  USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户可以创建自己的故事
CREATE POLICY "Users can create their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略：用户可以更新自己的故事
CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户可以删除自己的故事
CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户可以查看自己故事的页面
CREATE POLICY "Users can view pages of their own stories"
  ON story_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_pages.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- 创建 RLS 策略：用户可以创建自己故事的页面
CREATE POLICY "Users can create pages for their own stories"
  ON story_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_pages.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- 创建 RLS 策略：用户可以更新自己故事的页面
CREATE POLICY "Users can update pages of their own stories"
  ON story_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_pages.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- 创建 RLS 策略：用户可以删除自己故事的页面
CREATE POLICY "Users can delete pages of their own stories"
  ON story_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_pages.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- 创建 RLS 策略：用户可以查看自己的事件
CREATE POLICY "Users can view their own events"
  ON user_events FOR SELECT
  USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户可以创建自己的事件
CREATE POLICY "Users can create their own events"
  ON user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

