import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Trophy, Star, Loader2, Heart, Sparkles } from 'lucide-react';
import { useStorybooksStore, type StreamingStory, type StreamingPage, type QuestionOption } from '@/data/storybooksData';
import InteractiveElement from '@/components/InteractiveElement';
import StoryQuestion from '@/components/StoryQuestion';
import AudioPlayer from '@/components/AudioPlayer';
import RewardModal from '@/components/RewardModal';
import Navbar from '@/components/Navbar';
import { useToast } from '@/components/ui/use-toast';

const StoryReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [interactedElements, setInteractedElements] = useState<Set<string>>(new Set());
  const [showFinalReward, setShowFinalReward] = useState(false);
  const [storyCompleted, setStoryCompleted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [pageId: string]: string }>({});
  const [isGeneratingNextPage, setIsGeneratingNextPage] = useState(false);

  const { getBook, currentStory, isGenerating, generationProgress, getGenerator, updateStreamingStory, setGenerationProgress } = useStorybooksStore();
  
  // 优先使用流式故事，否则使用普通故事
  const storybook = currentStory || getBook(id || '');

  useEffect(() => {
    if (!storybook) {
      navigate('/');
      return;
    }
  }, [storybook, navigate]);

  // 键盘导航支持
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPageIndex, storybook]);

  if (!storybook) {
    return null;
  }

  // 检查是否为流式故事
  const isStreamingStory = 'isComplete' in storybook;
  const streamingStory = isStreamingStory ? storybook as StreamingStory : null;
  const currentPage = storybook.pages[currentPageIndex] as StreamingPage;
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

  const handleAnswer = async (option: QuestionOption) => {
    if (!storybook) return;
    
    // 保存选择
    setSelectedAnswers(prev => ({
      ...prev,
      [currentPage.id]: option.id
    }));
    
    // 显示反馈
    setRewardMessage(option.feedback);
    setShowReward(true);

    // 如果是流式故事且不是最后一页，生成下一页
    if (isStreamingStory && streamingStory && !streamingStory.isComplete) {
      const generator = getGenerator();
      if (generator && currentPageIndex === streamingStory.pages.length - 1) {
        // 这是当前最后一页，用户做出了选择，生成下一页
        setIsGeneratingNextPage(true);
        
        try {
          setGenerationProgress({
            step: '正在创作下一页...',
            progress: 50,
            currentPage: currentPageIndex + 2,
            totalPages: 5
          });

          const nextPage = await generator.generateNextPage(option.text, option.id);
          
          if (nextPage) {
            // 更新故事
            const updatedStory = generator.getCurrentStory();
            if (updatedStory) {
              updateStreamingStory(updatedStory);
              // 自动跳转到新页面
              setTimeout(() => {
                setCurrentPageIndex(prev => prev + 1);
                setIsGeneratingNextPage(false);
                setGenerationProgress({
                  step: '',
                  progress: 0,
                  currentPage: 0,
                  totalPages: 0
                });
              }, 500);
            }
          } else {
            // 故事已完成
            setIsGeneratingNextPage(false);
            setGenerationProgress({
              step: '',
              progress: 0,
              currentPage: 0,
              totalPages: 0
            });
          }
        } catch (error) {
          console.error('Error generating next page:', error);
          setIsGeneratingNextPage(false);
          setGenerationProgress({
            step: '',
            progress: 0,
            currentPage: 0,
            totalPages: 0
          });
          toast({
            title: "生成下一页失败",
            description: "抱歉，生成下一页时出现了问题。",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleNextPage = () => {
    // 如果正在生成下一页，不允许翻页
    if (isGeneratingNextPage) {
      return;
    }
    
    if (!isLastPage) {
      setCurrentPageIndex(prev => prev + 1);
    } else if (!storyCompleted) {
      setStoryCompleted(true);
      setShowFinalReward(true);
    }
  };

  const handlePrevPage = () => {
    if (!isFirstPage) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  // 渲染当前页面图片
  const renderCurrentPageImage = () => {
    if (isStreamingStory && streamingStory) {
      // 流式故事：检查当前页面状态
      if (!currentPage.background) {
        // 图片未生成
        return (
          <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-600 mb-2">正在绘制插图...</p>
              <p className="text-sm text-gray-500">请稍候，魔法正在发生</p>
            </div>
          </div>
        );
      } else {
        // 图片已生成
        return (
          <div className="relative group">
            <img
              src={currentPage.background}
              alt={`Page ${currentPageIndex + 1}`}
              className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* 页面状态指示器 */}
            <div className="absolute top-3 right-3">
              {currentPage.isReady ? (
                <div className="w-4 h-4 bg-green-400 rounded-full shadow-lg flex items-center justify-center" title="页面已准备好">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              ) : currentPage.isGenerating ? (
                <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-lg animate-pulse" title="正在生成中">
                  <Loader2 className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="w-4 h-4 bg-gray-300 rounded-full shadow-lg" title="等待生成">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            {/* 装饰性边框 */}
            <div className="absolute inset-0 border-4 border-white/20 rounded-lg pointer-events-none"></div>
          </div>
        );
      }
    } else {
      // 普通故事：直接显示图片
      return (
        <div className="relative group">
          <img
            src={currentPage.background}
            alt={`Page ${currentPageIndex + 1}`}
            className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 border-4 border-white/20 rounded-lg pointer-events-none"></div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* 导航栏 */}
      <Navbar />
      
      {/* 生成进度提示 */}
      {isGenerating && isStreamingStory && (
        <div className="fixed top-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl z-50 max-w-xs border border-pink-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 animate-pulse" />
            </div>
            <span className="text-sm font-medium text-gray-700">{generationProgress.step}</span>
          </div>
          <div className="w-full bg-gradient-to-r from-pink-200 to-purple-200 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${generationProgress.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {generationProgress.currentPage && generationProgress.totalPages
              ? `第 ${generationProgress.currentPage} / ${generationProgress.totalPages} 页`
              : `${generationProgress.progress}%`}
          </div>
        </div>
      )}

      {/* 故事标题和封面 */}
      <div className="relative overflow-hidden">
        {isStreamingStory && streamingStory && !streamingStory.cover ? (
          <div className="w-full h-64 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <div className="text-center">
              <div className="relative mb-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse" />
              </div>
              <p className="text-lg font-medium text-gray-600">正在绘制封面...</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={storybook.cover}
              alt={storybook.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          </div>
        )}
        
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 bg-white/90 hover:bg-white rounded-full p-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>

        {/* 故事标题 */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{storybook.title}</h1>
          <p className="text-white/90 text-sm drop-shadow-md">{storybook.description}</p>
        </div>
      </div>

      {/* 当前故事页面 - 翻页模式 */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl mx-auto border border-pink-100">
          {/* 当前页面图片 */}
          {renderCurrentPageImage()}
          
          {/* 当前页面文本 */}
          <div className="p-8 bg-gradient-to-br from-white to-pink-50">
            <div className="max-w-3xl mx-auto">
              <p className="text-xl leading-relaxed text-gray-800 font-medium">
                {currentPage.text}
              </p>
            </div>
          </div>

          {/* 选择题区域 */}
          {currentPage.question && (
            <div className="p-8 bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50">
              <div className="max-w-4xl mx-auto">
                {isGeneratingNextPage ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
                    <p className="text-lg font-medium text-gray-600">正在创作下一页...</p>
                    <p className="text-sm text-gray-500 mt-2">请稍候，魔法正在发生</p>
                  </div>
                ) : (
                  <StoryQuestion
                    question={currentPage.question.question}
                    options={currentPage.question.options}
                    onAnswer={handleAnswer}
                    selectedAnswer={selectedAnswers[currentPage.id]}
                  />
                )}
              </div>
            </div>
          )}

          {/* 交互元素区域 - 保留原有功能 */}
          <div className="relative p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  点击发现惊喜
                  <Sparkles className="h-5 w-5 text-blue-500" />
                </h3>
                <p className="text-sm text-gray-500">点击下面的元素，看看会发生什么魔法！</p>
              </div>
              
              <div className="relative h-40 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl shadow-inner border-2 border-blue-200 overflow-hidden">
                {/* 装饰性背景图案 */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-4 w-8 h-8 bg-blue-300 rounded-full"></div>
                  <div className="absolute top-8 right-8 w-6 h-6 bg-purple-300 rounded-full"></div>
                  <div className="absolute bottom-6 left-8 w-4 h-4 bg-pink-300 rounded-full"></div>
                  <div className="absolute bottom-4 right-4 w-10 h-10 bg-yellow-300 rounded-full"></div>
                </div>
                
                {/* 交互元素 */}
                {currentPage.interactiveElements.map((element) => (
                  <InteractiveElement
                    key={element.id}
                    element={element}
                    onInteraction={(reward) => handleInteraction(element.id, reward)}
                    isInteracted={interactedElements.has(element.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 页面导航 - 固定在底部 */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full px-8 py-4 shadow-2xl z-40 border border-pink-200">
        <div className="flex items-center gap-6">
          <button
            onClick={handlePrevPage}
            disabled={isFirstPage}
            className="p-3 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">
              {currentPageIndex + 1} / {totalPages}
            </div>
            <div className="text-xs text-gray-500">页面</div>
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={(isLastPage && storyCompleted) || isGeneratingNextPage}
            className="p-3 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            <ArrowRight className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* 键盘导航提示 */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-4 py-2 rounded-full z-30 backdrop-blur-sm">
        使用 ← → 键或空格键翻页
      </div>

      {/* 进度条 */}
      <div className="fixed bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-200 to-purple-200 z-30">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 音频播放器 */}
      <AudioPlayer
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        storyTitle={storybook.title}
      />

      {/* 奖励弹窗 */}
      <RewardModal
        isOpen={showReward}
        onClose={() => setShowReward(false)}
        message={rewardMessage}
      />

      {/* 完成奖励弹窗 */}
      <RewardModal
        isOpen={showFinalReward}
        onClose={() => setShowFinalReward(false)}
        message="🎉 恭喜你完成了整个故事！你是一个很棒的小读者！"
        isFinalReward
      />
    </div>
  );
};

export default StoryReader;
