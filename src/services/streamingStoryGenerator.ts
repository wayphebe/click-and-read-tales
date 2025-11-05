import { generateImage } from './imageGeneration';
import { generateStoryPages, generateStoryPageWithChoices } from './aiService';
import type { StoryPrompt } from '@/components/StoryGeneratorDialog';
import type { Storybook, StoryPage, InteractiveElement, StoryQuestion, QuestionOption } from '@/data/storybooksData';

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateStoryId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

const generatePageId = (storyId: string, pageNumber: number): string => {
  return `${storyId}_page_${pageNumber}`;
};

const generateElementId = (pageId: string, elementNumber: number): string => {
  return `${pageId}_element_${elementNumber}`;
};

const getCategory = (theme: string): string => {
  if (!theme) return '冒险';
  if (theme.includes('友情')) return '友情';
  if (theme.includes('勇气')) return '勇气';
  if (theme.includes('家庭')) return '家庭';
  if (theme.includes('创造')) return '创造力';
  if (theme.includes('环境')) return '环保';
  return '冒险';
};

// 流式故事页面接口
export interface StreamingPage extends StoryPage {
  isReady: boolean;
  isGenerating: boolean;
}

// 流式故事接口
export interface StreamingStory extends Omit<Storybook, 'pages'> {
  pages: StreamingPage[];
  isComplete: boolean;
  currentReadyPage: number;
}

// 流式生成回调接口
export interface StreamingCallbacks {
  onPageReady?: (page: StreamingPage, pageIndex: number) => void;
  onProgress?: (progress: { step: string; progress: number; currentPage: number; totalPages: number }) => void;
  onComplete?: () => void;
  onError?: (error: Error, pageIndex: number) => void;
}

// 流式故事生成器类
export class StreamingStoryGenerator {
  private storyId: string;
  private callbacks: StreamingCallbacks;
  private pages: StreamingPage[] = [];
  private isGenerating = false;
  private storyPrompt: StoryPrompt | null = null;
  private currentStory: StreamingStory | null = null;

  constructor(callbacks: StreamingCallbacks = {}) {
    this.storyId = generateStoryId();
    this.callbacks = callbacks;
  }

  async generateStory(prompt: StoryPrompt): Promise<StreamingStory> {
    this.isGenerating = true;
    this.storyPrompt = prompt;
    const { mainCharacter, mood, setting, theme = '', additionalElements = '' } = prompt;

    try {
      // 1. 生成第一页故事内容（带选择项）
      this.callbacks.onProgress?.({
        step: '正在创作第一页故事...',
        progress: 20,
        currentPage: 1,
        totalPages: 5
      });

      const firstPageData = await generateStoryPageWithChoices(
        mainCharacter,
        mood,
        setting || '神奇世界',
        theme ? theme.split(',') : [],
        1,
        [],
        additionalElements
      );

      // 2. 创建基础故事结构
      const title = `${mainCharacter}的${getSettingTranslation(setting)}冒险`;
      const description = generateDescription(mainCharacter, mood, setting, theme, additionalElements);

      // 3. 创建第一页（带选择项）
      const firstPage: StreamingPage = {
        id: generatePageId(this.storyId, 1),
        text: firstPageData.text,
        background: '', // 图片将在后台生成
        interactiveElements: generateBasicElements(mainCharacter),
        isReady: false,
        isGenerating: false,
        question: firstPageData.choices.length > 0 ? {
          id: `question_${this.storyId}_1`,
          question: '接下来会发生什么呢？',
          options: firstPageData.choices.map((choice, index) => ({
            id: `choice_${this.storyId}_1_${index + 1}`,
            text: choice.text,
            emoji: choice.emoji,
            feedback: choice.description
          }))
        } : undefined
      };

      this.pages = [firstPage];

      const baseStory: StreamingStory = {
        id: this.storyId,
        title,
        cover: '', // 封面也采用流式生成
        category: getCategory(theme),
        description,
        isComplete: false,
        currentReadyPage: 0,
        pages: this.pages
      };

      this.currentStory = baseStory;

      this.callbacks.onProgress?.({
        step: '第一页故事内容已准备好，开始生成封面和插图...',
        progress: 40,
        currentPage: 1,
        totalPages: 5
      });

      // 4. 开始流式生成封面和第一页图片
      this.startStreamingGeneration(baseStory);

      return baseStory;
    } catch (error) {
      this.isGenerating = false;
      throw error;
    }
  }

