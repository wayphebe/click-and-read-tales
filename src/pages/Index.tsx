import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, User, Star, Wand2, Loader2, LogOut } from 'lucide-react';
import BookCard from '@/components/BookCard';
import CategoryFilter from '@/components/CategoryFilter';
import StoryGeneratorDialog from '@/components/StoryGeneratorDialog';
import { categories, useStorybooksStore, type StreamingStory } from '@/data/storybooksData';
import type { StoryPrompt } from '@/components/StoryGeneratorDialog';
import { generateStory } from '@/services/storyGenerator';
import { StreamingStoryGenerator } from '@/services/streamingStoryGenerator';
import { useToast } from '@/components/ui/use-toast';
import { useUserStore } from '@/store/useUserStore';
import { saveStory } from '@/services/storyService';
import { logUserEvent } from '@/services/eventService';

interface GenerationProgress {
  step: string;
  progress: number;
  currentPage?: number;
  totalPages?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useUserStore();
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [collectedBooks, setCollectedBooks] = useState<Set<string>>(new Set());
  const [showGenerator, setShowGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    step: '',
    progress: 0
  });
  const [dialogOpenTime, setDialogOpenTime] = useState<number | null>(null);
  
  const { 
    books, 
    loading,
    addBook,
    loadBooks,
    startStreamingGeneration,
    updateStreamingStory,
    setGenerationProgress: setStoreProgress,
    setGenerating: setStoreGenerating,
    setGenerator
  } = useStorybooksStore();

  // 加载故事列表
  useEffect(() => {
    if (user) {
      loadBooks(user.id);
    }
  }, [user, loadBooks]);

  const filteredBooks = selectedCategory === '全部' 
    ? books
    : books.filter(book => book.category === selectedCategory);

  const handleQuickStart = () => {
    const randomBook = books[Math.floor(Math.random() * books.length)];
    navigate(`/story/${randomBook.id}`);
  };

  const handleReadBook = async (bookId: string) => {
    if (user) {
      await logUserEvent(user.id, 'story_view', { story_id: bookId });
    }
    navigate(`/story/${bookId}`);
  };

  const handleToggleCollect = (bookId: string) => {
    setCollectedBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "已登出",
        description: "您已成功登出",
      });
      navigate('/login');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "登出失败",
        description: error.message || "登出时出现错误",
        variant: "destructive",
      });
    }
  };

  const handleGenerateStory = async (prompt: StoryPrompt) => {
    // 记录模式选择
    if (user && dialogOpenTime) {
      await logUserEvent(user.id, 'generation_mode_select', {
        selected_mode: prompt.streamingMode ? 'streaming' : 'complete',
        selection_time_ms: Date.now() - dialogOpenTime
      });
    }
    
    if (prompt.streamingMode) {
      // 流式生成模式
      await handleStreamingGeneration(prompt);
    } else {
      // 传统生成模式
      await handleTraditionalGeneration(prompt);
    }
  };

  const handleStreamingGeneration = async (prompt: StoryPrompt) => {
    const generationStartTime = Date.now();
    setIsGenerating(true);
    setStoreGenerating(true);
    setGenerationProgress({ step: '正在准备...', progress: 0 });
    
    try {
      // 创建流式生成器
      const generator = new StreamingStoryGenerator({
        onProgress: (progress) => {
          setGenerationProgress({
            step: progress.step,
            progress: progress.progress,
            currentPage: progress.currentPage,
            totalPages: progress.totalPages
          });
          setStoreProgress({
            step: progress.step,
            progress: progress.progress,
            currentPage: progress.currentPage,
            totalPages: progress.totalPages
          });
        },
        onPageReady: (page, pageIndex) => {
          // 页面准备就绪时的处理
          console.log(`Page ${pageIndex + 1} is ready:`, page);
        },
        onComplete: () => {
          setGenerationProgress({ step: '创作完成！', progress: 100 });
          setStoreProgress({ step: '创作完成！', progress: 100, currentPage: 0, totalPages: 0 });
          
          toast({
            title: "故事创作完成！",
            description: "所有插图都已生成完成，享受阅读吧！",
          });
        },
        onError: (error, pageIndex) => {
          console.error(`Error on page ${pageIndex}:`, error);
          toast({
            title: "生成过程中出现问题",
            description: `第${pageIndex + 1}页插图生成失败，但故事内容仍然可用。`,
            variant: "destructive",
          });
        }
      });

      // 开始流式生成
      console.log('[Index] ====== 开始流式生成故事 ======');
      const streamingStory = await generator.generateStory(prompt);
      console.log('[Index] ====== 流式故事生成完成 ======');
      console.log('[Index] streamingStory 对象:', streamingStory);
      console.log('[Index] streamingStory (JSON):', JSON.stringify(streamingStory, null, 2));
      console.log('[Index] streamingStory.pages[0]:', streamingStory.pages[0]);
      console.log('[Index] streamingStory.pages[0].question:', streamingStory.pages[0]?.question);
      console.log('[Index] streamingStory.pages[0].question (JSON):', JSON.stringify(streamingStory.pages[0]?.question, null, 2));
      
      // 保存生成器实例到store
      setGenerator(generator);
      
      // 更新状态管理
      console.log('[Index] ====== 更新 store 中的流式故事 ======');
      updateStreamingStory(streamingStory);
      setStoreGenerating(true);
      console.log('[Index] store 更新完成');
      
      // 保存到 Supabase（如果用户已登录）
      let savedStreamingId: string | null = null;
      if (user) {
        try {
          // 将流式故事转换为普通故事格式保存
          const storyToSave = {
            // 让数据库生成 UUID，不传递前端生成的 id
            title: streamingStory.title,
            cover: streamingStory.cover,
            category: streamingStory.category,
            description: streamingStory.description,
            pages: streamingStory.pages.map((page: any) => ({
              id: page.id,
              background: page.background,
              text: page.text,
              interactiveElements: page.interactiveElements || [],
              question: page.question
            }))
          } as any;
          
          console.log('[Index] ====== 保存故事到数据库 ======');
          console.log('[Index] storyToSave 对象:', storyToSave);
          console.log('[Index] storyToSave.pages[0].question:', storyToSave.pages[0]?.question);
          console.log('[Index] storyToSave.pages[0].question (JSON):', JSON.stringify(storyToSave.pages[0]?.question, null, 2));
          
          const savedStory = await saveStory(storyToSave, user.id);
          savedStreamingId = savedStory.id;
          console.log('[Index] 保存成功，数据库 ID:', savedStreamingId);
          
          // 更新 store 中的流式故事，使用数据库的 ID
          // 这样在 StoryReader 中就能正确匹配了
          const updatedStreamingStory: StreamingStory = {
            ...streamingStory,
            id: savedStory.id
          };
          console.log('[Index] ====== 更新 store 中的流式故事（使用数据库 ID） ======');
          console.log('[Index] updatedStreamingStory 对象:', updatedStreamingStory);
          console.log('[Index] updatedStreamingStory.pages[0].question:', updatedStreamingStory.pages[0]?.question);
          console.log('[Index] updatedStreamingStory.pages[0].question (JSON):', JSON.stringify(updatedStreamingStory.pages[0]?.question, null, 2));
          updateStreamingStory(updatedStreamingStory);
          addBook(updatedStreamingStory);
          console.log('[Index] store 更新完成');
          
          // 计算生成时间
          const generationTime = Date.now() - generationStartTime;
          const firstPageReadyTime = generationTime; // 流式模式下，第一页立即就绪
          
          await logUserEvent(user.id, 'story_generate', {
            story_id: savedStory.id,
            generation_mode: 'streaming',
            prompt: {
              mainCharacter: prompt.mainCharacter,
              mood: prompt.mood,
              setting: prompt.setting,
              theme: prompt.theme,
              additionalElements: prompt.additionalElements
            },
            generation_time_ms: generationTime,
            first_page_ready_time_ms: firstPageReadyTime,
            total_pages: streamingStory.pages.length
          });
        } catch (error) {
          console.error('Error saving streaming story:', error);
          // 不阻止用户继续使用，静默失败
        }
      }
      
      // 立即跳转到阅读页面
      // 优先使用流式故事的原始 ID，这样可以直接从 store 加载
      // 如果保存成功，使用数据库 ID（但 store 中已经更新了）
      setShowGenerator(false);
      navigate(`/story/${savedStreamingId || streamingStory.id}`);
      
      toast({
        title: "故事内容已准备好！",
        description: "插图正在后台生成，你可以立即开始阅读！",
      });
      
    } catch (error) {
      console.error('Streaming generation error:', error);
      toast({
        title: "生成故事失败",
        description: "抱歉，生成故事时出现了问题，请稍后再试。",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTraditionalGeneration = async (prompt: StoryPrompt) => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "生成故事需要登录",
        variant: "destructive",
      });
      return;
    }

    const generationStartTime = Date.now();
    setIsGenerating(true);
    setGenerationProgress({ step: '正在构思故事...', progress: 0 });
    
    try {
      // 1. 生成故事文本
      setGenerationProgress({ step: '正在创作故事内容...', progress: 20 });
      const newStory = await generateStory(prompt);
      
      // 2. 生成封面
      setGenerationProgress({ step: '正在绘制精美封面...', progress: 40 });
      
      // 3. 生成插图
      setGenerationProgress({ step: '正在为故事绘制插图...', progress: 60 });
      
      // 4. 保存到 Supabase
      setGenerationProgress({ step: '正在保存故事...', progress: 80 });
      const savedStory = await saveStory(newStory, user.id);
      
      // 5. 记录事件（增强）
      const generationTime = Date.now() - generationStartTime;
      await logUserEvent(user.id, 'story_generate', {
        story_id: savedStory.id,
        generation_mode: 'complete',
        prompt: {
          mainCharacter: prompt.mainCharacter,
          mood: prompt.mood,
          setting: prompt.setting,
          theme: prompt.theme,
          additionalElements: prompt.additionalElements
        },
        generation_time_ms: generationTime,
        first_page_ready_time_ms: generationTime, // 完整模式下，所有内容生成完成后才就绪
        total_pages: savedStory.pages.length
      });
      
      // 6. 更新本地状态
      addBook(savedStory);
      setShowGenerator(false);
      setGenerationProgress({ step: '创作完成！', progress: 100 });
      
      toast({
        title: "故事生成成功！",
        description: `《${savedStory.title}》已经准备好啦，快来阅读吧！`,
      });
      navigate(`/story/${savedStory.id}`);
    } catch (error: any) {
      console.error('Error generating story:', error);
      toast({
        title: "生成故事失败",
        description: error.message || "抱歉，生成故事时出现了问题，请稍后再试。",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ step: '', progress: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-magical-background font-magical">
      <div className="relative">
        {/* 装饰性星星背景 */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 text-yellow-300 animate-pulse">
            <Star className="h-6 w-6" />
          </div>
          <div className="absolute top-40 right-20 text-pink-300 animate-pulse delay-1000">
            <Star className="h-4 w-4" />
          </div>
          <div className="absolute top-60 left-1/4 text-blue-300 animate-pulse delay-2000">
            <Star className="h-5 w-5" />
          </div>
          <div className="absolute top-80 right-1/3 text-purple-300 animate-pulse delay-3000">
            <Star className="h-3 w-3" />
          </div>
        </div>

        {/* 用户信息栏 - 固定在右上角 */}
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-purple-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">
                {user?.email || '用户'}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="登出"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">登出</span>
            </button>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* 头部 */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                点击阅读故事
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              每个故事都是一次奇妙的冒险，每个点击都带来新的惊喜
            </p>
            
            {/* 快速开始按钮 */}
            <button
              onClick={handleQuickStart}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Sparkles className="h-6 w-6" />
              快速开始阅读
            </button>
          </div>

          {/* 分类筛选 */}
          <div className="mb-8">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {/* 创建故事按钮 */}
          <div className="mb-8 text-center">
            <button
              onClick={() => {
                setDialogOpenTime(Date.now());
                setShowGenerator(true);
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Wand2 className="h-5 w-5" />
              创作专属故事
            </button>
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">加载故事中...</span>
            </div>
          )}

          {/* 故事列表 */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onRead={() => handleReadBook(book.id)}
                  onToggleCollect={() => handleToggleCollect(book.id)}
                  isCollected={collectedBooks.has(book.id)}
                />
              ))}
            </div>
          )}

          {/* 空状态 */}
          {filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                {selectedCategory === '全部' ? '还没有故事' : `没有${selectedCategory}类别的故事`}
              </h3>
              <p className="text-gray-500 mb-6">
                {selectedCategory === '全部' 
                  ? '点击"创作专属故事"开始你的第一个故事吧！'
                  : '尝试其他分类或创作新的故事'
                }
              </p>
              <button
                onClick={() => {
                  setDialogOpenTime(Date.now());
                  setShowGenerator(true);
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200"
              >
                <Wand2 className="h-5 w-5" />
                创作第一个故事
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 故事生成对话框 */}
      <StoryGeneratorDialog
        isOpen={showGenerator}
        onClose={() => {
          setShowGenerator(false);
          setDialogOpenTime(null);
        }}
        onGenerate={handleGenerateStory}
        isGenerating={isGenerating}
        generationProgress={generationProgress}
      />
    </div>
  );
};

export default Index;
