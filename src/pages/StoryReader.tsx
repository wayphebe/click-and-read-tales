import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { logUserEvent, pageTimeTracker } from '@/services/eventService';

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
  const [visitedPages, setVisitedPages] = useState<Set<string>>(new Set());
  const [pageInteractionCount, setPageInteractionCount] = useState(0);
  const [questionDisplayTimes, setQuestionDisplayTimes] = useState<Map<string, number>>(new Map());
  
  // 使用 useRef 存储最新值，避免在 useEffect 清理函数中访问过期的 state
  const pageInteractionCountRef = useRef(0);
  const selectedAnswersRef = useRef<{ [pageId: string]: string }>({});
  
  // 同步 ref 和 state
  useEffect(() => {
    pageInteractionCountRef.current = pageInteractionCount;
  }, [pageInteractionCount]);
  
  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

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
    console.log('[StoryReader] ====== currentStory 变化监听 ======');
    console.log('[StoryReader] currentStory 变化:', {
      currentStory: currentStory ? '存在' : 'null',
      currentStoryId: currentStory?.id,
      requestedId: id,
      storybook: storybook ? '存在' : 'null',
      storybookId: storybook?.id,
      currentStoryPagesCount: currentStory?.pages?.length,
      storybookPagesCount: storybook?.pages?.length
    });
    
    // 如果 currentStory 更新了，检查是否需要同步
    if (currentStory) {
      // 情况1: ID 完全匹配
      if (currentStory.id === id) {
        if (storybook?.id !== id) {
          console.log('[StoryReader] ✅ currentStory ID 匹配，同步到 storybook');
          setStorybook(currentStory);
        } else if (currentStory.pages.length !== storybook.pages.length) {
          console.log('[StoryReader] ✅ currentStory 页面数量变化，同步到 storybook');
          console.log('[StoryReader] 页面数量变化:', {
            oldCount: storybook.pages.length,
            newCount: currentStory.pages.length,
            oldPagesIds: storybook.pages.map(p => p.id),
            newPagesIds: currentStory.pages.map(p => p.id)
          });
          setStorybook(currentStory);
          
          // 新增：如果当前在最后一页，自动跳转到新页面
          const newPageCount = currentStory.pages.length;
          const oldPageCount = storybook.pages.length;
          
          if (newPageCount > oldPageCount && currentPageIndex === oldPageCount - 1) {
            console.log('[StoryReader] ✅ 当前在最后一页，自动跳转到新生成的页面');
            setTimeout(() => {
              const targetIndex = newPageCount - 1;
              console.log('[StoryReader] 自动跳转到页面索引:', targetIndex);
              setCurrentPageIndex(targetIndex);
            }, 300);
          }
        } else {
          console.log('[StoryReader] currentStory 已同步，无需更新');
        }
      } 
      // 情况2: 是流式故事且页面数量变化（ID 可能不匹配，因为生成器使用原始 ID，但数据库使用 UUID）
      else if ('isComplete' in currentStory && currentStory.pages.length > (storybook?.pages?.length || 0)) {
        console.log('[StoryReader] ✅ 流式故事页面数量增加，同步到 storybook（ID 不匹配但允许）');
        console.log('[StoryReader] ID 不匹配但允许同步:', {
          currentStoryId: currentStory.id,
          requestedId: id,
          currentStoryPagesCount: currentStory.pages.length,
          storybookPagesCount: storybook?.pages?.length || 0
        });
        // 更新 ID 为请求的 ID（数据库 ID）
        const updatedStory = {
          ...currentStory,
          id: id
        };
        setStorybook(updatedStory);
        // 同时更新 store 中的 currentStory
        updateStreamingStory(updatedStory);
        
        // 新增：如果当前在最后一页，自动跳转到新页面
        const newPageCount = currentStory.pages.length;
        const oldPageCount = storybook?.pages?.length || 0;
        
        if (newPageCount > oldPageCount) {
          console.log('[StoryReader] 检测到新页面生成，检查是否需要自动跳转');
          console.log('[StoryReader] 页面数量变化:', {
            oldCount: oldPageCount,
            newCount: newPageCount,
            currentPageIndex,
            shouldJump: currentPageIndex === oldPageCount - 1
          });
          
          // 如果当前在最后一页（旧页面的最后一页），自动跳转到新页面
          if (currentPageIndex === oldPageCount - 1) {
            console.log('[StoryReader] ✅ 当前在最后一页，自动跳转到新生成的页面');
            setTimeout(() => {
              const targetIndex = newPageCount - 1;
              console.log('[StoryReader] 自动跳转到页面索引:', targetIndex);
              setCurrentPageIndex(targetIndex);
            }, 300);
          }
        }
      }
    }
    console.log('[StoryReader] ====== currentStory 变化监听完成 ======');
  }, [currentStory, id, storybook?.id, storybook?.pages?.length, currentPageIndex, updateStreamingStory]);

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

  // 检查是否为流式故事（必须在 useEffect 之前定义，以便在 useEffect 中使用）
  // 注意：这些变量在 storybook 为 null 时可能为 undefined，需要在使用前检查
  const isStreamingStory = storybook && 'isComplete' in storybook;
  const streamingStory = isStreamingStory ? storybook as StreamingStory : null;
  const currentPage = storybook?.pages?.[currentPageIndex] as StreamingPage | undefined;
  const isLastPage = storybook ? currentPageIndex === storybook.pages.length - 1 : false;
  const isFirstPage = currentPageIndex === 0;
  const totalPages = storybook?.pages?.length || 0;
  const progress = totalPages > 0 ? ((currentPageIndex + 1) / totalPages) * 100 : 0;

  // 页面进入/离开追踪
  useEffect(() => {
    if (!currentPage || !user || !storybook) {
      console.log('[StoryReader] 页面进入追踪跳过:', {
        hasCurrentPage: !!currentPage,
        hasUser: !!user,
        hasStorybook: !!storybook
      });
      return;
    }
    
    console.log('[StoryReader] ====== 页面进入追踪开始 ======');
    console.log('[StoryReader] 当前页面:', {
      pageId: currentPage.id,
      pageNumber: currentPageIndex + 1,
      pageIndex: currentPageIndex
    });
    
    const enterTime = pageTimeTracker.enterPage(currentPage.id);
    const isFirstView = !visitedPages.has(currentPage.id);
    
    console.log('[StoryReader] 页面进入信息:', {
      enterTime,
      isFirstView,
      visitedPagesSize: visitedPages.size
    });
    
    // 记录页面进入
    logUserEvent(user.id, 'page_enter', {
      story_id: storybook.id,
      page_id: currentPage.id,
      page_number: currentPageIndex + 1,
      enter_time: enterTime,
      is_first_view: isFirstView,
      previous_page_id: currentPageIndex > 0 
        ? storybook.pages[currentPageIndex - 1]?.id 
        : undefined
    });
    
    // 标记已访问
    setVisitedPages(prev => {
      const newSet = new Set([...prev, currentPage.id]);
      console.log('[StoryReader] 更新已访问页面:', {
        oldSize: prev.size,
        newSize: newSet.size,
        addedPageId: currentPage.id
      });
      return newSet;
    });
    
    // 重置页面交互计数
    setPageInteractionCount(0);
    pageInteractionCountRef.current = 0;
    console.log('[StoryReader] 重置页面交互计数');
    
    // 记录问题显示时间
    if (currentPage.question) {
      const displayTime = Date.now();
      setQuestionDisplayTimes(prev => new Map([...prev, [currentPage.id, displayTime]]));
      pageTimeTracker.recordQuestionDisplay(currentPage.id);
      console.log('[StoryReader] 记录问题显示时间:', {
        pageId: currentPage.id,
        displayTime
      });
    }
    
    console.log('[StoryReader] ====== 页面进入追踪完成 ======');
    
    // 清理函数：离开页面时记录
    return () => {
      console.log('[StoryReader] ====== 页面离开追踪开始 ======');
      console.log('[StoryReader] 离开页面:', {
        pageId: currentPage.id,
        pageNumber: currentPageIndex + 1
      });
      
      const leaveData = pageTimeTracker.leavePage(currentPage.id);
      if (leaveData && user && storybook) {
        // 使用 ref 获取最新的值
        const currentInteractionCount = pageInteractionCountRef.current;
        const currentSelectedAnswers = selectedAnswersRef.current;
        
        console.log('[StoryReader] 页面离开信息:', {
          duration: leaveData.duration,
          interactionCount: currentInteractionCount,
          questionAnswered: !!currentSelectedAnswers[currentPage.id]
        });
        
        logUserEvent(user.id, 'page_leave', {
          story_id: storybook.id,
          page_id: currentPage.id,
          page_number: currentPageIndex + 1,
          enter_time: leaveData.enterTime,
          leave_time: Date.now(),
          duration_ms: leaveData.duration,
          interaction_count: currentInteractionCount,
          question_answered: !!currentSelectedAnswers[currentPage.id]
        });
      }
      console.log('[StoryReader] ====== 页面离开追踪完成 ======');
    };
    // 注意：visitedPages, pageInteractionCount, selectedAnswers 不应该在依赖数组中
    // 因为它们会在 useEffect 内部更新，导致无限循环
  }, [currentPageIndex, currentPage?.id, user?.id, storybook?.id]);

  useEffect(() => {
    if (!storybook && !loading) {
      navigate('/');
      return;
    }
  }, [storybook, loading, navigate]);
  
  // 调试：记录 storybook 状态
  console.log('[StoryReader] 渲染时 storybook 状态:', {
    storybook: storybook ? '存在' : 'null',
    loading,
    id,
    currentStory: currentStory ? '存在' : 'null',
    currentStoryId: currentStory?.id
  });

  // 定义翻页函数 - 必须在 useEffect 之前
  const handleNextPage = useCallback(async (method: 'button' | 'keyboard' = 'button') => {
    // 如果正在生成下一页，不允许翻页
    if (isGeneratingNextPage) {
      return;
    }
    
    if (!isLastPage && storybook && currentPage) {
      const timeOnPage = pageTimeTracker.getTimeOnPage(currentPage.id) || 0;
      const newIndex = currentPageIndex + 1;
      setCurrentPageIndex(newIndex);
      
      // 记录翻页事件（增强）
      if (user && storybook) {
        await logUserEvent(user.id, 'page_turn', {
          story_id: storybook.id,
          from_page_id: currentPage.id,
          from_page_number: currentPageIndex + 1,
          to_page_id: storybook.pages[newIndex]?.id,
          to_page_number: newIndex + 1,
          turn_direction: 'forward',
          turn_method: method,
          time_on_previous_page_ms: timeOnPage
        });
      }
    } else if (!storyCompleted && storybook) {
      setStoryCompleted(true);
      setShowFinalReward(true);
      
      // 记录完成事件（增强）
      if (user && storybook) {
        // 计算完成统计
        const totalInteractions = Array.from(interactedElements).length;
        const totalQuestionsAnswered = Object.keys(selectedAnswers).length;
        const correctAnswersCount = storybook.pages.reduce((count, page, index) => {
          if (page.question && selectedAnswers[page.id]) {
            const selectedAnswerId = selectedAnswers[page.id];
            const selectedOption = page.question.options.find(opt => opt.id === selectedAnswerId);
            if (selectedOption?.isCorrect) {
              return count + 1;
            }
          }
          return count;
        }, 0);
        
        await logUserEvent(user.id, 'story_complete', {
          story_id: storybook.id,
          total_pages: storybook.pages.length,
          total_interactions: totalInteractions,
          total_questions_answered: totalQuestionsAnswered,
          correct_answers_count: correctAnswersCount,
          pages_visited: Array.from(visitedPages).map(id => {
            const page = storybook.pages.find(p => p.id === id);
            return page ? storybook.pages.indexOf(page) + 1 : 0;
          }).filter(n => n > 0),
          completion_rate: (visitedPages.size / storybook.pages.length) * 100,
          last_page_id: currentPage?.id
        });
      }
    }
  }, [isGeneratingNextPage, isLastPage, storybook, currentPageIndex, user, storyCompleted, currentPage, interactedElements, selectedAnswers, visitedPages]);

  const handlePrevPage = useCallback(async (method: 'button' | 'keyboard' = 'button') => {
    if (!isFirstPage && storybook && currentPage) {
      const timeOnPage = pageTimeTracker.getTimeOnPage(currentPage.id) || 0;
      const newIndex = currentPageIndex - 1;
      setCurrentPageIndex(newIndex);
      
      // 记录翻页事件（增强）
      if (user && storybook) {
        await logUserEvent(user.id, 'page_turn', {
          story_id: storybook.id,
          from_page_id: currentPage.id,
          from_page_number: currentPageIndex + 1,
          to_page_id: storybook.pages[newIndex]?.id,
          to_page_number: newIndex + 1,
          turn_direction: 'backward',
          turn_method: method,
          time_on_previous_page_ms: timeOnPage
        });
      }
    }
  }, [isFirstPage, storybook, currentPageIndex, user, currentPage]);

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
        handlePrevPage('keyboard');
      } else if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        handleNextPage('keyboard');
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

  // 如果 currentPage 不存在，显示加载状态
  if (!currentPage) {
    return (
      <div className="min-h-screen bg-magical-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">加载页面中...</p>
        </div>
      </div>
    );
  }

  const handleInteraction = async (elementId: string, reward: string) => {
    if (!interactedElements.has(elementId) && currentPage) {
      const element = currentPage.interactiveElements?.find(e => e.id === elementId);
      const timeOnPage = pageTimeTracker.getTimeOnPage(currentPage.id) || 0;
      const clickSequence = pageInteractionCount + 1;
      
      setInteractedElements(prev => new Set([...prev, elementId]));
      setPageInteractionCount(prev => {
        const newCount = prev + 1;
        pageInteractionCountRef.current = newCount;
        return newCount;
      });
      setRewardMessage(reward);
      setShowReward(true);
      
      // 记录交互事件（增强）
      if (user && storybook && element) {
        await logUserEvent(user.id, 'interactive_click', {
          story_id: storybook.id,
          page_id: currentPage.id,
          page_number: currentPageIndex + 1,
          element_id: elementId,
          element_emoji: element.emoji,
          element_position: { x: element.x, y: element.y },
          element_type: element.vocabulary ? 'vocabulary' : 'reward',
          reward_text: reward,
          vocabulary: element.vocabulary,
          is_first_click: true,
          click_sequence: clickSequence,
          time_since_page_enter_ms: timeOnPage
        });
      }
    }
  };

  const handleAnswer = async (option: QuestionOption) => {
    console.log('[StoryReader] ====== 答题处理开始 ======');
    console.log('[StoryReader] 答题信息:', {
      hasStorybook: !!storybook,
      hasCurrentPage: !!currentPage,
      hasQuestion: !!currentPage?.question,
      optionId: option.id,
      optionText: option.text,
      isCorrect: option.isCorrect
    });
    
    if (!storybook || !currentPage || !currentPage.question) {
      console.warn('[StoryReader] 答题处理跳过: 缺少必要数据');
      return;
    }
    
    // 计算思考时间
    const questionDisplayTime = questionDisplayTimes.get(currentPage.id) || Date.now();
    const thinkingTime = Date.now() - questionDisplayTime;
    const timeOnPage = pageTimeTracker.getTimeOnPage(currentPage.id) || 0;
    const selectedOptionIndex = currentPage.question.options.findIndex(o => o.id === option.id);
    
    console.log('[StoryReader] 答题时间信息:', {
      questionDisplayTime,
      thinkingTime,
      timeOnPage,
      selectedOptionIndex
    });
    
    // 保存选择
    setSelectedAnswers(prev => {
      const newAnswers = {
        ...prev,
        [currentPage.id]: option.id
      };
      selectedAnswersRef.current = newAnswers;
      return newAnswers;
    });
    console.log('[StoryReader] 已保存答案选择');
    
    // 记录回答事件（增强）
    if (user) {
      await logUserEvent(user.id, 'question_answer', {
        story_id: storybook.id,
        page_id: currentPage.id,
        page_number: currentPageIndex + 1,
        question_id: currentPage.question.id,
        question_text: currentPage.question.question,
        answer_id: option.id,
        answer_text: option.text,
        answer_emoji: option.emoji,
        answer_correct: option.isCorrect || false,
        thinking_time_ms: thinkingTime,
        time_since_page_enter_ms: timeOnPage,
        attempt_count: 1,
        options_count: currentPage.question.options.length,
        selected_option_index: selectedOptionIndex >= 0 ? selectedOptionIndex : 0
      });
      console.log('[StoryReader] 已记录答题事件');
    }
    
    // 显示反馈
    setRewardMessage(option.feedback);
    setShowReward(true);
    console.log('[StoryReader] 显示反馈:', option.feedback);

    // 如果是流式故事且不是最后一页，生成下一页
    console.log('[StoryReader] 检查流式生成条件:', {
      isStreamingStory,
      hasStreamingStory: !!streamingStory,
      isComplete: streamingStory?.isComplete,
      currentPageIndex,
      totalPages: streamingStory?.pages.length
    });
    
    if (isStreamingStory && streamingStory && !streamingStory.isComplete) {
      const generator = getGenerator();
      console.log('[StoryReader] ====== 流式生成检查 ======');
      console.log('[StoryReader] 检查生成器:', {
        hasGenerator: !!generator,
        currentPageIndex,
        totalPages: streamingStory.pages.length,
        isLastPage: currentPageIndex === streamingStory.pages.length - 1,
        isComplete: streamingStory.isComplete,
        generatorType: generator ? generator.constructor.name : 'null'
      });
      
      if (generator && currentPageIndex === streamingStory.pages.length - 1) {
        // 这是当前最后一页，用户做出了选择，生成下一页
        console.log('[StoryReader] ✅ 满足生成条件，开始生成下一页...');
        console.log('[StoryReader] 生成参数:', {
          optionText: option.text,
          optionId: option.id,
          currentPageIndex,
          nextPageIndex: currentPageIndex + 1
        });
        
        setIsGeneratingNextPage(true);
        
        try {
          setGenerationProgress({
            step: '正在创作下一页...',
            progress: 50,
            currentPage: currentPageIndex + 2,
            totalPages: 6
          });
          console.log('[StoryReader] 已设置生成进度');

          console.log('[StoryReader] 调用 generator.generateNextPage...');
          const nextPage = await generator.generateNextPage(option.text, option.id);
          console.log('[StoryReader] ====== 生成器返回结果 ======');
          console.log('[StoryReader] 下一页生成结果:', { 
            hasNextPage: !!nextPage,
            nextPageData: nextPage ? {
              id: nextPage.id,
              hasText: !!nextPage.text,
              hasBackground: !!nextPage.background,
              hasQuestion: !!nextPage.question
            } : null
          });
          
          if (nextPage) {
            // 更新故事
            console.log('[StoryReader] ====== 获取更新后的故事 ======');
            const updatedStory = generator.getCurrentStory();
            console.log('[StoryReader] 生成器返回的故事:', {
              hasUpdatedStory: !!updatedStory,
              storyId: updatedStory?.id,
              pagesCount: updatedStory?.pages?.length,
              isComplete: updatedStory?.isComplete
            });
            
            if (updatedStory) {
              console.log('[StoryReader] ====== 更新后的故事详细信息 ======');
              console.log('[StoryReader] 生成器返回的故事ID:', updatedStory.id);
              console.log('[StoryReader] 请求的故事ID:', id);
              console.log('[StoryReader] 页面数量:', updatedStory.pages.length);
              console.log('[StoryReader] 是否完成:', updatedStory.isComplete);
              console.log('[StoryReader] 所有页面ID:', updatedStory.pages.map((p, i) => ({
                index: i,
                id: p.id,
                text: p.text.substring(0, 20) + '...',
                hasBackground: !!p.background,
                hasQuestion: !!p.question
              })));
              
              // 验证新页面是否在故事中
              const newPageInStory = updatedStory.pages.find(p => p.id === nextPage.id);
              console.log('[StoryReader] 新页面是否在故事中:', {
                nextPageId: nextPage.id,
                found: !!newPageInStory,
                newPageIndex: newPageInStory ? updatedStory.pages.indexOf(newPageInStory) : -1
              });
              
              console.log('[StoryReader] 更新前的 storybook:', {
                id: storybook.id,
                pagesCount: storybook.pages.length,
                pagesIds: storybook.pages.map(p => p.id)
              });
              
              // 如果生成器返回的故事 ID 与请求的 ID 不匹配（生成器使用原始 ID，但数据库使用 UUID）
              // 需要更新 ID 为请求的 ID
              const storyToUpdate = updatedStory.id !== id ? {
                ...updatedStory,
                id: id
              } : updatedStory;
              
              console.log('[StoryReader] 更新 store 和本地 state...');
              console.log('[StoryReader] 更新前 currentStory:', {
                id: currentStory?.id,
                pagesCount: currentStory?.pages?.length
              });
              console.log('[StoryReader] 要更新的故事ID:', storyToUpdate.id);
              
              updateStreamingStory(storyToUpdate);
              setStorybook(storyToUpdate); // 同时更新本地 state
              
              // 验证更新（注意：state 更新是异步的，这里读取的是旧值）
              console.log('[StoryReader] 更新后立即读取 storybook (可能是旧值):', {
                id: storybook.id,
                pagesCount: storybook.pages.length
              });
              
              // 从 store 读取最新值验证
              const latestStory = getBook(updatedStory.id) || currentStory;
              console.log('[StoryReader] 从 store 读取的最新故事:', {
                id: latestStory?.id,
                pagesCount: latestStory?.pages?.length
              });
              
              console.log('[StoryReader] ✅ 故事已更新，准备跳转到新页面');
              console.log('[StoryReader] 当前页面索引:', currentPageIndex);
              console.log('[StoryReader] 新页面索引:', currentPageIndex + 1);
              
              // 自动跳转到新页面
              setTimeout(() => {
                console.log('[StoryReader] ====== 开始跳转到新页面 ======');
                console.log('[StoryReader] 跳转前状态:', {
                  currentPageIndex,
                  storybookPagesCount: storybook.pages.length,
                  updatedStoryPagesCount: updatedStory.pages.length
                });
                
                // 直接跳转到最后一页（新生成的页面）
                const targetIndex = updatedStory.pages.length - 1;
                console.log('[StoryReader] 更新页面索引:', { 
                  from: currentPageIndex, 
                  to: targetIndex,
                  totalPages: updatedStory.pages.length
                });
                setCurrentPageIndex(targetIndex);
                
                setIsGeneratingNextPage(false);
                setGenerationProgress({
                  step: '',
                  progress: 0,
                  currentPage: 0,
                  totalPages: 0
                });
                
                console.log('[StoryReader] ✅ 已跳转到新页面');
                console.log('[StoryReader] ====== 跳转完成 ======');
              }, 500);
            } else {
              console.error('[StoryReader] ❌ 更新后的故事为空');
              console.error('[StoryReader] 生成器状态:', {
                hasGenerator: !!generator,
                generatorType: generator?.constructor.name
              });
            }
          } else {
            // 故事已完成
            console.log('[StoryReader] ====== 故事已完成 ======');
            console.log('[StoryReader] 故事已完成，没有更多页面');
            setIsGeneratingNextPage(false);
            setGenerationProgress({
              step: '',
              progress: 0,
              currentPage: 0,
              totalPages: 0
            });
            // 标记故事为完成
            if (streamingStory) {
              const completedStory: StreamingStory = {
                ...streamingStory,
                isComplete: true
              };
              updateStreamingStory(completedStory);
              setStorybook(completedStory);
              console.log('[StoryReader] ✅ 已标记故事为完成');
            }
          }
        } catch (error) {
          console.error('[StoryReader] ====== 生成下一页失败 ======');
          console.error('[StoryReader] 错误详情:', error);
          console.error('[StoryReader] 错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
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
      } else if (!generator) {
        console.warn('[StoryReader] ====== 生成器不存在 ======');
        console.warn('[StoryReader] 生成器不存在，无法继续生成');
        console.warn('[StoryReader] 可能的原因: 从数据库加载的故事没有生成器实例');
        toast({
          title: "无法继续生成",
          description: "生成器实例已丢失，请重新生成故事。",
          variant: "destructive",
        });
      } else {
        console.log('[StoryReader] ⚠️ 不满足生成条件:', {
          hasGenerator: !!generator,
          isLastPage: currentPageIndex === streamingStory.pages.length - 1,
          currentPageIndex,
          totalPages: streamingStory.pages.length
        });
      }
      console.log('[StoryReader] ====== 流式生成检查完成 ======');
    } else {
      console.log('[StoryReader] 不是流式故事或已完成:', {
        isStreamingStory,
        hasStreamingStory: !!streamingStory,
        isComplete: streamingStory?.isComplete
      });
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
                storyId={storybook.id}
                pageId={currentPage.id}
                pageNumber={currentPageIndex + 1}
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
              storyId={storybook.id}
              pageId={currentPage.id}
              pageNumber={currentPageIndex + 1}
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