  // 生成下一页（基于用户选择）
  async generateNextPage(userChoice: string, choiceId: string): Promise<StreamingPage | null> {
    if (!this.storyPrompt || !this.currentStory) {
      throw new Error('Story not initialized');
    }

    const { mainCharacter, mood, setting, theme = '', additionalElements = '' } = this.storyPrompt;
    const nextPageNumber = this.pages.length + 1;

    // 如果已经是最后一页，不再生成
    if (nextPageNumber > 5) {
      this.currentStory.isComplete = true;
      return null;
    }

    try {
      // 构建之前页面的上下文
      const previousPages = this.pages.map(page => ({
        text: page.text,
        userChoice: page.id === this.pages[this.pages.length - 1].id ? userChoice : undefined
      }));

      // 更新最后一页的用户选择
      if (previousPages.length > 0) {
        previousPages[previousPages.length - 1].userChoice = userChoice;
      }

      this.callbacks.onProgress?.({
        step: `正在创作第${nextPageNumber}页故事...`,
        progress: 20 + (nextPageNumber - 1) * 15,
        currentPage: nextPageNumber,
        totalPages: 5
      });

      // 生成下一页内容
      const pageData = await generateStoryPageWithChoices(
        mainCharacter,
        mood,
        setting || '神奇世界',
        theme ? theme.split(',') : [],
        nextPageNumber,
        previousPages,
        additionalElements
      );

      // 创建新页面
      const newPage: StreamingPage = {
        id: generatePageId(this.storyId, nextPageNumber),
        text: pageData.text,
        background: '',
        interactiveElements: generateBasicElements(mainCharacter),
        isReady: false,
        isGenerating: false,
        question: pageData.choices.length > 0 && !pageData.isLastPage ? {
          id: `question_${this.storyId}_${nextPageNumber}`,
          question: '接下来会发生什么呢？',
          options: pageData.choices.map((choice, index) => ({
            id: `choice_${this.storyId}_${nextPageNumber}_${index + 1}`,
            text: choice.text,
            emoji: choice.emoji,
            feedback: choice.description
          }))
        } : undefined
      };

      // 添加到页面列表
      this.pages.push(newPage);
      this.currentStory.pages = this.pages;

      // 如果是最后一页，标记完成
      if (pageData.isLastPage) {
        this.currentStory.isComplete = true;
      }

      // 生成这一页的图片
      await this.generatePageImage(nextPageNumber - 1);

      this.callbacks.onPageReady?.(newPage, nextPageNumber - 1);

      return newPage;
    } catch (error) {
      console.error(`Error generating next page:`, error);
      this.callbacks.onError?.(error as Error, nextPageNumber - 1);
      throw error;
    }
  }

  private async startStreamingGeneration(story: StreamingStory) {
    try {
      // 首先生成封面
      await this.generateCoverImage(story);
      
      // 生成第一页的图片
      if (this.pages.length > 0) {
        await this.generatePageImage(0);
      }

      // 第一页生成完成，可以开始交互
      this.callbacks.onProgress?.({
        step: '第一页已准备好，开始你的冒险吧！',
        progress: 60,
        currentPage: 1,
        totalPages: 5
      });

      // 注意：不再自动生成所有页面，而是等待用户选择后再生成
    } catch (error) {
      this.callbacks.onError?.(error as Error, -1);
    }
  }

  private async generateCoverImage(story: StreamingStory) {
    try {
      const coverPrompt = `Create a children's book cover illustration for "${story.title}". Style requirements:
- Combine the charm of children's drawings with professional illustration techniques
- Use soft, watercolor-like textures with simple, clean lines
- Color palette: warm, pastel colors with gentle transitions
- Character design: simplified but well-proportioned, similar to Studio Ghibli's style
- Background: subtle textures and gentle gradients
- Overall mood: whimsical and inviting, maintaining professional quality while keeping childlike innocence
- Add small, playful details that children can discover
- Lighting: soft and warm, creating a cozy atmosphere
Story details: ${story.description}`;

      story.cover = await generateImage({ 
        prompt: coverPrompt,
        numInferenceSteps: 25, // 降低步数提升速度
        guidanceScale: 5.5,    // 降低引导比例
        imageSize: '512x512'   // 降低图片尺寸
      });

      this.callbacks.onProgress?.({
        step: '封面绘制完成',
        progress: 50,
        currentPage: 1,
        totalPages: this.pages.length + 1
      });
    } catch (error) {
      console.error('Error generating cover image:', error);
      story.cover = '/placeholder.svg'; // 使用占位符
      this.callbacks.onError?.(error as Error, -1);
    }
  }

