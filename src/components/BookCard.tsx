
import React from 'react';
import { Card } from '@/components/ui/card';
import { Play, Heart } from 'lucide-react';

interface BookCardProps {
  id: string;
  title: string;
  cover: string;
  category: string;
  description: string;
  isCollected?: boolean;
  onRead: () => void;
  onToggleCollect: () => void;
}

const BookCard: React.FC<BookCardProps> = ({
  title,
  cover,
  category,
  description,
  isCollected = false,
  onRead,
  onToggleCollect,
}) => {
  return (
    <Card className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="relative">
        <div className="aspect-[4/5] bg-gradient-to-br from-orange-200 via-pink-200 to-purple-200 flex items-center justify-center text-6xl">
          {cover}
        </div>
        
        <button
          onClick={onToggleCollect}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isCollected 
              ? 'bg-red-100 text-red-500' 
              : 'bg-white/80 text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <span className="inline-block px-3 py-1 bg-yellow-200 text-yellow-800 text-sm rounded-full font-medium">
            {category}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
          {title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {description}
        </p>
        
        <button
          onClick={onRead}
          className="w-full bg-gradient-to-r from-orange-400 to-pink-400 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 hover:from-orange-500 hover:to-pink-500 transition-all duration-200 shadow-lg"
        >
          <Play className="w-5 h-5" />
          开始阅读
        </button>
      </div>
    </Card>
  );
};

export default BookCard;
