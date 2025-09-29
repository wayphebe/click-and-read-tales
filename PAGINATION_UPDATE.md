# 翻页模式修改说明

## 问题描述
用户反馈故事阅读变成了瀑布式浏览，需要恢复一页一页翻页的模式。

## 修改内容

### 1. 恢复翻页模式
- **之前**：显示所有页面，用户需要滚动浏览
- **现在**：只显示当前页面，用户通过翻页按钮或键盘导航

### 2. 翻页导航
- **左右箭头按钮**：固定在底部中央
- **键盘导航**：支持 ← → 键和空格键翻页
- **页面指示器**：显示当前页/总页数
- **进度条**：底部显示阅读进度

### 3. 流式生成集成
- 保持流式生成功能
- 当前页面图片未生成时显示加载状态
- 页面状态指示器（准备中/生成中/已完成）
- 实时进度提示

## 技术实现

### 核心修改
```typescript
// 只显示当前页面，而不是所有页面
const currentPage = storybook.pages[currentPageIndex] as StreamingPage;

// 翻页逻辑
const handleNextPage = () => {
  if (!isLastPage) {
    setCurrentPageIndex(prev => prev + 1);
  }
};

const handlePrevPage = () => {
  if (!isFirstPage) {
    setCurrentPageIndex(prev => prev - 1);
  }
};
```

### 键盘导航
```typescript
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
```

## 用户体验

### 翻页体验
- ✅ 一页一页翻页，符合传统阅读习惯
- ✅ 支持鼠标点击和键盘导航
- ✅ 清晰的页面指示和进度显示
- ✅ 流畅的翻页动画

### 流式生成体验
- ✅ 当前页面图片未生成时显示加载状态
- ✅ 页面状态实时更新
- ✅ 生成进度实时反馈
- ✅ 错误处理和降级策略

## 测试建议

1. **基本翻页**：测试左右箭头按钮和键盘导航
2. **流式生成**：测试快速模式下的翻页体验
3. **状态显示**：验证页面状态指示器正常工作
4. **响应式**：在不同设备上测试翻页体验

## 文件修改
- `src/pages/StoryReader.tsx` - 主要修改文件
- 保持其他流式生成相关文件不变

修改完成！现在用户可以享受传统的一页一页翻页阅读体验，同时保持流式生成的快速加载优势。
