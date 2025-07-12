
import React from 'react';
import { Card } from '@/components/ui/card';
import { Heart, Play } from 'lucide-react';

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
    <Card className="group relative overflow-hidden rounded-magical shadow-magical hover:shadow-lg transition-all duration-300 transform hover:scale-105 bg-white border-2 border-magical-primary/10">
      <div className="relative">
        <div className="aspect-[4/5] bg-gradient-magical flex items-center justify-center text-6xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="absolute text-magical-secondary animate-twinkle"
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
          <span className="relative z-10 text-white animate-float">{cover}</span>
        </div>
        
        <button
          onClick={onToggleCollect}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isCollected 
              ? 'bg-magical-secondary/20 text-magical-secondary' 
              : 'bg-white/80 text-magical-primary/50 hover:text-magical-secondary'
          }`}
        >
          <Heart className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <span className="inline-block px-3 py-1 bg-magical-secondary/10 text-magical-primary text-sm rounded-full font-medium">
            {category}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-magical-primary mb-2 line-clamp-2">
          {title}
        </h3>
        
        <p className="text-magical-text/80 text-sm mb-4 line-clamp-2">
          {description}
        </p>
        
        <button
          onClick={onRead}
          className="w-full bg-gradient-magical text-white font-bold py-3 px-6 rounded-magical flex items-center justify-center gap-2 hover:shadow-magical transition-all duration-200"
        >
          <Play className="w-5 h-5" />
          开始阅读
        </button>
      </div>
    </Card>
  );
};

export default BookCard;
