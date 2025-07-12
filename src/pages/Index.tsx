
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, User, Star, Wand2 } from 'lucide-react';
import BookCard from '@/components/BookCard';
import CategoryFilter from '@/components/CategoryFilter';
import StoryGeneratorDialog from '@/components/StoryGeneratorDialog';
import { categories, useStorybooksStore } from '@/data/storybooksData';
import type { StoryPrompt } from '@/components/StoryGeneratorDialog';
import { generateStory } from '@/services/storyGenerator';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [collectedBooks, setCollectedBooks] = useState<Set<string>>(new Set());
  const [showGenerator, setShowGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { books, addBook } = useStorybooksStore();

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
    setIsGenerating(true);
    try {
      const newStory = await generateStory(prompt);
      addBook(newStory);
      setShowGenerator(false);
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
    }
  };

  return (
    <div className="min-h-screen bg-magical-background font-magical">
      <div className="relative">
        {/* 装饰性星星背景 */}
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <span
              key={i}
              className="absolute text-magical-secondary/20 animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                fontSize: `${Math.random() * 1 + 0.5}rem`,
              }}
            >
              ✦
            </span>
          ))}
        </div>

        {/* 主要内容 */}
        <div className="relative">
          {/* 顶部导航 */}
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-magical-primary" />
                <h1 className="text-3xl font-bold text-magical-primary">魔法绘本世界</h1>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                  <Star className="w-5 h-5 text-magical-secondary" />
                  <span className="font-medium text-magical-primary">收集了 {collectedBooks.size} 本绘本</span>
                </div>
                
                <button className="bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white/90 transition-all duration-200 shadow-sm">
                  <User className="w-6 h-6 text-magical-primary" />
                </button>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            {/* 快速开始区域 */}
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-magical-primary mb-4">
                准备好开始阅读冒险了吗？
              </h2>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleQuickStart}
                  className="bg-white/80 backdrop-blur-sm text-magical-primary font-bold text-xl px-12 py-4 rounded-magical hover:shadow-magical transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    立即开始神奇冒险
                    <Sparkles className="w-6 h-6" />
                  </div>
                </button>

                <button
                  onClick={() => setShowGenerator(true)}
                  disabled={isGenerating}
                  className={`bg-white/80 backdrop-blur-sm text-magical-primary font-bold text-xl px-12 py-4 rounded-magical transition-all duration-300 shadow-magical transform hover:scale-105 ${
                    isGenerating 
                      ? 'opacity-70 cursor-not-allowed'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wand2 className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? '正在创作中...' : '创作专属故事'}
                    <Wand2 className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />
                  </div>
                </button>
              </div>
            </div>

            {/* 分类过滤器 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-magical-primary mb-4">选择你喜欢的故事类型</h3>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>

            {/* 绘本网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  cover={book.cover}
                  category={book.category}
                  description={book.description}
                  isCollected={collectedBooks.has(book.id)}
                  onRead={() => handleReadBook(book.id)}
                  onToggleCollect={() => handleToggleCollect(book.id)}
                />
              ))}
            </div>

            {/* 空状态 */}
            {filteredBooks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✦</div>
                <p className="text-xl text-magical-text">
                  这个分类下还没有绘本，请选择其他分类
                </p>
              </div>
            )}

            {/* 故事生成器对话框 */}
            <StoryGeneratorDialog
              isOpen={showGenerator}
              onClose={() => setShowGenerator(false)}
              onGenerate={handleGenerateStory}
            />
          </div>

          {/* 页脚 */}
          <div className="container mx-auto px-4 py-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-magical-secondary" />
              <span className="font-medium text-magical-primary">为5-12岁儿童精心设计</span>
              <Star className="w-5 h-5 text-magical-secondary" />
            </div>
            <p className="text-magical-primary/80">
              在阅读中发现世界，在互动中成长快乐
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
