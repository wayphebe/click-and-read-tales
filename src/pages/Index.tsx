
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, User, Star } from 'lucide-react';
import BookCard from '@/components/BookCard';
import CategoryFilter from '@/components/CategoryFilter';
import { storybooks, categories } from '@/data/storybooksData';

const Index = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [collectedBooks, setCollectedBooks] = useState<Set<string>>(new Set());

  const filteredBooks = selectedCategory === '全部' 
    ? storybooks 
    : storybooks.filter(book => book.category === selectedCategory);

  const handleQuickStart = () => {
    const randomBook = storybooks[Math.floor(Math.random() * storybooks.length)];
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-orange-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              <h1 className="text-3xl font-bold">魔法绘本世界</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Star className="w-5 h-5" />
                <span className="font-medium">收集了 {collectedBooks.size} 本绘本</span>
              </div>
              
              <button className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-all duration-200">
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Start Section */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            准备好开始阅读冒险了吗？
          </h2>
          
          <button
            onClick={handleQuickStart}
            className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 text-white font-bold text-xl px-12 py-4 rounded-full hover:from-orange-500 hover:via-red-500 hover:to-pink-500 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              立即开始神奇冒险
              <Sparkles className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">选择你喜欢的故事类型</h3>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Books Grid */}
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

        {/* Empty State */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😔</div>
            <p className="text-xl text-gray-600">
              这个分类下还没有绘本，请选择其他分类
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white text-center py-8 mt-16">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="w-5 h-5 fill-current" />
          <span className="font-medium">为5-12岁儿童精心设计</span>
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <p className="text-white/80">
          在阅读中发现世界，在互动中成长快乐
        </p>
      </div>
    </div>
  );
};

export default Index;
