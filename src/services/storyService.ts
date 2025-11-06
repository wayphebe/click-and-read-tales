import { supabase } from './supabaseClient';
import type { Storybook, StoryPage } from '../data/storybooksData';

// 数据库表类型定义
export interface StoryRow {
  id: string;
  title: string;
  cover_url: string;
  description: string;
  category: string;
  created_at: string;
  user_id: string;
}

export interface StoryPageRow {
  id: string;
  story_id: string;
  background_url: string;
  text: string;
  page_number?: number;
  created_at: string;
}

// 将数据库行转换为应用类型
function storyRowToStorybook(row: StoryRow, pages: StoryPage[]): Storybook {
  return {
    id: row.id,
    title: row.title,
    cover: row.cover_url,
    category: row.category,
    description: row.description,
    pages: pages
  };
}

// 将应用类型转换为数据库行
function storybookToStoryRow(story: Storybook, userId: string): Omit<StoryRow, 'created_at' | 'id'> {
  return {
    // 让数据库生成 id（UUID）
    title: story.title,
    cover_url: story.cover,
    description: story.description,
    category: story.category,
    user_id: userId
  } as Omit<StoryRow, 'created_at' | 'id'>;
}

// 获取所有故事
export async function fetchAllStories(userId?: string): Promise<Storybook[]> {
  try {
    let query = supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });

    // 如果提供了 userId，只获取该用户的故事
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: stories, error } = await query;

    if (error) throw error;
    if (!stories || stories.length === 0) return [];

    // 为每个故事获取页面
    const storiesWithPages = await Promise.all(
      stories.map(async (story) => {
        const { data: pages, error: pagesError } = await supabase
          .from('story_pages')
          .select('*')
          .eq('story_id', story.id)
          .order('page_number', { ascending: true });

        if (pagesError) throw pagesError;

        // 转换页面数据（注意：interactiveElements 和 question 需要从 metadata 中恢复）
        const storyPages: StoryPage[] = (pages || []).map((page) => ({
          id: page.id,
          background: page.background_url,
          text: page.text,
          interactiveElements: [], // 暂时为空，后续可以从 metadata 恢复
          question: undefined // 暂时为空，后续可以从 metadata 恢复
        }));

        return storyRowToStorybook(story, storyPages);
      })
    );

    return storiesWithPages;
  } catch (error) {
    console.error('Error fetching stories:', error);
    throw error;
  }
}

// 根据 ID 获取单个故事
export async function fetchStoryById(storyId: string): Promise<Storybook | null> {
  try {
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (storyError) {
      if (storyError.code === 'PGRST116') {
        // 未找到记录
        return null;
      }
      throw storyError;
    }

    // 获取页面
    const { data: pages, error: pagesError } = await supabase
      .from('story_pages')
      .select('*')
      .eq('story_id', storyId)
      .order('page_number', { ascending: true });

    if (pagesError) throw pagesError;

    const storyPages: StoryPage[] = (pages || []).map((page) => ({
      id: page.id,
      background: page.background_url,
      text: page.text,
      interactiveElements: [], // 暂时为空
      question: undefined // 暂时为空
    }));

    return storyRowToStorybook(story, storyPages);
  } catch (error) {
    console.error('Error fetching story:', error);
    throw error;
  }
}

// 保存故事到数据库
export async function saveStory(story: Storybook, userId: string): Promise<Storybook> {
  try {
    // 保存故事基本信息
    const storyRow = storybookToStoryRow(story, userId);
    const { data: savedStory, error: storyError } = await supabase
      .from('stories')
      .insert(storyRow)
      .select()
      .single();

    if (storyError) throw storyError;

    // 保存页面
    if (story.pages && story.pages.length > 0) {
      const pageRows = story.pages.map((page, index) => ({
        story_id: savedStory.id,
        background_url: page.background,
        text: page.text,
        page_number: index + 1
      }));

      const { error: pagesError } = await supabase
        .from('story_pages')
        .insert(pageRows);

      if (pagesError) throw pagesError;
    }

    // 返回完整的故事对象
    return {
      ...story,
      id: savedStory.id
    };
  } catch (error) {
    console.error('Error saving story:', error);
    throw error;
  }
}

// 更新故事
export async function updateStory(story: Storybook, userId: string): Promise<Storybook> {
  try {
    const storyRow = storybookToStoryRow(story, userId);
    const { error: storyError } = await supabase
      .from('stories')
      .update({
        title: storyRow.title,
        cover_url: storyRow.cover_url,
        description: storyRow.description,
        category: storyRow.category
      })
      .eq('id', story.id)
      .eq('user_id', userId);

    if (storyError) throw storyError;

    // 删除旧页面
    const { error: deleteError } = await supabase
      .from('story_pages')
      .delete()
      .eq('story_id', story.id);

    if (deleteError) throw deleteError;

    // 插入新页面
    if (story.pages && story.pages.length > 0) {
      const pageRows = story.pages.map((page, index) => ({
        story_id: story.id,
        background_url: page.background,
        text: page.text,
        page_number: index + 1
      }));

      const { error: pagesError } = await supabase
        .from('story_pages')
        .insert(pageRows);

      if (pagesError) throw pagesError;
    }

    return story;
  } catch (error) {
    console.error('Error updating story:', error);
    throw error;
  }
}

// 删除故事
export async function deleteStory(storyId: string, userId: string): Promise<void> {
  try {
    // 先删除页面（外键约束会自动处理，但显式删除更清晰）
    const { error: pagesError } = await supabase
      .from('story_pages')
      .delete()
      .eq('story_id', storyId);

    if (pagesError) throw pagesError;

    // 删除故事
    const { error: storyError } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId)
      .eq('user_id', userId);

    if (storyError) throw storyError;
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
}

