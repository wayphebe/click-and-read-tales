
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface InteractiveElementProps {
  emoji: string;
  x: number;
  y: number;
  sound?: string;
  animation?: string;
  onInteract: () => void;
}

const InteractiveElement: React.FC<InteractiveElementProps> = ({
  emoji,
  x,
  y,
  onInteract,
}) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (!clicked) {
      setClicked(true);
      onInteract();
      
      // Reset animation after a delay
      setTimeout(() => setClicked(false), 1000);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`absolute text-4xl transition-all duration-300 hover:scale-125 ${
        clicked ? 'animate-bounce scale-150' : ''
      }`}
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {emoji}
      {clicked && (
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-spin" />
      )}
    </button>
  );
};

export default InteractiveElement;
