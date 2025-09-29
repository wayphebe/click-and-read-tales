import { create } from 'zustand';
import { generateStory, StoryGenerationRequest } from '../services/storyGeneration';

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

export const categories = ['全部', '情绪管理', '冒险', '童话', '科学', '动物'];

const defaultStorybooks: Storybook[] = [
  {
    id: '1',
    title: '我的情绪小毛球',
    cover: '🖤',
    category: '情绪管理',
    description: '学会和自己的情绪做朋友，一个关于接纳和成长的温暖故事。',
    pages: [
      {
        id: '1-1',
        background: '🏠💭✨',
        text: '我的情绪是一只小小的黑色毛球。当我安静时，它也静静地趴在我身边。当我焦虑，它像闪电一样在屋子里乱跑。当我伤心，它缩成一个小球，藏在角落里。',
        interactiveElements: [
          { id: '1-1-1', emoji: '🖤', x: 30, y: 50, reward: '毛球静静地趴下了' },
          { id: '1-1-2', emoji: '⚡', x: 60, y: 30, reward: '毛球在房间里飞奔！' },
          { id: '1-1-3', emoji: '😢', x: 80, y: 70, reward: '毛球蜷缩在角落里...' },
        ]
      },
      {
        id: '1-2',
        background: '👥🌟💫',
        text: '我发现别人的情绪像一位优雅的小姐，总是温柔地陪在他们身边。我开始羡慕，为什么我的毛球总是这样疯疯癫癫，控制不住呢？',
        interactiveElements: [
          { id: '1-2-1', emoji: '💝', x: 25, y: 40, reward: '别人的毛球好优雅！' },
          { id: '1-2-2', emoji: '🖤', x: 70, y: 60, reward: '我的毛球又在乱跑...' },
          { id: '1-2-3', emoji: '😔', x: 50, y: 25, reward: '我好羡慕他们...' },
        ]
      },
      {
        id: '1-3',
        background: '✂️🧴🪮',
        text: '我按照情绪专家说的做，给它剪指甲、梳毛、洗脸，想让它变得乖一点。但每次，它都抗拒、咬我、躲我，慢慢，我也不理它了。',
        interactiveElements: [
          { id: '1-3-1', emoji: '✂️', x: 20, y: 45, reward: '毛球喊"喵呜"逃跑了！' },
          { id: '1-3-2', emoji: '🪮', x: 50, y: 35, reward: '毛球不让我梳毛！' },
          { id: '1-3-3', emoji: '🧴', x: 75, y: 55, reward: '毛球咬了我的手！' },
        ]
      },
      {
        id: '1-4',
        background: '🤗💕👀',
        text: '可我发现它一直在悄悄看着我。当我靠近，它咬了我一下，我有点疼，但我感受到它了。然后，它轻轻舔了舔我的手，软软的、暖暖的，好像回到家一样。',
        interactiveElements: [
          { id: '1-4-1', emoji: '👋', x: 40, y: 50, reward: '毛球先咬了一下，然后舔舔我的手' },
          { id: '1-4-2', emoji: '🖤', x: 60, y: 35, reward: '毛球跳进我的怀里打滚！' },
          { id: '1-4-3', emoji: '💝', x: 30, y: 70, reward: '感受到了暖暖的爱意' },
        ]
      },
      {
        id: '1-5',
        background: '🌈🫂😊',
        text: '从那天起，我不再试图控制它，而是学会陪伴。它伤心时，我说："哭吧。"它焦虑时，我说："随便疯一会。"它累了，我就抱着它睡觉。它高兴了，我就让它跑远一点，再回来。',
        interactiveElements: [
          { id: '1-5-1', emoji: '😢', x: 20, y: 40, reward: '哭吧，没关系的' },
          { id: '1-5-2', emoji: '😰', x: 45, y: 30, reward: '随便疯一会吧' },
          { id: '1-5-3', emoji: '😴', x: 70, y: 50, reward: '抱抱，一起睡觉' },
          { id: '1-5-4', emoji: '😄', x: 50, y: 70, reward: '开心地跑远再回来！' },
        ]
      },
      {
        id: '1-6',
        background: '🌙⭐💤',
        text: '现在，我和我的情绪是最好的朋友。它有时还是会咬我，但我知道那是它饿了、想让我注意它。它有时依赖别人，别人不喜欢它，但没关系，因为它是我自己的情绪。它再怎么走远，最终也会回来，安静地睡在我身边，做一个甜甜的梦。',
        interactiveElements: [
          { id: '1-6-1', emoji: '🖤', x: 50, y: 50, reward: '毛球慢慢闭上眼睛打呼噜' },
          { id: '1-6-2', emoji: '🏆', x: 75, y: 25, reward: '获得【情绪好朋友】勋章！' },
          { id: '1-6-3', emoji: '💤', x: 30, y: 70, reward: '和毛球一起做甜甜的梦' },
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

interface StorybooksStore {
  books: Storybook[];
  addBook: (book: Storybook) => void;
  getBook: (id: string) => Storybook | undefined;
  generateNewStory: (request: StoryGenerationRequest) => Promise<Storybook>;
  isGenerating: boolean;
}

export const useStorybooksStore = create<StorybooksStore>((set, get) => ({
  books: defaultStorybooks,
  addBook: (book) => set((state) => ({ books: [book, ...state.books] })),
  getBook: (id) => get().books.find(book => book.id === id),
  generateNewStory: async (request) => {
    set({ isGenerating: true });
    try {
      const newStory = await generateStory(request);
      set((state) => ({ books: [newStory, ...state.books] }));
      return newStory;
    } finally {
      set({ isGenerating: false });
    }
  },
  isGenerating: false,
}));
