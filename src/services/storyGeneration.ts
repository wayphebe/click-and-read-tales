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

  // 生成封面图片 - 更新提示词以实现平衡的艺术风格
  const coverPrompt = `Create a children's book cover illustration for "${title}". Style requirements:
- Combine the charm of children's drawings with professional illustration techniques
- Use soft, watercolor-like textures with simple, clean lines
- Color palette: warm, pastel colors with gentle transitions
- Character design: simplified but well-proportioned, similar to Studio Ghibli's style
- Background: subtle textures and gentle gradients
- Overall mood: whimsical and inviting, maintaining professional quality while keeping childlike innocence
- Add small, playful details that children can discover
- Lighting: soft and warm, creating a cozy atmosphere`;

  const coverImage = await generateImage({ 
    prompt: coverPrompt,
    numInferenceSteps: 50,
    guidanceScale: 7.5,
  });

  // 创建故事页面
  const pages: StoryPage[] = [];
  const numPages = 3;

  for (let i = 1; i <= numPages; i++) {
    const pageId = generatePageId(storyId, i);
    
    // 为每个页面生成背景图片 - 更新提示词以保持一致的艺术风格
    const pagePrompt = `Create a children's book illustration for page ${i} of "${title}". Style requirements:
- Match the cover art style: blend of children's art and professional illustration
- Scene composition: clear focal point with balanced negative space
- Characters: expressive and endearing, with simple but distinctive features
- Color harmony: use the established color palette from the cover
- Depth: subtle layering and perspective to create dimension
- Details: include small, interactive elements for children to discover
- Texture: soft watercolor effects with clean linework
- Mood: maintain story continuity while expressing the current scene's emotion
- Lighting: consistent with cover, emphasizing important story elements`;

    const backgroundImage = await generateImage({ 
      prompt: pagePrompt,
      numInferenceSteps: 50,
      guidanceScale: 7.5,
    });

    // 创建交互元素 - 保持简单但有趣的表情符号
    const interactiveElements: InteractiveElement[] = [
      {
        id: generateElementId(pageId, 1),
        emoji: getThematicEmoji(category, 1), // 根据故事类别选择合适的表情符号
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        reward: generateRewardMessage(category, 1)
      },
      {
        id: generateElementId(pageId, 2),
        emoji: getThematicEmoji(category, 2),
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        reward: generateRewardMessage(category, 2)
      }
    ];

    pages.push({
      id: pageId,
      background: backgroundImage,
      text: `这是第 ${i} 页的故事内容...`,
      interactiveElements
    });
  }

  return {
    id: storyId,
    title,
    cover: coverImage,
    category,
    description: `一个关于${title}的精彩故事...`,
    pages
  };
};

// 根据故事类别选择主题相关的表情符号
function getThematicEmoji(category: string, index: number): string {
  const emojiMap: { [key: string]: string[] } = {
    '情绪管理': ['😊', '😢', '😠', '😌'],
    '童话': ['✨', '🌟', '🎭', '👑'],
    '科学': ['🔬', '🚀', '🌍', '⚡'],
    '动物': ['🐶', '🐱', '🦁', '🐘'],
    '自然': ['🌳', '🌺', '🌈', '☀️'],
    '冒险': ['🗺️', '🎪', '⛵', '🏰']
  };

  const defaultEmojis = ['✨', '🌟', '💫', '⭐'];
  const thematicEmojis = emojiMap[category] || defaultEmojis;
  return thematicEmojis[index % thematicEmojis.length];
}

// 生成主题相关的奖励信息
function generateRewardMessage(category: string, index: number): string {
  const rewardMap: { [key: string]: string[] } = {
    '情绪管理': ['真棒！你理解了这种感受！', '你帮助小朋友找到了快乐！', '这就是分享爱的感觉！'],
    '童话': ['魔法闪闪发光！', '你发现了一个神奇的宝藏！', '童话故事在继续...'],
    '科学': ['新发现！太神奇了！', '你学到了新知识！', '科学真有趣！'],
    '动物': ['小动物向你打招呼！', '你交到了一个毛茸茸的朋友！', '动物们都很喜欢你！'],
    '自然': ['大自然真美丽！', '你帮助保护了环境！', '发现了春天的气息！'],
    '冒险': ['勇敢的探险家！', '你找到了宝藏！', '新的冒险正等着你！']
  };

  const defaultRewards = ['真棒！继续探索吧！', '你发现了一个惊喜！', '太神奇了！'];
  const thematicRewards = rewardMap[category] || defaultRewards;
  return thematicRewards[index % thematicRewards.length];
} 