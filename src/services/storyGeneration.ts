import { generateImage } from './imageGeneration';
import { Storybook, StoryPage, InteractiveElement } from '../data/storybooksData';

export interface StoryGenerationRequest {
  category: string;
  title?: string;
}

const generateStoryId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

const generatePageId = (storyId: string, pageNumber: number): string => {
  return `${storyId}-${pageNumber}`;
};

const generateElementId = (pageId: string, elementNumber: number): string => {
  return `${pageId}-${elementNumber}`;
};

export const generateStory = async (request: StoryGenerationRequest): Promise<Storybook> => {
  const storyId = generateStoryId();
  const { category, title = '新的故事' } = request;

  // 生成封面图片
  const coverPrompt = `Generate a children's book cover illustration for a story about ${title}, cute and colorful style`;
  const coverImage = await generateImage({ prompt: coverPrompt });

  // 创建故事页面
  const pages: StoryPage[] = [];
  const numPages = 3; // 可以根据需要调整页数

  for (let i = 1; i <= numPages; i++) {
    const pageId = generatePageId(storyId, i);
    
    // 为每个页面生成背景图片
    const pagePrompt = `Generate a children's book illustration for page ${i} of ${title}, showing a scene with cute characters and colorful background`;
    const backgroundImage = await generateImage({ prompt: pagePrompt });

    // 创建交互元素
    const interactiveElements: InteractiveElement[] = [
      {
        id: generateElementId(pageId, 1),
        emoji: '✨',
        x: Math.random() * 80 + 10, // 10-90
        y: Math.random() * 80 + 10, // 10-90
        reward: '发现了一个惊喜！'
      },
      {
        id: generateElementId(pageId, 2),
        emoji: '🎈',
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        reward: '气球飞向了天空！'
      }
    ];

    pages.push({
      id: pageId,
      background: backgroundImage,
      text: `这是第 ${i} 页的故事内容...`, // 这里可以接入文本生成API
      interactiveElements
    });
  }

  return {
    id: storyId,
    title,
    cover: coverImage,
    category,
    description: `一个关于${title}的精彩故事...`, // 这里可以接入文本生成API
    pages
  };
}; 