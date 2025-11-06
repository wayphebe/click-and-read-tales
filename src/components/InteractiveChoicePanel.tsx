import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export interface ChoiceOption {
  id: 'A' | 'B';
  text: string;
  emoji: string;
}

interface InteractiveChoicePanelProps {
  question: string;
  optionA: ChoiceOption;
  optionB: ChoiceOption;
  onSelect: (choice: 'A' | 'B') => void;
  selectedChoice?: 'A' | 'B' | null;
}

const InteractiveChoicePanel: React.FC<InteractiveChoicePanelProps> = ({
  question,
  optionA,
  optionB,
  onSelect,
  selectedChoice,
}) => {
  const handleChoice = (choice: 'A' | 'B') => {
    if (!selectedChoice) {
      onSelect(choice);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border-2 border-purple-200">
      {/* 问题标题 */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          {question}
          <Sparkles className="h-5 w-5 text-purple-500" />
        </h3>
        <p className="text-sm text-gray-500">选择你的路径，故事会因你而改变！</p>
      </div>

      {/* 两个选项 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 选项 A */}
        <button
          onClick={() => handleChoice('A')}
          disabled={!!selectedChoice}
          className={`
            relative p-6 rounded-xl transition-all duration-300 transform
            ${selectedChoice === 'A'
              ? 'bg-blue-100 border-2 border-blue-400 shadow-lg scale-105'
              : selectedChoice === 'B'
              ? 'opacity-50 bg-white border-2 border-gray-200'
              : 'bg-white border-2 border-blue-200 hover:border-blue-400 hover:shadow-md hover:scale-102'
            }
            ${!selectedChoice ? 'cursor-pointer' : 'cursor-default'}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">{optionA.emoji}</div>
            <div className="flex-1 text-left">
              <div className="font-bold text-blue-600 mb-1">选项 A</div>
              <div className="font-medium text-gray-800">{optionA.text}</div>
            </div>
            {selectedChoice === 'A' && (
              <ArrowRight className="h-5 w-5 text-blue-500" />
            )}
          </div>
        </button>

        {/* 选项 B */}
        <button
          onClick={() => handleChoice('B')}
          disabled={!!selectedChoice}
          className={`
            relative p-6 rounded-xl transition-all duration-300 transform
            ${selectedChoice === 'B'
              ? 'bg-pink-100 border-2 border-pink-400 shadow-lg scale-105'
              : selectedChoice === 'A'
              ? 'opacity-50 bg-white border-2 border-gray-200'
              : 'bg-white border-2 border-pink-200 hover:border-pink-400 hover:shadow-md hover:scale-102'
            }
            ${!selectedChoice ? 'cursor-pointer' : 'cursor-default'}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">{optionB.emoji}</div>
            <div className="flex-1 text-left">
              <div className="font-bold text-pink-600 mb-1">选项 B</div>
              <div className="font-medium text-gray-800">{optionB.text}</div>
            </div>
            {selectedChoice === 'B' && (
              <ArrowRight className="h-5 w-5 text-pink-500" />
            )}
          </div>
        </button>
      </div>

      {/* 选择提示 */}
      {!selectedChoice && (
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            你的选择将决定故事的走向
            <Sparkles className="w-3 h-3 text-purple-400" />
          </p>
        </div>
      )}
    </div>
  );
};

export default InteractiveChoicePanel;