  private async generatePageImage(pageIndex: number) {
    const page = this.pages[pageIndex];
    if (!page) return;

    try {
      // 标记页面正在生成
      page.isGenerating = true;
      this.callbacks.onPageReady?.(page, pageIndex);

      const pagePrompt = `Create a children's book illustration for this scene: "${page.text}". Style requirements:
- Match the cover art style: blend of children's art and professional illustration
- Scene composition: clear focal point with balanced negative space
- Characters: expressive and endearing, with simple but distinctive features
- Color harmony: use warm, pastel colors with gentle transitions
- Depth: subtle layering and perspective to create dimension
- Details: include small, interactive elements for children to discover
- Texture: soft watercolor effects with clean linework
- Mood: maintain story continuity while expressing the scene's emotion
- Lighting: soft and warm, emphasizing important story elements`;

      page.background = await generateImage({ 
        prompt: pagePrompt,
        numInferenceSteps: 25, // 降低步数提升速度
        guidanceScale: 5.5,    // 降低引导比例
        imageSize: '512x512'   // 降低图片尺寸
      });

      // 标记页面完成
      page.isReady = true;
      page.isGenerating = false;

      this.callbacks.onProgress?.({
        step: `第${pageIndex + 1}页插图绘制完成`,
        progress: 60 + (pageIndex + 1) * (30 / this.pages.length),
        currentPage: pageIndex + 2, // +2 because cover is page 1
        totalPages: this.pages.length + 1
      });

      this.callbacks.onPageReady?.(page, pageIndex);
    } catch (error) {
      console.error(`Error generating image for page ${pageIndex + 1}:`, error);
      page.background = '/placeholder.svg'; // 使用占位符
      page.isReady = true;
      page.isGenerating = false;
      this.callbacks.onError?.(error as Error, pageIndex);
      this.callbacks.onPageReady?.(page, pageIndex);
    }
  }

  // 获取当前故事
  getCurrentStory(): StreamingStory | null {
    return this.currentStory;
  }

  // 取消生成
  cancel() {
    this.isGenerating = false;
  }
}

// 辅助函数
function getSettingTranslation(setting: string): string {
  const settingTranslation: { [key: string]: string } = {
    'home': '家里',
    'school': '学校',
    'forest': '森林',
    'park': '公园',
    'beach': '海边',
    'space': '太空'
  };
  return settingTranslation[setting] || '神奇';
}

function generateDescription(
  mainCharacter: string,
  mood: string,
  setting: string,
  theme: string,
  additionalElements: string
): string {
  const moodTranslation: { [key: string]: string } = {
    'happy': '开心',
    'sad': '难过',
    'excited': '兴奋',
    'worried': '担心',
    'angry': '生气',
    'peaceful': '平静'
  };

  const settingTranslation: { [key: string]: string } = {
    'home': '家里',
    'school': '学校',
    'forest': '森林',
    'park': '公园',
    'beach': '海边',
    'space': '太空'
  };

  return `一个关于${mainCharacter}在${settingTranslation[setting] || '神奇世界'}里，经历${moodTranslation[mood] || '特别'}的冒险故事。${theme ? `故事蕴含着${theme}的主题。` : ''}${additionalElements ? `故事中还有${additionalElements}` : ''}`;
}

function generateBasicElements(mainCharacter: string): InteractiveElement[] {
  return [
    {
      id: 'element_1',
      emoji: '✨',
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      reward: `${mainCharacter}露出了开心的笑容！`
    },
    {
      id: 'element_2',
      emoji: '🎈',
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      reward: '发现了一个神奇的惊喜！'
    }
  ];
}
