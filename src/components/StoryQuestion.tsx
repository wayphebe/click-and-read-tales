import React, { useState } from 'react';
import { Sparkles, Heart, CheckCircle } from 'lucide-react';

interface QuestionOption {
  id: string;
  text: string;
  emoji: string;
  isCorrect?: boolean;
  feedback: string;
}

interface StoryQuestionProps {
  question: string;
  options: QuestionOption[];
  onAnswer: (option: QuestionOption) => void;
  selectedAnswer?: string | null;
}

const StoryQuestion: React.FC<StoryQuestionProps> = ({
  question,
  options,
  onAnswer,
  selectedAnswer,
}) => {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleOptionClick = (option: QuestionOption) => {
    if (!selectedAnswer) {
      onAnswer(option);
    }
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 rounded-2xl p-6 shadow-inner border-2 border-yellow-200">
      {/* 问题标题 */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          {question}
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </h3>
      </div>

      {/* 选项网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const isHovered = hoveredOption === option.id;
          const isCorrect = option.isCorrect;
          const showFeedback = selectedAnswer && isSelected;

          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setHoveredOption(option.id)}
              onMouseLeave={() => setHoveredOption(null)}
              disabled={!!selectedAnswer}
              className={`
                relative p-4 rounded-xl transition-all duration-300 transform
                ${isSelected
                  ? isCorrect
                    ? 'bg-green-100 border-2 border-green-400 shadow-lg scale-105'
                    : 'bg-red-100 border-2 border-red-400 shadow-lg scale-105'
                  : isHovered && !selectedAnswer
                    ? 'bg-pink-100 border-2 border-pink-300 shadow-md scale-102'
                    : 'bg-white border-2 border-yellow-200 hover:border-pink-300'
                }
                ${selectedAnswer && !isSelected ? 'opacity-50' : ''}
                ${!selectedAnswer ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
              `}
            >
              {/* 选项内容 */}
              <div className="flex items-center gap-4">
                <div className="text-3xl">{option.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="text-lg font-semibold text-gray-800">{option.text}</div>
                  {showFeedback && (
                    <div className={`text-sm mt-2 font-medium ${
                      isCorrect ? 'text-green-600' : 'text-pink-600'
                    }`}>
                      {option.feedback}
                    </div>
                  )}
                </div>
              </div>

              {/* 状态指示器 */}
              <div className="absolute top-2 right-2">
                {isSelected ? (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isCorrect ? 'bg-green-400' : 'bg-red-400'
                  }`}>
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                ) : isHovered && !selectedAnswer ? (
                  <Heart className="w-5 h-5 text-pink-400 animate-pulse" />
                ) : null}
              </div>

              {/* 悬停特效 */}
              {isHovered && !selectedAnswer && (
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                </div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default StoryQuestion;
