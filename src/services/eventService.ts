import { supabase } from './supabaseClient';

export type EventType = 
  | 'story_view'           // 查看故事
  | 'story_start'          // 开始阅读故事
  | 'story_complete'       // 完成故事
  | 'page_view'            // 查看页面
  | 'page_enter'           // 进入页面（记录进入时间）
  | 'page_leave'           // 离开页面（计算停留时间）
  | 'page_turn'            // 翻页
  | 'interactive_click'    // 点击交互元素
  | 'interaction_hover'    // 交互元素悬停（探索意图）
  | 'vocabulary_learn'     // 词汇学习（打开单词卡片）
  | 'question_answer'      // 回答问题
  | 'story_generate'       // 生成故事
  | 'story_save'           // 保存故事
  | 'story_delete'         // 删除故事
  | 'audio_play'           // 音频播放
  | 'audio_pause'          // 音频暂停
  | 'audio_seek'           // 音频跳转
  | 'generation_mode_select' // 生成模式选择
  | 'story_abandon';        // 故事中途放弃

export interface UserEventMetadata {
  story_id?: string;
  page_id?: string;
  page_number?: number;
  element_id?: string;
  question_id?: string;
  answer_id?: string;
  answer_correct?: boolean;
  [key: string]: any; // 允许其他自定义字段
}

// 记录用户事件
export async function logUserEvent(
  userId: string,
  eventType: EventType,
  metadata: UserEventMetadata = {}
): Promise<void> {
  try {
    // 仅当 story_id 是有效 UUID 时才写入该字段，否则置空以避免 22P02 错误
    const isUuid = (value: unknown): value is string =>
      typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    const row: any = {
      user_id: userId,
      event_type: eventType,
      metadata,
    };

    if (isUuid(metadata.story_id)) {
      row.story_id = metadata.story_id;
    }

    const { error } = await supabase
      .from('user_events')
      .insert(row);

    if (error) {
      console.error('Error logging user event:', error);
      // 不抛出错误，避免影响用户体验
    }
  } catch (error) {
    console.error('Error logging user event:', error);
    // 静默失败，不影响主流程
  }
}

// 批量记录用户事件（用于性能优化）
export async function logUserEvents(
  userId: string,
  events: Array<{ eventType: EventType; metadata: UserEventMetadata }>
): Promise<void> {
  try {
    const eventRows = events.map(({ eventType, metadata }) => ({
      user_id: userId,
      event_type: eventType,
      story_id: metadata.story_id,
      metadata: metadata
    }));

    const { error } = await supabase
      .from('user_events')
      .insert(eventRows);

    if (error) {
      console.error('Error logging user events:', error);
    }
  } catch (error) {
    console.error('Error logging user events:', error);
  }
}

// 页面时间追踪工具类
export class PageTimeTracker {
  private pageEnterTimes: Map<string, number> = new Map();
  private questionDisplayTimes: Map<string, number> = new Map();
  
  enterPage(pageId: string): number {
    const enterTime = Date.now();
    this.pageEnterTimes.set(pageId, enterTime);
    return enterTime;
  }
  
  leavePage(pageId: string): { enterTime: number; duration: number } | null {
    const enterTime = this.pageEnterTimes.get(pageId);
    if (!enterTime) return null;
    
    const leaveTime = Date.now();
    const duration = leaveTime - enterTime;
    this.pageEnterTimes.delete(pageId);
    
    return { enterTime, duration };
  }
  
  getTimeOnPage(pageId: string): number | null {
    const enterTime = this.pageEnterTimes.get(pageId);
    if (!enterTime) return null;
    return Date.now() - enterTime;
  }
  
  recordQuestionDisplay(pageId: string): void {
    this.questionDisplayTimes.set(pageId, Date.now());
  }
  
  getQuestionDisplayTime(pageId: string): number | null {
    return this.questionDisplayTimes.get(pageId) || null;
  }
  
  clearPage(pageId: string): void {
    this.pageEnterTimes.delete(pageId);
    this.questionDisplayTimes.delete(pageId);
  }
}

// 导出单例
export const pageTimeTracker = new PageTimeTracker();

