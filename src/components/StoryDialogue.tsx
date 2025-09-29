import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, MessageCircle, User, Bot } from 'lucide-react';

interface DialogueMessage {
  id: string;
  speaker: 'character' | 'narrator' | 'user';
  text: string;
  emoji?: string;
  delay?: number;
}

interface StoryDialogueProps {
  messages: DialogueMessage[];
  onComplete?: () => void;
  autoPlay?: boolean;
}

const StoryDialogue: React.FC<StoryDialogueProps> = ({
  messages,
  onComplete,
  autoPlay = true
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<DialogueMessage[]>([]);

  useEffect(() => {
    if (autoPlay && messages.length > 0) {
      const timer = setTimeout(() => {
        if (currentMessageIndex < messages.length) {
          setIsTyping(true);
          
          setTimeout(() => {
            setDisplayedMessages(prev => [...prev, messages[currentMessageIndex]]);
            setIsTyping(false);
            setCurrentMessageIndex(prev => prev + 1);
          }, 500);
        } else if (onComplete) {
          onComplete();
        }
      }, messages[currentMessageIndex]?.delay || 1000);

      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex, messages, autoPlay, onComplete]);

  const handleNextMessage = () => {
    if (currentMessageIndex < messages.length) {
      setIsTyping(true);
      
      setTimeout(() => {
        setDisplayedMessages(prev => [...prev, messages[currentMessageIndex]]);
        setIsTyping(false);
        setCurrentMessageIndex(prev => prev + 1);
      }, 300);
    } else if (onComplete) {
      onComplete();
    }
  };

  const getSpeakerIcon = (speaker: string) => {
    switch (speaker) {
      case 'character':
        return <Bot className="h-5 w-5 text-blue-500" />;
      case 'user':
        return <User className="h-5 w-5 text-green-500" />;
      default:
        return <MessageCircle className="h-5 w-5 text-purple-500" />;
    }
  };

  const getSpeakerName = (speaker: string) => {
    switch (speaker) {
      case 'character':
        return '故事角色';
      case 'user':
        return '你';
      default:
        return '旁白';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 shadow-inner border-2 border-blue-200">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            故事对话
            <Sparkles className="h-5 w-5 text-blue-500" />
          </h3>
        </div>

        {/* 对话消息列表 */}
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {displayedMessages.map((message, index) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 p-4 rounded-xl transition-all duration-500 ${
                message.speaker === 'user'
                  ? 'bg-green-100 border-l-4 border-green-400 ml-8'
                  : message.speaker === 'character'
                  ? 'bg-blue-100 border-l-4 border-blue-400 mr-8'
                  : 'bg-purple-100 border-l-4 border-purple-400'
              }`}
              style={{
                animation: 'slideInUp 0.5s ease-out',
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="flex-shrink-0">
                {getSpeakerIcon(message.speaker)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-600">
                    {getSpeakerName(message.speaker)}
                  </span>
                  {message.emoji && (
                    <span className="text-lg">{message.emoji}</span>
                  )}
                </div>
                <p className="text-gray-800 leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))}

          {/* 正在输入指示器 */}
          {isTyping && (
            <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-xl mr-8">
              <Bot className="h-5 w-5 text-blue-500 animate-pulse" />
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="flex justify-center mt-4">
          {currentMessageIndex < messages.length && (
            <button
              onClick={handleNextMessage}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              继续对话
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default StoryDialogue;
