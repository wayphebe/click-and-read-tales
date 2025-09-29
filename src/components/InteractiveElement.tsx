import React, { useState } from 'react';
import { Sparkles, Heart, CheckCircle } from 'lucide-react';

interface InteractiveElementProps {
  element: {
    id: string;
    emoji: string;
    x: number;
    y: number;
    reward: string;
  };
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

  const handleClick = () => {
    if (!clicked && !isInteracted) {
      setClicked(true);
      onInteraction(element.reward);
      
      // Reset animation after a delay
      setTimeout(() => setClicked(false), 1500);
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isInteracted}
      className={`absolute text-4xl transition-all duration-300 transform ${
        clicked 
          ? 'animate-bounce scale-150' 
          : isHovered 
            ? 'scale-125 hover:scale-125' 
            : 'hover:scale-110'
      } ${
        isInteracted 
          ? 'opacity-60 cursor-not-allowed' 
          : 'cursor-pointer hover:drop-shadow-lg'
      }`}
      style={{ 
        left: `${element.x}%`, 
        top: `${element.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* 表情符号 */}
      <div className="relative">
        {element.emoji}
        
        {/* 点击时的特效 */}
        {clicked && (
          <div className="absolute -top-3 -right-3">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />
          </div>
        )}
        
        {/* 悬停时的特效 */}
        {isHovered && !clicked && !isInteracted && (
          <div className="absolute -top-2 -right-2">
            <Heart className="w-4 h-4 text-pink-400 animate-pulse" />
          </div>
        )}
        
        {/* 已交互状态 */}
        {isInteracted && (
          <div className="absolute -top-2 -right-2">
            <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
};

export default InteractiveElement;
