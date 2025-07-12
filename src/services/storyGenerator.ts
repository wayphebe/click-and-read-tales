import { generateImage } from './imageGeneration';
import { generateStoryPages } from './aiService';
import type { StoryPrompt } from '@/components/StoryGeneratorDialog';
import type { Storybook } from '@/data/storybooksData';

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

export const generateStory = async (prompt: StoryPrompt): Promise<Storybook> => {
  const storyId = generateStoryId();
  const { mainCharacter, mood, setting, theme = '', additionalElements = '' } = prompt;

  try {
    // 1. 首先生成故事文本
    const storyPages = await generateStoryPages(
      mainCharacter,
      mood,
      setting || '神奇世界',
      theme ? theme.split(',') : [],
      additionalElements // Pass additionalElements to story generation
    );

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

    // 生成故事标题和描述
    const title = `${mainCharacter}的${settingTranslation[setting] || '神奇'}冒险`;
    const description = `一个关于${mainCharacter}在${settingTranslation[setting] || '神奇世界'}里，经历${moodTranslation[mood] || '特别'}的冒险故事。${theme ? `故事蕴含着${theme}的主题。` : ''}${additionalElements ? `故事中还有${additionalElements}` : ''}`;

    // 2. 生成封面图片
    const coverPrompt = `Create a children's book cover illustration for "${title}": ${description}. The style should be cute, colorful, and child-friendly.`;
    let coverImage: string;
    try {
      coverImage = await generateImage({ prompt: coverPrompt });
    } catch (error) {
      console.error('Error generating cover image:', error);
      throw new Error('封面图片生成失败，请稍后再试。');
    }

    // 3. 为每页故事生成配图
    const pages = [];
    for (let i = 0; i < storyPages.length; i++) {
      const pageId = generatePageId(storyId, i + 1);
      const pageText = storyPages[i];
      
      // 在每次图片生成之间添加延迟
      if (i > 0) {
        await delay(3000); // 3秒延迟
      }
      
      // 根据页面文本生成图片
      let backgroundImage: string;
      try {
        const pagePrompt = `Illustrate this scene from a children's story: ${pageText}. The scene should be cute, colorful, and engaging for children.`;
        backgroundImage = await generateImage({ prompt: pagePrompt });
      } catch (error) {
        console.error(`Error generating image for page ${i + 1}:`, error);
        throw new Error(`第${i + 1}页的插图生成失败，请稍后再试。`);
      }

      // 创建交互元素
      const interactiveElements = [
        {
          id: generateElementId(pageId, 1),
          emoji: '✨',
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          reward: `${mainCharacter}露出了开心的笑容！`
        },
        {
          id: generateElementId(pageId, 2),
          emoji: '🎈',
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          reward: '发现了一个神奇的惊喜！'
        }
      ];

      pages.push({
        id: pageId,
        background: backgroundImage,
        text: pageText,
        interactiveElements
      });
    }

    return {
      id: storyId,
      title,
      cover: coverImage,
      category: getCategory(theme),
      description,
      pages
    };
  } catch (error) {
    console.error('Error generating story:', error);
    throw new Error(`故事生成失败: ${error.message}`);
  }
}; 