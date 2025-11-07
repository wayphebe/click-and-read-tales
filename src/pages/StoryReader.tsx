import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Trophy, Star, Loader2, Heart, Sparkles } from 'lucide-react';
import { useStorybooksStore, type StreamingStory, type StreamingPage, type QuestionOption } from '@/data/storybooksData';
import InteractiveElement from '@/components/InteractiveElement';
import StoryQuestion from '@/components/StoryQuestion';
import AudioPlayer from '@/components/AudioPlayer';
import RewardModal from '@/components/RewardModal';
import { useToast } from '@/components/ui/use-toast';
import { useUserStore } from '@/store/useUserStore';
import { fetchStoryById } from '@/services/storyService';
import { logUserEvent } from '@/services/eventService';

const StoryReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserStore();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [interactedElements, setInteractedElements] = useState<Set<string>>(new Set());
  const [showFinalReward, setShowFinalReward] = useState(false);
  const [storyCompleted, setStoryCompleted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [pageId: string]: string }>({});
  const [isGeneratingNextPage, setIsGeneratingNextPage] = useState(false);
  const [loading, setLoading] = useState(true);

  const { getBook, currentStory, isGenerating, generationProgress, getGenerator, updateStreamingStory, setGenerationProgress, addBook } = useStorybooksStore();
  
  // 初始化 storybook - 添加详细日志
  const initialStorybook = currentStory || getBook(id || '') || null;
  console.log('[StoryReader] 初始化 storybook:', {
    hasCurrentStory: !!currentStory,
    currentStoryId: currentStory?.id,
    requestedId: id,
    hasBookInStore: !!getBook(id || ''),
    initialStorybook: initialStorybook ? '存在' : 'null'
  });
  
  const [storybook, setStorybook] = useState(initialStorybook);
  
  // 监听 currentStory 的变化（流式生成时可能会更新）
  useEffect(() => {
    console.log('[StoryReader] currentStory 变化:', {
      currentStory: currentStory ? '存在' : 'null',
      currentStoryId: currentStory?.id,
      requestedId: id,
      storybook: storybook ? '存在' : 'null',
      storybookId: storybook?.id
    });
    
    // 如果 currentStory 更新了且 ID 匹配，更新 storybook
    if (currentStory && currentStory.id === id && storybook?.id !== id) {
      console.log('[StoryReader] currentStory 更新，同步到 storybook');
      setStorybook(currentStory);
    }
  }, [currentStory, id, storybook?.id]);

  // 从数据库加载故事（如果不是流式故事且不在 store 中）
  useEffect(() => {
    const loadStory = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      // 优先检查 store 中的流式故事
      // 检查 currentStory（可能是流式故事）
      console.log('[StoryReader] ====== 开始加载故事 ======');
      console.log('[StoryReader] 请求的 ID:', id);
      console.log('[StoryReader] currentStory:', currentStory);
      console.log('[StoryReader] currentStory?.id:', currentStory?.id);
      console.log('[StoryReader] currentStory 是否为流式故事:', currentStory ? 'isComplete' in currentStory : 'N/A');
      
      if (currentStory) {
        // 如果 ID 匹配，直接使用
        if (currentStory.id === id) {
          console.log('[StoryReader] ✅ ID 匹配，使用 store 中的 currentStory');
          console.log('[StoryReader] currentStory 对象:', currentStory);
          console.log('[StoryReader] currentStory (JSON):', JSON.stringify(currentStory, null, 2));
          console.log('[StoryReader] currentStory.pages[0]:', currentStory.pages[0]);
          console.log('[StoryReader] currentStory.pages[0].question:', currentStory.pages[0]?.question);
          console.log('[StoryReader] currentStory.pages[0].question (JSON):', JSON.stringify(currentStory.pages[0]?.question, null, 2));
          setStorybook(currentStory);
          setLoading(false);
          return;
        }
        // 如果是流式故事且是第一页，也使用它（可能是刚生成的）
        if ('isComplete' in currentStory && currentStory.pages.length > 0) {
          console.log('[StoryReader] ✅ 是流式故事，即使 ID 不匹配也使用');
          console.log('[StoryReader] currentStory 对象:', currentStory);
          console.log('[StoryReader] currentStory.pages[0].question:', currentStory.pages[0]?.question);
          console.log('[StoryReader] currentStory.pages[0].question (JSON):', JSON.stringify(currentStory.pages[0]?.question, null, 2));
          setStorybook(currentStory);
          setLoading(false);
          return;
        }
      }

      // 如果 store 中有，不需要加载
      const existingStory = getBook(id);
      if (existingStory) {
        console.log('[StoryReader] ✅ 从 store 中找到 existingStory');
        console.log('[StoryReader] existingStory 对象:', existingStory);
        console.log('[StoryReader] existingStory (JSON):', JSON.stringify(existingStory, null, 2));
        console.log('[StoryReader] existingStory.pages[0].question:', existingStory.pages[0]?.question);
        console.log('[StoryReader] existingStory.pages[0].question (JSON):', JSON.stringify(existingStory.pages[0]?.question, null, 2));
        setStorybook(existingStory);
        setLoading(false);
        return;
      }

      // 从数据库加载
      try {
        setLoading(true);
        const story = await fetchStoryById(id);
        if (story) {
          console.log('[StoryReader] ⚠️ 从数据库加载故事');
          console.log('[StoryReader] story 对象:', story);
          console.log('[StoryReader] story (JSON):', JSON.stringify(story, null, 2));
          console.log('[StoryReader] story.pages[0]:', story.pages[0]);
          console.log('[StoryReader] story.pages[0].question:', story.pages[0]?.question);
          console.log('[StoryReader] story.pages[0].question (JSON):', JSON.stringify(story.pages[0]?.question, null, 2));
          
          // 检查是否应该是一个流式故事（通过检查页面是否有 question 字段）
          // 如果第一页有问题选项，很可能是流式故事
          const hasQuestions = story.pages.some(page => page.question);
          console.log('[StoryReader] 检查是否有 question 字段:', hasQuestions);
          console.log('[StoryReader] 所有页面的 question 状态:', story.pages.map((p, i) => ({ pageIndex: i, hasQuestion: !!p.question })));
          
          if (hasQuestions) {
            console.log('[StoryReader] ✅ 检测到 question 字段，转换为流式故事');
            // 转换为流式故事格式
            const streamingStory: StreamingStory = {
              ...story,
              pages: story.pages.map(page => ({
                ...page,
                isReady: !!page.background, // 如果有背景图，说明已准备好
                isGenerating: false
              })) as StreamingPage[],
              isComplete: story.pages.every(page => !!page.background), // 如果所有页面都有背景图，说明已完成
              currentReadyPage: story.pages.filter(page => !!page.background).length - 1
            };
            console.log('[StoryReader] 转换后的 streamingStory:', streamingStory);
            console.log('[StoryReader] streamingStory.pages[0].question:', streamingStory.pages[0]?.question);
            console.log('[StoryReader] streamingStory.pages[0].question (JSON):', JSON.stringify(streamingStory.pages[0]?.question, null, 2));
            setStorybook(streamingStory);
            addBook(streamingStory);
          } else {
            console.log('[StoryReader] ⚠️ 没有检测到 question 字段，作为普通故事处理');
            // 添加到 store
            addBook(story);
            setStorybook(story);
          }
        } else {
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Error loading story:', error);
        toast({
          title: "加载失败",
          description: "无法加载故事，请稍后再试",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [id, navigate, currentStory, getBook, addBook, toast]);

  // 记录故事开始事件
  useEffect(() => {
    if (storybook && user && currentPageIndex === 0) {
      logUserEvent(user.id, 'story_start', { story_id: storybook.id });
    }
  }, [storybook, user, currentPageIndex]);

  useEffect(() => {
    if (!storybook && !loading) {
      navigate('/');
      return;
    }
  }, [storybook, loading, navigate]);

  // 检查是否为流式故事（在条件返回之前计算，以便在 useEffect 中使用）
  // 注意：这些变量在 storybook 为 null 时可能为 undefined，需要在使用前检查
  const isStreamingStory = storybook && 'isComplete' in storybook;
  const streamingStory = isStreamingStory ? storybook as StreamingStory : null;
  const currentPage = storybook?.pages?.[currentPageIndex] as StreamingPage | undefined;
  const isLastPage = storybook ? currentPageIndex === storybook.pages.length - 1 : false;
  const isFirstPage = currentPageIndex === 0;
  const totalPages = storybook?.pages?.length || 0;
  const progress = totalPages > 0 ? ((currentPageIndex + 1) / totalPages) * 100 : 0;
  
  // 调试：记录 storybook 状态
  console.log('[StoryReader] 渲染时 storybook 状态:', {
    storybook: storybook ? '存在' : 'null',
    loading,
    id,
    currentStory: currentStory ? '存在' : 'null',
    currentStoryId: currentStory?.id
  });

  // 定义翻页函数 - 必须在 useEffect 之前
  const handleNextPage = useCallback(async () => {
    // 如果正在生成下一页，不允许翻页
    if (isGeneratingNextPage) {
      return;
    }
    
    if (!isLastPage && storybook) {
      const newIndex = currentPageIndex + 1;
      setCurrentPageIndex(newIndex);
      
      // 记录翻页事件
      if (user && storybook) {
        await logUserEvent(user.id, 'page_turn', {
          story_id: storybook.id,
          page_id: storybook.pages[newIndex]?.id,
          page_number: newIndex + 1
        });
      }
    } else if (!storyCompleted && storybook) {
      setStoryCompleted(true);
      setShowFinalReward(true);
      
      // 记录完成事件
      if (user && storybook) {
        await logUserEvent(user.id, 'story_complete', {
          story_id: storybook.id
        });
      }
    }
  }, [isGeneratingNextPage, isLastPage, storybook, currentPageIndex, user, storyCompleted]);

  const handlePrevPage = useCallback(async () => {
    if (!isFirstPage && storybook) {
      const newIndex = currentPageIndex - 1;
      setCurrentPageIndex(newIndex);
      
      // 记录翻页事件
      if (user && storybook) {
        await logUserEvent(user.id, 'page_turn', {
          story_id: storybook.id,
          page_id: storybook.pages[newIndex]?.id,
          page_number: newIndex + 1
        });
      }
    }
  }, [isFirstPage, storybook, currentPageIndex, user]);

  // 调试信息 - 只在 storybook 加载完成后执行
  useEffect(() => {
    // 如果还在加载中，不执行调试日志
    if (loading) {
      console.log('[StoryReader] 仍在加载中，跳过调试日志');
      return;
    }
    
    // 如果 storybook 不存在，记录详细信息
    if (!storybook) {
      console.error('[StoryReader] ⚠️⚠️⚠️ storybook 为 null！');
      console.error('[StoryReader] 诊断信息:');
      console.error('[StoryReader] - loading:', loading);
      console.error('[StoryReader] - id:', id);
      console.error('[StoryReader] - currentStory:', currentStory);
      console.error('[StoryReader] - currentStory?.id:', currentStory?.id);
      console.error('[StoryReader] - getBook(id):', getBook(id || ''));
      return;
    }
    
    console.log('[StoryReader] ====== 页面状态更新 ======');
    console.log('[StoryReader] storybook 对象:', storybook);
    console.log('[StoryReader] storybook (JSON):', JSON.stringify(storybook, null, 2));
    console.log('[StoryReader] storybook 是否为流式故事:', isStreamingStory);
    console.log('[StoryReader] storybook.pages 数量:', storybook?.pages?.length || 0);
    console.log('[StoryReader] storybook.pages[0]:', storybook?.pages?.[0]);
    console.log('[StoryReader] storybook.pages[0].question:', storybook?.pages?.[0]?.question);
    console.log('[StoryReader] storybook.pages[0].question (JSON):', JSON.stringify(storybook?.pages?.[0]?.question, null, 2));
    
    if (currentPage) {
      console.log('[StoryReader] Current page index:', currentPageIndex);
      console.log('[StoryReader] Current page 对象:', currentPage);
      console.log('[StoryReader] Current page (JSON):', JSON.stringify(currentPage, null, 2));
      console.log('[StoryReader] Current page ID:', currentPage?.id);
      console.log('[StoryReader] Current page question 对象:', currentPage?.question);
      console.log('[StoryReader] Current page question (JSON):', JSON.stringify(currentPage?.question, null, 2));
      console.log('[StoryReader] Current page question options:', currentPage?.question?.options);
      console.log('[StoryReader] Current page question options (JSON):', JSON.stringify(currentPage?.question?.options, null, 2));
      console.log('[StoryReader] Is streaming story:', isStreamingStory);
      console.log('[StoryReader] Story pages count:', storybook.pages.length);
      console.log('[StoryReader] Total pages:', totalPages);
      
      // 诊断信息
      if (!currentPage.question) {
        console.error('[StoryReader] ⚠️⚠️⚠️ 当前页面没有问题选项！');
        console.error('[StoryReader] 诊断信息:');
        console.error('[StoryReader] - storybook 存在:', !!storybook);
        console.error('[StoryReader] - currentPage 存在:', !!currentPage);
        console.error('[StoryReader] - currentPage.question 存在:', !!currentPage.question);
        console.error('[StoryReader] - storybook.pages[0].question 存在:', !!storybook.pages[0]?.question);
        console.error('[StoryReader] - storybook.pages[0] 存在:', !!storybook.pages[0]);
        console.error('[StoryReader] - storybook.pages 长度:', storybook.pages?.length);
        console.error('[StoryReader] - currentPageIndex:', currentPageIndex);
        console.error('[StoryReader] - 是否为流式故事:', isStreamingStory);
      } else {
        console.log('[StoryReader] ✅ 当前页面有问题选项');
      }
    } else {
      console.warn('[StoryReader] ⚠️ currentPage 不存在');
      console.warn('[StoryReader] currentPageIndex:', currentPageIndex);
      console.warn('[StoryReader] storybook.pages 长度:', storybook.pages?.length);
      console.warn('[StoryReader] storybook.pages[currentPageIndex]:', storybook.pages?.[currentPageIndex]);
    }
    console.log('[StoryReader] ====== 页面状态更新完成 ======');
  }, [currentPageIndex, currentPage, isStreamingStory, storybook, totalPages, loading, id, currentStory]);

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
  }, [handlePrevPage, handleNextPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-magical-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">加载故事中...</p>
        </div>
      </div>
    );
  }

  if (!storybook) {
    return null;
  }

  const handleInteraction = async (elementId: string, reward: string) => {
    if (!interactedElements.has(elementId)) {
      setInteractedElements(prev => new Set([...prev, elementId]));
      setRewardMessage(reward);
      setShowReward(true);
      
      // 记录交互事件
      if (user && storybook) {
        await logUserEvent(user.id, 'interactive_click', {
          story_id: storybook.id,
          page_id: currentPage?.id,
          page_number: currentPageIndex + 1,
          element_id: elementId
        });
      }
    }
  };

  const handleAnswer = async (option: QuestionOption) => {
    if (!storybook) return;
    
    // 保存选择
    setSelectedAnswers(prev => ({
      ...prev,
      [currentPage.id]: option.id
    }));
    
    // 记录回答事件
    if (user) {
      await logUserEvent(user.id, 'question_answer', {
        story_id: storybook.id,
        page_id: currentPage.id,
        page_number: currentPageIndex + 1,
        question_id: currentPage.question?.id,
        answer_id: option.id,
        answer_correct: option.isCorrect
      });
    }
    
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
            totalPages: 6
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
        // 图片已生成 - 叠加交互元素
        return (
          <div className="relative w-full h-96 overflow-hidden">
            <img
              src={currentPage.background}
              alt={`Page ${currentPageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* 交互元素直接叠加在图片上 */}
            {currentPage.interactiveElements?.map((element) => (
              <InteractiveElement
                key={element.id}
                element={element}
                onInteraction={(reward) => handleInteraction(element.id, reward)}
                isInteracted={interactedElements.has(element.id)}
              />
            ))}
            
            {/* 页面状态指示器 */}
            <div className="absolute top-3 right-3 z-10">
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
          </div>
        );
      }
    } else {
      // 普通故事：直接显示图片 - 叠加交互元素
      return (
        <div className="relative w-full h-96 overflow-hidden">
          <img
            src={currentPage.background}
            alt={`Page ${currentPageIndex + 1}`}
            className="w-full h-full object-cover"
          />
          
          {/* 交互元素直接叠加在图片上 */}
          {currentPage.interactiveElements?.map((element) => (
            <InteractiveElement
              key={element.id}
              element={element}
              onInteraction={(reward) => handleInteraction(element.id, reward)}
              isInteracted={interactedElements.has(element.id)}
            />
          ))}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
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
          {currentPage.question ? (
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
          ) : null}
        </div>
      </div>

      {/* 页面导航 - 固定在底部 */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-2xl z-40 border-2 border-pink-200">
        <div className="flex items-center gap-8">
          <button
            onClick={handlePrevPage}
            disabled={isFirstPage}
            className="p-4 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 hover:from-pink-300 hover:to-purple-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 disabled:transform-none"
            aria-label="上一页"
          >
            <ArrowLeft className="h-6 w-6 text-gray-800" />
          </button>
          
          <div className="text-center min-w-20">
            <div className="text-xl font-bold text-gray-800">
              {currentPageIndex + 1} / {totalPages}
            </div>
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={(isLastPage && storyCompleted) || isGeneratingNextPage}
            className="p-4 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 hover:from-pink-300 hover:to-purple-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 disabled:transform-none"
            aria-label="下一页"
          >
            <ArrowRight className="h-6 w-6 text-gray-800" />
          </button>
        </div>
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
