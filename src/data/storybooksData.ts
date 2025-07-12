
export interface Storybook {
  id: string;
  title: string;
  cover: string;
  category: string;
  description: string;
  pages: StoryPage[];
}

export interface StoryPage {
  id: string;
  background: string;
  text: string;
  interactiveElements: InteractiveElement[];
}

export interface InteractiveElement {
  id: string;
  emoji: string;
  x: number;
  y: number;
  sound?: string;
  reward?: string;
}

export const categories = ['全部', '冒险', '童话', '科学', '动物'];

export const storybooks: Storybook[] = [
  {
    id: '1',
    title: '小兔子的森林冒险',
    cover: '🐰',
    category: '冒险',
    description: '跟着勇敢的小兔子探索神奇的森林，遇见各种有趣的朋友。',
    pages: [
      {
        id: '1-1',
        background: '🌲🌳🌲',
        text: '在一个阳光明媚的早晨，小兔子决定去森林里探险...',
        interactiveElements: [
          { id: '1-1-1', emoji: '🐰', x: 20, y: 60, reward: '发现了小兔子！' },
          { id: '1-1-2', emoji: '🦋', x: 70, y: 30, reward: '美丽的蝴蝶在飞舞！' },
          { id: '1-1-3', emoji: '🌺', x: 80, y: 70, reward: '闻到了花香！' },
        ]
      },
      {
        id: '1-2',
        background: '🏰🌙⭐',
        text: '夜晚降临，小兔子看到了远处的城堡...',
        interactiveElements: [
          { id: '1-2-1', emoji: '🏰', x: 50, y: 40, reward: '神秘的城堡！' },
          { id: '1-2-2', emoji: '🌟', x: 30, y: 20, reward: '许愿星在闪烁！' },
          { id: '1-2-3', emoji: '🦉', x: 20, y: 50, reward: '智慧的猫头鹰出现了！' },
        ]
      }
    ]
  },
  {
    id: '2',
    title: '海底世界奇遇记',
    cover: '🐠',
    category: '冒险',
    description: '潜入神秘的海底世界，与海洋生物们成为朋友。',
    pages: [
      {
        id: '2-1',
        background: '🌊🐠🐙',
        text: '潜水镜一戴，我们来到了美丽的海底世界...',
        interactiveElements: [
          { id: '2-1-1', emoji: '🐠', x: 30, y: 40, reward: '彩色小鱼游过来了！' },
          { id: '2-1-2', emoji: '🐙', x: 60, y: 60, reward: '章鱼在和你打招呼！' },
          { id: '2-1-3', emoji: '🐚', x: 80, y: 80, reward: '找到了美丽的贝壳！' },
        ]
      }
    ]
  },
  {
    id: '3',
    title: '公主和魔法花园',
    cover: '👸',
    category: '童话',
    description: '美丽的公主在魔法花园里种植神奇的花朵。',
    pages: [
      {
        id: '3-1',
        background: '🌺🌸🌻',
        text: '公主来到了充满魔法的花园...',
        interactiveElements: [
          { id: '3-1-1', emoji: '👸', x: 40, y: 50, reward: '公主微笑了！' },
          { id: '3-1-2', emoji: '🌺', x: 60, y: 30, reward: '魔法花朵绽放了！' },
          { id: '3-1-3', emoji: '✨', x: 30, y: 25, reward: '魔法星尘在闪烁！' },
        ]
      }
    ]
  },
  {
    id: '4',
    title: '太空探索之旅',
    cover: '🚀',
    category: '科学',
    description: '乘坐火箭飞向太空，探索神秘的宇宙。',
    pages: [
      {
        id: '4-1',
        background: '🌌🪐⭐',
        text: '火箭发射了！我们来到了广阔的太空...',
        interactiveElements: [
          { id: '4-1-1', emoji: '🚀', x: 50, y: 70, reward: '火箭正在飞行！' },
          { id: '4-1-2', emoji: '🪐', x: 70, y: 40, reward: '发现了美丽的星球！' },
          { id: '4-1-3', emoji: '👨‍🚀', x: 30, y: 30, reward: '宇航员向你挥手！' },
        ]
      }
    ]
  },
  {
    id: '5',
    title: '动物农场的一天',
    cover: '🐄',
    category: '动物',
    description: '在农场里和可爱的动物们一起度过快乐的一天。',
    pages: [
      {
        id: '5-1',
        background: '🌾🏡🌻',
        text: '早晨的农场里，动物们都醒来了...',
        interactiveElements: [
          { id: '5-1-1', emoji: '🐄', x: 40, y: 60, reward: '奶牛在哞哞叫！' },
          { id: '5-1-2', emoji: '🐔', x: 60, y: 70, reward: '小鸡在找虫子吃！' },
          { id: '5-1-3', emoji: '🐷', x: 20, y: 50, reward: '小猪在泥地里打滚！' },
        ]
      }
    ]
  }
];
