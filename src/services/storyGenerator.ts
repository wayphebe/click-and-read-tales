import type { StoryPrompt } from '@/components/StoryGeneratorDialog';
import type { Storybook } from '@/data/storybooksData';
import { generateStoryPages } from './aiService';

// 模拟表情映射
const moodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  excited: '🤩',
  worried: '😰',
  angry: '😠',
  peaceful: '😌'
};

const settingEmojis: Record<string, string> = {
  home: '🏠',
  school: '🏫',
  forest: '🌳',
  park: '🌸',
  beach: '🏖️',
  space: '🚀'
};

// 生成随机ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 生成互动元素
const generateInteractiveElements = (prompt: StoryPrompt, pageIndex: number) => {
  const elements = [];
  const basePositions = [
    { x: 30, y: 40 },
    { x: 60, y: 60 },
    { x: 80, y: 30 }
  ];

  // 添加主角
  elements.push({
    id: `${pageIndex}-1`,
    emoji: moodEmojis[prompt.mood] || '😊',
    x: basePositions[0].x,
    y: basePositions[0].y,
    reward: '找到主角啦！'
  });

  // 添加场景元素
  if (prompt.setting) {
    elements.push({
      id: `${pageIndex}-2`,
      emoji: settingEmojis[prompt.setting] || '🌟',
      x: basePositions[1].x,
      y: basePositions[1].y,
      reward: '发现了新场景！'
    });
  }

  // 添加随机元素
  elements.push({
    id: `${pageIndex}-3`,
    emoji: '✨',
    x: basePositions[2].x,
    y: basePositions[2].y,
    reward: '触发了魔法效果！'
  });

  return elements;
};

export const generateStory = async (prompt: StoryPrompt): Promise<Storybook> => {
  // 使用LLM生成故事内容
  const storyPages = await generateStoryPages(
    prompt.mainCharacter,
    prompt.mood,
    prompt.setting || 'home',
    prompt.theme ? prompt.theme.split(',') : []
  );

  // 创建故事页面
  const pages = storyPages.map((text, index) => ({
    id: (index + 1).toString(),
    background: `${moodEmojis[prompt.mood]}${settingEmojis[prompt.setting || 'home']}✨`,
    text,
    interactiveElements: generateInteractiveElements(prompt, index + 1)
  }));

  const story: Storybook = {
    id: generateId(),
    title: `${prompt.mainCharacter}的${
      prompt.mood === 'happy' ? '快乐' :
      prompt.mood === 'sad' ? '温暖' :
      prompt.mood === 'excited' ? '精彩' :
      prompt.mood === 'worried' ? '勇敢' :
      prompt.mood === 'angry' ? '平静' :
      '神奇'
    }冒险`,
    cover: moodEmojis[prompt.mood] || '📚',
    category: prompt.theme?.split(',')[0] || '冒险',
    description: `一个关于${prompt.mainCharacter}的${prompt.theme ? prompt.theme.split(',').join('、') + '的' : ''}暖心故事。`,
    pages
  };

  return story;
}; 