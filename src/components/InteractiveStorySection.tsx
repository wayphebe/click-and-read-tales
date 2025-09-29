import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, MessageCircle, CheckCircle, Star } from 'lucide-react';
import StoryQuestion from './StoryQuestion';
import StoryDialogue from './StoryDialogue';
import InteractiveElement from './InteractiveElement';
import type { QuestionOption } from '@/data/storybooksData';

interface InteractiveStorySectionProps {
  page: {
    id: string;
    text: string;
    interactiveElements: any[];
    question?: {
      id: string;
      question: string;
      options: QuestionOption[];
    };
  };
  onInteraction: (elementId: string, reward: string) => void;
  onAnswer: (option: QuestionOption) => void;
  interactedElements: Set<string>;
  selectedAnswers: { [pageId: string]: string };
  showDialogue?: boolean;
  dialogueMessages?: any[];
}

const InteractiveStorySection: React.FC<InteractiveStorySectionProps> = ({
  page,
  onInteraction,
  onAnswer,
  interactedElements,
  selectedAnswers,
  showDialogue = false,
  dialogueMessages = []
}) => {
  const [activeSection, setActiveSection] = useState<'elements' | 'question' | 'dialogue'>('elements');
  const [showReward, setShowReward] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');

  const handleElementInteraction = (elementId: string, reward: string) => {
    onInteraction(elementId, reward);
    setRewardMessage(reward);
    setShowReward(true);
    setTimeout(() => setShowReward(false), 2000);
  };

  const handleQuestionAnswer = (option: QuestionOption) => {
    onAnswer(option);
    setRewardMessage(option.feedback);
    setShowReward(true);
    setTimeout(() => setRewardMessage(''), 3000);
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'elements':
        return <Sparkles className="h-5 w-5 text-yellow-500" />;
      case 'question':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'dialogue':
        return <Heart className="h-5 w-5 text-pink-500" />;
      default:
        return <Star className="h-5 w-5 text-purple-500" />;
    }
  };

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'elements':
        return '点击发现惊喜';
      case 'question':
        return '回答问题';
      case 'dialogue':
        return '故事对话';
      default:
        return '互动区域';
    }
  };

  return (
    <div className="space-y-6">
      {/* 交互模式选择器 */}
      <div className="flex justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg border border-pink-200">
          <div className="flex gap-2">
            {[
              { key: 'elements', label: '探索', icon: '✨' },
              { key: 'question', label: '问答', icon: '❓' },
              ...(showDialogue ? [{ key: 'dialogue', label: '对话', icon: '💬' }] : [])
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeSection === key
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-pink-100'
                }`}
              >
                <span className="mr-2">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 交互元素区域 */}
      {activeSection === 'elements' && (
        <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 rounded-2xl p-6 shadow-inner border-2 border-yellow-200">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2">
              {getSectionIcon('elements')}
              {getSectionTitle('elements')}
              {getSectionIcon('elements')}
            </h3>
            <p className="text-sm text-gray-500">点击下面的元素，看看会发生什么魔法！</p>
          </div>
          
          <div className="relative h-40 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl shadow-inner border-2 border-yellow-200 overflow-hidden">
            {/* 装饰性背景图案 */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-8 h-8 bg-yellow-300 rounded-full"></div>
              <div className="absolute top-8 right-8 w-6 h-6 bg-orange-300 rounded-full"></div>
              <div className="absolute bottom-6 left-8 w-4 h-4 bg-pink-300 rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-10 h-10 bg-purple-300 rounded-full"></div>
            </div>
            
            {/* 交互元素 */}
            {page.interactiveElements.map((element) => (
              <InteractiveElement
                key={element.id}
                element={element}
                onInteraction={handleElementInteraction}
                isInteracted={interactedElements.has(element.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 选择题区域 */}
      {activeSection === 'question' && page.question && (
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 shadow-inner border-2 border-blue-200">
          <StoryQuestion
            question={page.question.question}
            options={page.question.options}
            onAnswer={handleQuestionAnswer}
            selectedAnswer={selectedAnswers[page.id]}
          />
        </div>
      )}

      {/* 对话区域 */}
      {activeSection === 'dialogue' && showDialogue && (
        <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-2xl p-6 shadow-inner border-2 border-green-200">
          <StoryDialogue
            messages={dialogueMessages}
            autoPlay={true}
          />
        </div>
      )}

      {/* 奖励提示 */}
      {showReward && rewardMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-2xl z-50 border border-pink-200 max-w-sm">
          <div className="text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-lg font-medium text-gray-800">{rewardMessage}</p>
          </div>
        </div>
      )}

      {/* 进度指示器 */}
      <div className="flex justify-center">
        <div className="flex gap-2">
          {['elements', 'question', ...(showDialogue ? ['dialogue'] : [])].map((section, index) => (
            <div
              key={section}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeSection === section
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 scale-125'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractiveStorySection;
