import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, CheckCircle } from 'lucide-react';
import WordCard from './WordCard';
import type { InteractiveElement as InteractiveElementType } from '@/data/storybooksData';

interface InteractiveElementProps {
  element: InteractiveElementType;
  onInteraction: (reward: string) => void;
  isInteracted: boolean;
}

const InteractiveElement: React.FC<InteractiveElementProps> = ({
  element,
  onInteraction,
  isInteracted,
}) => {
  const [clicked, setClicked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showWordCard, setShowWordCard] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // 3秒后隐藏提示动画
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (!clicked && !isInteracted) {
      setClicked(true);
      
      // 如果有词汇信息，显示单词卡片
      if (element.vocabulary) {
        setShowWordCard(true);
      }
      
      // 显示奖励信息
      if (element.reward) {
        onInteraction(element.reward);
      }
      
      setShowHint(false);
      
      // 如果没有词汇卡片，3秒后重置点击状态
      if (!element.vocabulary) {
        setTimeout(() => setClicked(false), 1500);
      }
    }
  };

  const handleCloseWordCard = () => {
    setShowWordCard(false);
    setTimeout(() => setClicked(false), 300);
  };

  // 如果有词汇信息，显示英文单词
  const hasVocabulary = !!element.vocabulary;

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isInteracted}
        className={`
          absolute z-20 transition-all duration-300 transform
          ${clicked 
            ? 'scale-150 animate-bounce' 
            : isHovered 
              ? 'scale-125' 
              : 'scale-100'
          }
          ${isInteracted 
            ? 'opacity-40 cursor-default' 
            : 'opacity-90 hover:opacity-100 cursor-pointer'
          }
          ${showHint && !isInteracted ? 'animate-pulse' : ''}
        `}
        style={{ 
          left: `${element.x}%`, 
          top: `${element.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="relative">
          {/* 半透明圆形背景 */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-full -m-3 shadow-lg"></div>
          
          {/* Emoji */}
          <div className="relative text-3xl drop-shadow-lg">
            {element.emoji}
          </div>
          
          {/* 如果有词汇，显示英文单词标签 */}
          {hasVocabulary && !isInteracted && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                {element.vocabulary.english}
              </div>
            </div>
          )}
          
          {/* 点击时的特效 */}
          {clicked && (
            <div className="absolute -top-3 -right-3">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />
            </div>
          )}
          
          {/* 悬停提示 */}
          {isHovered && !clicked && !isInteracted && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                点击学习
              </div>
            </div>
          )}
          
          {/* 已学习标记 */}
          {isInteracted && (
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </button>

      {/* 单词学习卡片（点击后显示） */}
      {showWordCard && hasVocabulary && element.vocabulary && (
        <WordCard
          vocabulary={element.vocabulary}
          onClose={handleCloseWordCard}
          position={{ x: element.x, y: element.y }}
        />
      )}
    </>
  );
};

export default InteractiveElement;
