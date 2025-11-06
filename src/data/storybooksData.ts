import { create } from 'zustand';
import { generateStory, StoryGenerationRequest } from '../services/storyGeneration';
import { StreamingStoryGenerator } from '../services/streamingStoryGenerator';

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
  question?: StoryQuestion; // 新增问题字段
}

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
  userChoices: string[]; // 追踪用户的所有选择
}

// 故事问题接口
export interface StoryQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
}

// 问题选项接口
export interface QuestionOption {
  id: string;
  text: string;
  emoji: string;
  isCorrect?: boolean;
  feedback: string;
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

// 流式生成状态
export interface StreamingGenerationState {
  isGenerating: boolean;
  currentStory: StreamingStory | null;
  generationProgress: {
    step: string;
    progress: number;
    currentPage: number;
    totalPages: number;
  };
}

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
        ],
        question: {
          id: 'q1-1',
          question: '当你感到焦虑时，你的情绪毛球会做什么？',
          options: [
            {
              id: 'a1',
              text: '静静地趴着',
              emoji: '😌',
              isCorrect: false,
              feedback: '不对哦，焦虑时毛球会乱跑！'
            },
            {
              id: 'a2',
              text: '像闪电一样乱跑',
              emoji: '⚡',
              isCorrect: true,
              feedback: '太棒了！你理解得很对！'
            },
            {
              id: 'a3',
              text: '缩成小球躲起来',
              emoji: '😢',
              isCorrect: false,
              feedback: '这是伤心时的表现，不是焦虑哦！'
            },
            {
              id: 'a4',
              text: '变成彩虹色',
              emoji: '🌈',
              isCorrect: false,
              feedback: '这是最后才会发生的神奇变化！'
            }
          ]
        }
      },
      {
        id: '1-2',
        background: '🌅🤗💕',
        text: '有一天，我决定不再害怕我的情绪毛球。我轻轻地走近它，伸出手，温柔地抚摸它。毛球开始颤抖，然后慢慢地，慢慢地，它开始发光。',
        interactiveElements: [
          { id: '1-2-1', emoji: '🤗', x: 40, y: 40, reward: '你给了毛球一个温暖的拥抱！' },
          { id: '1-2-2', emoji: '✨', x: 70, y: 60, reward: '毛球开始闪闪发光！' },
          { id: '1-2-3', emoji: '💕', x: 50, y: 80, reward: '爱意充满了整个房间！' },
        ],
        question: {
          id: 'q1-2',
          question: '当主人公温柔地抚摸毛球时，毛球发生了什么变化？',
          options: [
            {
              id: 'a1',
              text: '变得更黑了',
              emoji: '🖤',
              isCorrect: false,
              feedback: '不是的，毛球开始发光了！'
            },
            {
              id: 'a2',
              text: '开始发光',
              emoji: '✨',
              isCorrect: true,
              feedback: '完全正确！爱让毛球开始发光！'
            },
            {
              id: 'a3',
              text: '跑得更快了',
              emoji: '🏃',
              isCorrect: false,
              feedback: '不是的，毛球变得平静了！'
            },
            {
              id: 'a4',
              text: '消失了',
              emoji: '👻',
              isCorrect: false,
              feedback: '毛球没有消失，而是变得更美丽了！'
            }
          ]
        }
      },
      {
        id: '1-3',
        background: '🌈🎉🎈',
        text: '现在，我的情绪毛球变成了彩虹色！它不再让我害怕，而是成为了我最特别的朋友。我们一起玩耍，一起成长，一起面对生活中的每一个挑战。',
        interactiveElements: [
          { id: '1-3-1', emoji: '🌈', x: 30, y: 30, reward: '彩虹毛球在跳舞！' },
          { id: '1-3-2', emoji: '🎉', x: 60, y: 50, reward: '庆祝这个美好的时刻！' },
          { id: '1-3-3', emoji: '🎈', x: 80, y: 70, reward: '快乐像气球一样飞向天空！' },
        ],
        question: {
          id: 'q1-3',
          question: '故事的最后，情绪毛球变成了什么？',
          options: [
            {
              id: 'a1',
              text: '彩虹色',
              emoji: '🌈',
              isCorrect: true,
              feedback: '太棒了！彩虹色代表所有的情绪都被接纳了！'
            },
            {
              id: 'a2',
              text: '更黑的颜色',
              emoji: '🖤',
              isCorrect: false,
              feedback: '不是的，毛球变得美丽了！'
            },
            {
              id: 'a3',
              text: '透明色',
              emoji: '👻',
              isCorrect: false,
              feedback: '毛球变成了美丽的彩虹色！'
            },
            {
              id: 'a4',
              text: '白色',
              emoji: '🤍',
              isCorrect: false,
              feedback: '毛球变成了彩虹色，代表所有的情绪！'
            }
          ]
        }
      }
    ]
  },
  {
    id: '2',
    title: '小兔子的森林冒险',
    cover: '🐰',
    category: '冒险',
    description: '勇敢的小兔子踏上了寻找彩虹花的冒险之旅，在森林里遇到了许多有趣的朋友。',
    pages: [
      {
        id: '2-1',
        background: '🌲🐰🌅',
        text: '小兔子白绒绒听说森林深处有一朵会发光的彩虹花，决定去寻找它。它背着小背包，蹦蹦跳跳地走进了神秘的森林。',
        interactiveElements: [
          { id: '2-1-1', emoji: '🐰', x: 20, y: 60, reward: '小兔子蹦蹦跳跳地出发了！' },
          { id: '2-1-2', emoji: '🌲', x: 70, y: 30, reward: '森林里的树木在向小兔子招手！' },
          { id: '2-1-3', emoji: '🌅', x: 90, y: 20, reward: '阳光透过树叶洒下金色的光芒！' },
        ],
        question: {
          id: 'q2-1',
          question: '小兔子为什么要去寻找彩虹花？',
          options: [
            {
              id: 'a1',
              text: '因为彩虹花会发光',
              emoji: '✨',
              isCorrect: true,
              feedback: '太棒了！小兔子被彩虹花的神奇光芒吸引了！'
            },
            {
              id: 'a2',
              text: '因为彩虹花很香',
              emoji: '🌸',
              isCorrect: false,
              feedback: '不是的，小兔子是被彩虹花的光芒吸引的！'
            },
            {
              id: 'a3',
              text: '因为彩虹花很大',
              emoji: '🌺',
              isCorrect: false,
              feedback: '不是的，小兔子是被彩虹花的光芒吸引的！'
            },
            {
              id: 'a4',
              text: '因为彩虹花会唱歌',
              emoji: '🎵',
              isCorrect: false,
              feedback: '不是的，小兔子是被彩虹花的光芒吸引的！'
            }
          ]
        }
      },
      {
        id: '2-2',
        background: '🦊🌺💫',
        text: '在森林里，小兔子遇到了聪明的狐狸先生。狐狸先生告诉它："彩虹花在最高的山顶上，但要小心路上的荆棘。"小兔子感谢了狐狸先生，继续前进。',
        interactiveElements: [
          { id: '2-2-1', emoji: '🦊', x: 40, y: 50, reward: '狐狸先生友好地挥了挥手！' },
          { id: '2-2-2', emoji: '🌺', x: 60, y: 70, reward: '路边的小花在微笑！' },
          { id: '2-2-3', emoji: '💫', x: 80, y: 40, reward: '魔法般的星光在闪烁！' },
        ],
        question: {
          id: 'q2-2',
          question: '狐狸先生告诉小兔子彩虹花在哪里？',
          options: [
            {
              id: 'a1',
              text: '在森林深处',
              emoji: '🌲',
              isCorrect: false,
              feedback: '不是的，彩虹花在最高的山顶上！'
            },
            {
              id: 'a2',
              text: '在最高的山顶上',
              emoji: '⛰️',
              isCorrect: true,
              feedback: '完全正确！彩虹花在最高的山顶上！'
            },
            {
              id: 'a3',
              text: '在河边',
              emoji: '🏞️',
              isCorrect: false,
              feedback: '不是的，彩虹花在最高的山顶上！'
            },
            {
              id: 'a4',
              text: '在洞穴里',
              emoji: '🕳️',
              isCorrect: false,
              feedback: '不是的，彩虹花在最高的山顶上！'
            }
          ]
        }
      },
      {
        id: '2-3',
        background: '🌈��🎉',
        text: '经过重重困难，小兔子终于找到了彩虹花！花朵散发着七彩的光芒，比想象中还要美丽。小兔子开心地跳起舞来，森林里的所有动物都来庆祝这个美好的时刻。',
        interactiveElements: [
          { id: '2-3-1', emoji: '🌈', x: 30, y: 30, reward: '彩虹花绽放出美丽的光芒！' },
          { id: '2-3-2', emoji: '🌸', x: 60, y: 60, reward: '花瓣在微风中轻轻摇摆！' },
          { id: '2-3-3', emoji: '🎉', x: 80, y: 80, reward: '所有动物都在庆祝！' },
        ],
        question: {
          id: 'q2-3',
          question: '小兔子找到彩虹花后做了什么？',
          options: [
            {
              id: 'a1',
              text: '立即回家',
              emoji: '🏠',
              isCorrect: false,
              feedback: '不是的，小兔子开心地跳起舞来了！'
            },
            {
              id: 'a2',
              text: '开心地跳起舞来',
              emoji: '💃',
              isCorrect: true,
              feedback: '太棒了！小兔子因为找到彩虹花而开心地跳舞！'
            },
            {
              id: 'a3',
              text: '把花摘下来',
              emoji: '✋',
              isCorrect: false,
              feedback: '不是的，小兔子只是开心地跳舞！'
            },
            {
              id: 'a4',
              text: '睡着了',
              emoji: '😴',
              isCorrect: false,
              feedback: '不是的，小兔子因为兴奋而跳舞！'
            }
          ]
        }
      }
    ]
  },
  {
    id: '3',
    title: '星星的愿望',
    cover: '⭐',
    category: '童话',
    description: '一颗小星星从天空掉落到地球上，开始了它的奇妙旅程，学会了友谊和爱的真谛。',
    pages: [
      {
        id: '3-1',
        background: '🌌⭐💫',
        text: '在遥远的天空中，有一颗小星星总是觉得孤独。它看着地球上的孩子们快乐地玩耍，心中充满了羡慕。于是，它做了一个大胆的决定——到地球上去看看。',
        interactiveElements: [
          { id: '3-1-1', emoji: '⭐', x: 50, y: 30, reward: '小星星在天空中闪闪发光！' },
          { id: '3-1-2', emoji: '🌌', x: 20, y: 20, reward: '银河系在夜空中闪烁！' },
          { id: '3-1-3', emoji: '💫', x: 80, y: 40, reward: '流星划过夜空！' },
        ],
        question: {
          id: 'q3-1',
          question: '小星星为什么想要到地球上去？',
          options: [
            {
              id: 'a1',
              text: '因为地球很美丽',
              emoji: '🌍',
              isCorrect: false,
              feedback: '不是的，小星星是因为羡慕孩子们快乐地玩耍！'
            },
            {
              id: 'a2',
              text: '因为羡慕孩子们快乐地玩耍',
              emoji: '👧👦',
              isCorrect: true,
              feedback: '完全正确！小星星羡慕孩子们的快乐！'
            },
            {
              id: 'a3',
              text: '因为地球有食物',
              emoji: '🍎',
              isCorrect: false,
              feedback: '不是的，小星星是因为羡慕孩子们的快乐！'
            },
            {
              id: 'a4',
              text: '因为地球很温暖',
              emoji: '☀️',
              isCorrect: false,
              feedback: '不是的，小星星是因为羡慕孩子们的快乐！'
            }
          ]
        }
      },
      {
        id: '3-2',
        background: '🌍👧🌟',
        text: '小星星降落到地球上，遇到了一个小女孩。小女孩看到这颗会发光的小星星，非常惊喜。她温柔地捧起小星星，说："你好，小星星！你愿意和我做朋友吗？"',
        interactiveElements: [
          { id: '3-2-1', emoji: '👧', x: 30, y: 60, reward: '小女孩温柔地笑了！' },
          { id: '3-2-2', emoji: '🌟', x: 60, y: 40, reward: '小星星开心地闪烁！' },
          { id: '3-2-3', emoji: '🌍', x: 80, y: 80, reward: '地球在欢迎小星星！' },
        ],
        question: {
          id: 'q3-2',
          question: '小女孩看到小星星后说了什么？',
          options: [
            {
              id: 'a1',
              text: '你是什么？',
              emoji: '❓',
              isCorrect: false,
              feedback: '不是的，小女孩很友好地问小星星愿不愿意做朋友！'
            },
            {
              id: 'a2',
              text: '你愿意和我做朋友吗？',
              emoji: '🤝',
              isCorrect: true,
              feedback: '太棒了！小女孩很友好地邀请小星星做朋友！'
            },
            {
              id: 'a3',
              text: '你从哪里来？',
              emoji: '🌌',
              isCorrect: false,
              feedback: '不是的，小女孩直接邀请小星星做朋友！'
            },
            {
              id: 'a4',
              text: '你害怕吗？',
              emoji: '😰',
              isCorrect: false,
              feedback: '不是的，小女孩很友好地邀请小星星做朋友！'
            }
          ]
        }
      },
      {
        id: '3-3',
        background: '✨🎈🎉',
        text: '从那天起，小星星和小女孩成为了最好的朋友。他们一起看日落，一起数星星，一起分享快乐和悲伤。小星星终于明白了，真正的家不是在天上，而是在朋友的心里。',
        interactiveElements: [
          { id: '3-3-1', emoji: '✨', x: 40, y: 50, reward: '友谊的光芒照亮了整个世界！' },
          { id: '3-3-2', emoji: '🎈', x: 70, y: 30, reward: '快乐像气球一样飞向天空！' },
          { id: '3-3-3', emoji: '🎉', x: 50, y: 80, reward: '庆祝这美好的友谊！' },
        ],
        question: {
          id: 'q3-3',
          question: '小星星最后明白了什么？',
          options: [
            {
              id: 'a1',
              text: '真正的家在天上',
              emoji: '🌌',
              isCorrect: false,
              feedback: '不是的，小星星明白了真正的家在朋友的心里！'
            },
            {
              id: 'a2',
              text: '真正的家在朋友的心里',
              emoji: '💖',
              isCorrect: true,
              feedback: '太棒了！小星星明白了友谊的珍贵！'
            },
            {
              id: 'a3',
              text: '地球比天空更美丽',
              emoji: '🌍',
              isCorrect: false,
              feedback: '不是的，小星星明白了真正的家在朋友的心里！'
            },
            {
              id: 'a4',
              text: '小女孩很聪明',
              emoji: '🧠',
              isCorrect: false,
              feedback: '不是的，小星星明白了真正的家在朋友的心里！'
            }
          ]
        }
      }
    ]
  }
];

