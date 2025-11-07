import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, User, Star, Wand2 } from 'lucide-react';
import BookCard from '@/components/BookCard';
import CategoryFilter from '@/components/CategoryFilter';
import StoryGeneratorDialog from '@/components/StoryGeneratorDialog';
import Navbar from '@/components/Navbar';
import { categories, useStorybooksStore, type StreamingStory } from '@/data/storybooksData';
import type { StoryPrompt } from '@/components/StoryGeneratorDialog';
import { generateStory } from '@/services/storyGenerator';
import { StreamingStoryGenerator } from '@/services/streamingStoryGenerator';
import { useToast } from '@/components/ui/use-toast';

interface GenerationProgress {
  step: string;
  progress: number;
  currentPage?: number;
  totalPages?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [collectedBooks, setCollectedBooks] = useState<Set<string>>(new Set());
  const [showGenerator, setShowGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    step: '',
    progress: 0
  });
  
  const { 
    books, 
    addBook, 
    startStreamingGeneration,
    updateStreamingStory,
    setGenerationProgress: setStoreProgress,
    setGenerating: setStoreGenerating,
    setGenerator
  } = useStorybooksStore();

  const filteredBooks = selectedCategory === '全部' 
    ? books
    : books.filter(book => book.category === selectedCategory);

  const handleQuickStart = () => {
    const randomBook = books[Math.floor(Math.random() * books.length)];
    navigate(`/story/${randomBook.id}`);
  };

  const handleReadBook = (bookId: string) => {
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

  const handleGenerateStory = async (prompt: StoryPrompt) => {
    if (prompt.streamingMode) {
      // 流式生成模式
      await handleStreamingGeneration(prompt);
    } else {
      // 传统生成模式
      await handleTraditionalGeneration(prompt);
    }
  };

  const handleStreamingGeneration = async (prompt: StoryPrompt) => {
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
      const streamingStory = await generator.generateStory(prompt);
      
      // 保存生成器实例到store
      setGenerator(generator);
      
      // 更新状态管理
      updateStreamingStory(streamingStory);
      setStoreGenerating(true);
      
      // 立即跳转到阅读页面
      setShowGenerator(false);
      navigate(`/story/${streamingStory.id}`);
      
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
      
      // 4. 最终处理
      setGenerationProgress({ step: '正在完成最后的润色...', progress: 80 });
      
      addBook(newStory);
      setShowGenerator(false);
      setGenerationProgress({ step: '创作完成！', progress: 100 });
      
      toast({
        title: "故事生成成功！",
        description: `《${newStory.title}》已经准备好啦，快来阅读吧！`,
      });
      navigate(`/story/${newStory.id}`);
    } catch (error) {
      toast({
        title: "生成故事失败",
        description: "抱歉，生成故事时出现了问题，请稍后再试。",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ step: '', progress: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-magical-background font-magical">
      {/* 导航栏 */}
      <Navbar />
      
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
              onClick={() => setShowGenerator(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Wand2 className="h-5 w-5" />
              创作专属故事
            </button>
          </div>

          {/* 故事列表 */}
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
                onClick={() => setShowGenerator(true)}
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
        onClose={() => setShowGenerator(false)}
        onGenerate={handleGenerateStory}
        isGenerating={isGenerating}
        generationProgress={generationProgress}
      />
    </div>
  );
};

export default Index;
