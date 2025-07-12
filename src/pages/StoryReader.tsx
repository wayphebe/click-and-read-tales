
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Trophy, Star } from 'lucide-react';
import { useStorybooksStore } from '@/data/storybooksData';
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
  const [showFinalReward, setShowFinalReward] = useState(false);
  const [storyCompleted, setStoryCompleted] = useState(false);

  const { getBook } = useStorybooksStore();
  const storybook = getBook(id || '');

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
  const totalPages = storybook.pages.length;
  const progress = ((currentPageIndex + 1) / totalPages) * 100;

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
      // 故事结束，显示最终奖励
      if (!storyCompleted) {
        setStoryCompleted(true);
        setRewardMessage(`恭喜你完成了《${storybook.title}》的完整故事！`);
        setShowFinalReward(true);
      } else {
        navigate('/');
      }
    }
  };

  const handlePrevPage = () => {
    if (!isFirstPage) {
      setCurrentPageIndex(prev => prev - 1);
      setInteractedElements(new Set());
    }
  };

  const handleFinalRewardClose = () => {
    setShowFinalReward(false);
    // 可以选择留在当前页或返回首页
  };

  return (
    <div className="min-h-screen bg-magical-background font-magical">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-white rounded-magical px-4 py-2 shadow-magical hover:shadow-lg transition-all duration-200 text-magical-primary border-2 border-magical-primary/10"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">返回</span>
        </button>

        <div className="flex flex-col items-center">
          <div className="text-lg font-bold text-magical-primary mb-1">
            {storybook.title}
          </div>
          <div className="text-sm text-magical-text/80">
            第 {currentPageIndex + 1} 页 / {totalPages} 页
          </div>
        </div>

        <AudioPlayer 
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
        />
      </div>

      {/* Progress Bar */}
      <div className="px-4 mb-4">
        <div className="w-full bg-magical-primary/5 rounded-full h-2">
          <div 
            className="bg-gradient-magical h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Story Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-4xl aspect-[4/3] bg-white rounded-magical shadow-magical p-8 border-2 border-magical-primary/10">
          {/* Background Scene */}
          <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">
            {[...Array(10)].map((_, i) => (
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
            <span className="relative z-10">{currentPage.background}</span>
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
          <div className="absolute bottom-8 left-8 right-8 bg-white rounded-magical p-6 shadow-magical border-2 border-magical-primary/10">
            <p className="text-xl leading-relaxed text-magical-text">
              {currentPage.text}
            </p>
          </div>

          {/* Final Story Completion Badge */}
          {isLastPage && storyCompleted && (
            <div className="absolute top-8 right-8 bg-gradient-warm text-magical-primary rounded-full p-3 shadow-magical animate-float">
              <Trophy className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between w-full max-w-4xl mt-6">
          <button
            onClick={handlePrevPage}
            disabled={isFirstPage}
            className={`flex items-center gap-2 px-6 py-3 rounded-magical font-bold transition-all duration-200 ${
              isFirstPage
                ? 'bg-magical-primary/10 text-magical-primary/40 cursor-not-allowed'
                : 'bg-gradient-magical text-white hover:shadow-magical'
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
                    ? 'bg-gradient-magical'
                    : index < currentPageIndex
                    ? 'bg-magical-accent'
                    : 'bg-magical-primary/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextPage}
            className="flex items-center gap-2 bg-gradient-magical text-white font-bold px-6 py-3 rounded-magical hover:shadow-magical transition-all duration-200"
          >
            {isLastPage ? (storyCompleted ? '返回首页' : '完成故事') : '下一页'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Interactive Reward Modal */}
      <RewardModal
        isOpen={showReward}
        onClose={() => setShowReward(false)}
        rewardType="star"
        message={rewardMessage}
      />

      {/* Final Story Completion Modal */}
      <RewardModal
        isOpen={showFinalReward}
        onClose={handleFinalRewardClose}
        rewardType="trophy"
        message={rewardMessage}
      />
    </div>
  );
};

export default StoryReader;