interface StorybooksStore extends StreamingGenerationState {
  books: Storybook[];
  addBook: (book: Storybook) => void;
  getBook: (id: string) => Storybook | undefined;
  generateNewStory: (request: StoryGenerationRequest) => Promise<Storybook>;
  // 流式生成相关方法
  startStreamingGeneration: (prompt: any) => Promise<void>;
  updateStreamingStory: (story: StreamingStory) => void;
  setGenerationProgress: (progress: StreamingGenerationState['generationProgress']) => void;
  setGenerating: (isGenerating: boolean) => void;
  // 生成器实例管理
  generatorInstances: Map<string, StreamingStoryGenerator>;
  setGenerator: (storyId: string, generator: StreamingStoryGenerator) => void;
  getGenerator: (storyId: string) => StreamingStoryGenerator | undefined;
  generateNextPage: (storyId: string, choice: 'A' | 'B') => Promise<StreamingStory | null>;
}

export const useStorybooksStore = create<StorybooksStore>((set, get) => ({
  books: defaultStorybooks,
  isGenerating: false,
  currentStory: null,
  generationProgress: {
    step: '',
    progress: 0,
    currentPage: 0,
    totalPages: 0
  },
  generatorInstances: new Map(),
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
  // 流式生成方法
  startStreamingGeneration: async (prompt) => {
    set({ 
      isGenerating: true,
      currentStory: null,
      generationProgress: {
        step: '正在准备...',
        progress: 0,
        currentPage: 0,
        totalPages: 0
      }
    });
  },
  updateStreamingStory: (story) => {
    set({ currentStory: story });
  },
  setGenerationProgress: (progress) => {
    set({ generationProgress: progress });
  },
  setGenerating: (isGenerating) => {
    set({ isGenerating });
  },
  // 生成器实例管理
  setGenerator: (storyId, generator) => {
    const instances = new Map(get().generatorInstances);
    instances.set(storyId, generator);
    set({ generatorInstances: instances });
  },
  getGenerator: (storyId) => {
    return get().generatorInstances.get(storyId);
  },
  generateNextPage: async (storyId, choice) => {
    const generator = get().generatorInstances.get(storyId);
    const story = get().currentStory;
    
    if (!generator || !story || story.id !== storyId) {
      console.error('Generator or story not found');
      return null;
    }

    try {
      const updatedStory = await generator.generateNextPage(story, choice);
      set({ currentStory: updatedStory });
      return updatedStory;
    } catch (error) {
      console.error('Error generating next page:', error);
      return null;
    }
  }
}));
