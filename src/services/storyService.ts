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

    console.log('[fetchStoryById] ====== 从数据库加载故事 ======');
    console.log('[fetchStoryById] story ID:', storyId);
    console.log('[fetchStoryById] 加载的页面数量:', pages?.length || 0);
    console.log('[fetchStoryById] ⚠️ 注意：从数据库加载时，question 字段会丢失（数据库中没有此字段）');
    
    const storyPages: StoryPage[] = (pages || []).map((page) => {
      const storyPage: StoryPage = {
        id: page.id,
        background: page.background_url,
        text: page.text,
        interactiveElements: [], // 暂时为空
        question: undefined // 暂时为空 - ⚠️ 数据库中没有保存 question 字段
      };
      console.log(`[fetchStoryById] 页面 ${page.page_number} 数据:`, storyPage);
      return storyPage;
    });

    const result = storyRowToStorybook(story, storyPages);
    console.log('[fetchStoryById] ====== 加载完成 ======');
    console.log('[fetchStoryById] 返回的故事对象:', result);
    console.log('[fetchStoryById] 返回的故事对象 pages[0].question:', result.pages?.[0]?.question);
    console.log('[fetchStoryById] ⚠️ 警告：question 字段为 undefined，因为数据库中没有保存');
    return result;
  } catch (error) {
    console.error('Error fetching story:', error);
    throw error;
  }
}

// 保存故事到数据库
export async function saveStory(story: Storybook, userId: string): Promise<Storybook> {
  try {
    console.log('[saveStory] ====== 开始保存故事到数据库 ======');
    console.log('[saveStory] story 对象:', story);
    console.log('[saveStory] story.pages 数量:', story.pages?.length || 0);
    console.log('[saveStory] story.pages[0]:', story.pages?.[0]);
    console.log('[saveStory] story.pages[0].question:', story.pages?.[0]?.question);
    console.log('[saveStory] story.pages[0].question (JSON):', JSON.stringify(story.pages?.[0]?.question, null, 2));
    
    // 保存故事基本信息
    const storyRow = storybookToStoryRow(story, userId);
    const { data: savedStory, error: storyError } = await supabase
      .from('stories')
      .insert(storyRow)
      .select()
      .single();

    if (storyError) {
      console.error('[saveStory] 保存故事基本信息失败:', storyError);
      throw storyError;
    }
    console.log('[saveStory] 故事基本信息保存成功，ID:', savedStory.id);

    // 保存页面
    if (story.pages && story.pages.length > 0) {
      console.log('[saveStory] ====== 开始保存页面 ======');
      console.log('[saveStory] 准备保存的页面数量:', story.pages.length);
      
      const pageRows = story.pages.map((page, index) => {
        const pageRow = {
          story_id: savedStory.id,
          background_url: page.background,
          text: page.text,
          page_number: index + 1
        };
        console.log(`[saveStory] 页面 ${index + 1} 数据:`, pageRow);
        console.log(`[saveStory] 页面 ${index + 1} 原始 question:`, page.question);
        console.log(`[saveStory] 页面 ${index + 1} question (JSON):`, JSON.stringify(page.question, null, 2));
        // ⚠️ 注意：question 字段目前没有保存到数据库（数据库 schema 中没有此字段）
        // 这会导致从数据库加载时 question 丢失
        return pageRow;
      });

      console.log('[saveStory] 所有页面数据 (JSON):', JSON.stringify(pageRows, null, 2));
      console.log('[saveStory] ⚠️ 警告：question 字段未保存到数据库！');

      const { error: pagesError } = await supabase
        .from('story_pages')
        .insert(pageRows);

      if (pagesError) {
        console.error('[saveStory] 保存页面失败:', pagesError);
        throw pagesError;
      }
      console.log('[saveStory] 所有页面保存成功');
    }

    // 返回完整的故事对象（包含 question，因为数据库没有保存）
    const result = {
      ...story,
      id: savedStory.id
    };
    console.log('[saveStory] ====== 保存完成 ======');
    console.log('[saveStory] 返回的故事对象:', result);
    console.log('[saveStory] 返回的故事对象 pages[0].question:', result.pages?.[0]?.question);
    console.log('[saveStory] 返回的故事对象 pages[0].question (JSON):', JSON.stringify(result.pages?.[0]?.question, null, 2));
    return result;
  } catch (error) {
    console.error('[saveStory] 保存故事失败:', error);
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

