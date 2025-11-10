总结问题与排查方法：


[3 tools called]


## 问题总结

### 核心问题
1. `storybook` 为 `null`：组件渲染时故事对象不存在
2. `storybook.pages[0].question` 为 `undefined`：即使 storybook 存在，第一页也没有问题选项
3. `currentPage` 为 `undefined`：因为 storybook 为 null，无法获取当前页面

### 问题根源分析

#### 问题1：时序问题
- `useEffect` 在 `storybook` 加载完成前执行
- 初始化时 `currentStory` 可能为 `null`，导致 `storybook` 初始化为 `null`
- 加载是异步的，组件可能在加载完成前渲染

#### 问题2：ID 不匹配
- 流式故事生成时使用生成器 ID
- 保存到数据库后使用数据库 UUID
- 如果导航使用数据库 ID，但 store 中仍是生成器 ID，会导致不匹配

#### 问题3：数据丢失
- 数据库 schema 中没有 `question` 字段
- 保存时 `question` 未写入数据库
- 从数据库加载时 `question` 为 `undefined`

## 排查方法

### 1. 检查初始化日志
查看控制台中的：
```
[StoryReader] 初始化 storybook: {
  hasCurrentStory: true/false,
  currentStoryId: "...",
  requestedId: "...",
  hasBookInStore: true/false,
  initialStorybook: "存在"/"null"
}
```
- 如果 `hasCurrentStory: false` → store 中的 `currentStory` 为 null
- 如果 `hasBookInStore: false` → store 中没有该 ID 的故事
- 如果 `initialStorybook: "null"` → 需要从数据库加载

### 2. 检查加载流程日志
查看：
```
[StoryReader] ====== 开始加载故事 ======
[StoryReader] 请求的 ID: "..."
[StoryReader] currentStory: ...
```
- 如果显示 "从数据库加载故事" → 说明 store 中没有找到
- 如果显示 "ID 匹配，使用 store 中的 currentStory" → 说明找到了

### 3. 检查生成流程日志
查看：
```
[generateStoryPageWithChoices] ====== LLM 原始响应 ======
[parseStoryPageWithChoices] ====== 解析结果 ======
[generateStory] ====== 第一页创建完成 ======
[Index] streamingStory.pages[0].question (JSON): ...
```
- 如果 LLM 响应中没有 `CHOICE_1` 和 `CHOICE_2` → LLM 未按格式返回
- 如果解析后 `choices.length === 0` → 解析失败
- 如果 `firstPage.question` 为 `undefined` → 创建第一页时未设置 question

### 4. 检查保存流程日志
查看：
```
[Index] ====== 保存故事到数据库 ======
[saveStory] story.pages[0].question (JSON): ...
```
- 如果保存前 question 存在，但保存后丢失 → 数据库保存逻辑问题
- 如果保存前 question 就是 undefined → 生成阶段的问题

## 建议的修复方案

### 方案1：修复时序问题
确保 `storybook` 在渲染前已加载：

```typescript
// 在 StoryReader.tsx 中
// 确保 loading 状态正确管理
useEffect(() => {
  // 如果 storybook 为 null 且不在加载中，说明加载失败
  if (!storybook && !loading) {
    console.error('[StoryReader] storybook 加载失败或不存在');
    // 可以尝试重新加载或显示错误
  }
}, [storybook, loading]);
```

### 方案2：修复 ID 匹配问题
确保使用正确的 ID：

```typescript
// 在 Index.tsx 中，保存后立即更新 store
const updatedStreamingStory: StreamingStory = {
  ...streamingStory,
  id: savedStory.id  // 使用数据库 ID
};
updateStreamingStory(updatedStreamingStory);
addBook(updatedStreamingStory);

// 导航时使用数据库 ID
navigate(`/story/${savedStreamingId}`);
```

### 方案3：确保 question 字段存在
在生成阶段强制添加 question：

```typescript
// 在 streamingStoryGenerator.ts 中
// 确保第一页始终有问题选项
if (!firstPage.question && !firstPageData.isLastPage) {
  // 强制添加默认问题选项
  firstPage.question = { ... };
}
```

## 下一步行动

请提供以下控制台日志，以便定位问题：

1. `[StoryReader] 初始化 storybook` - 查看初始化状态
2. `[StoryReader] ====== 开始加载故事 ======` - 查看加载流程
3. `[generateStoryPageWithChoices] ====== LLM 原始响应 ======` - 查看 LLM 返回
4. `[parseStoryPageWithChoices] ====== 解析结果 ======` - 查看解析结果
5. `[generateStory] ====== 第一页创建完成 ======` - 查看第一页 question
6. `[Index] streamingStory.pages[0].question (JSON)` - 查看保存到 store 时的状态

这些日志将帮助确定问题发生在哪个环节。