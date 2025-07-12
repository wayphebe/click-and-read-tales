
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { storybooks } from '@/data/storybooksData';
import InteractiveElement from '@/components/InteractiveElement';
import AudioPlayer from '@/components/AudioPlayer';
import RewardModal from '@/components/RewardModal';

const StoryReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [interactedElements, setInteractedElements] = useState<Set<string>>(new Set());

  const storybook = storybooks.find(book => book.id === id);

  useEffect(() => {
    if (!storybook) {
      navigate('/');
      return;
    }
  }, [storybook, navigate]);

  if (!storybook) {
    return null;
  }

  const currentPage = storybook.pages[currentPageIndex];
  const isLastPage = currentPageIndex === storybook.pages.length - 1;
  const isFirstPage = currentPageIndex === 0;

  const handleInteraction = (elementId: string, reward: string) => {
    if (!interactedElements.has(elementId)) {
      setInteractedElements(prev => new Set([...prev, elementId]));
      setRewardMessage(reward);
      setShowReward(true);
    }
  };

  const handleNextPage = () => {
    if (!isLastPage) {
      setCurrentPageIndex(prev => prev + 1);
      setInteractedElements(new Set());
    } else {
      navigate('/');
    }
  };

  const handlePrevPage = () => {
    if (!isFirstPage) {
      setCurrentPageIndex(prev => prev - 1);
      setInteractedElements(new Set());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-purple-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg hover:bg-white transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">返回</span>
        </button>

        <div className="text-lg font-bold text-gray-700">
          {storybook.title}
        </div>

        <AudioPlayer 
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
        />
      </div>

      {/* Story Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-4xl aspect-[4/3] bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Background Scene */}
          <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">
            {currentPage.background}
          </div>

          {/* Interactive Elements */}
          {currentPage.interactiveElements.map((element) => (
            <InteractiveElement
              key={element.id}
              emoji={element.emoji}
              x={element.x}
              y={element.y}
              onInteract={() => handleInteraction(element.id, element.reward || '太棒了！')}
            />
          ))}

          {/* Story Text */}
          <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <p className="text-xl leading-relaxed text-gray-800 font-medium">
              {currentPage.text}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between w-full max-w-4xl mt-6">
          <button
            onClick={handlePrevPage}
            disabled={isFirstPage}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-200 ${
              isFirstPage
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            上一页
          </button>

          <div className="flex gap-2">
            {storybook.pages.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentPageIndex
                    ? 'bg-gradient-to-r from-blue-400 to-purple-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextPage}
            className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-blue-400 text-white font-bold px-6 py-3 rounded-2xl hover:from-green-500 hover:to-blue-500 transition-all duration-200 shadow-lg"
          >
            {isLastPage ? '完成阅读' : '下一页'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reward Modal */}
      <RewardModal
        isOpen={showReward}
        onClose={() => setShowReward(false)}
        rewardType="star"
        message={rewardMessage}
      />
    </div>
  );
};

export default StoryReader;
