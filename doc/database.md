检查关键文件以了解数据库架构。


[4 tools called]


继续查看其他关键文件，了解数据流和存储机制。


[4 tools called]


查看服务层文件，完善对数据流的理解：


[2 tools called]


## 数据库架构分析报告

### 一、当前数据库状况

#### 1. 存储方式
- 无传统数据库：未使用 MySQL、PostgreSQL、MongoDB 等
- 状态管理：使用 Zustand（内存存储）
- 持久化：无持久化，刷新页面数据丢失
- 存储位置：数据仅存在于浏览器内存

#### 2. 核心数据结构

```
Storybook (故事书)
├── id: string
├── title: string
├── cover: string (图片URL)
├── category: string
├── description: string
└── pages: StoryPage[]

StoryPage (故事页面)
├── id: string
├── background: string (图片URL)
├── text: string
├── interactiveElements: InteractiveElement[]
└── question?: StoryQuestion

InteractiveElement (交互元素)
├── id: string
├── emoji: string
├── x: number
├── y: number
├── sound?: string
└── reward?: string

StoryQuestion (故事问题)
├── id: string
├── question: string
└── options: QuestionOption[]

QuestionOption (问题选项)
├── id: string
├── text: string
├── emoji: string
├── isCorrect?: boolean
└── feedback: string
```

#### 3. 数据流

```
┌─────────────────┐
│ 硬编码默认故事   │ (storybooksData.ts)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Zustand Store   │ (内存状态管理)
│ - books[]        │
│ - currentStory   │
│ - isGenerating   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI生成新故事     │ (通过API生成)
│ - 文本生成       │
│ - 图片生成       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 添加到Store     │ (addBook)
└─────────────────┘
```

### 二、数据库框架方案

#### 方案A：本地存储方案（推荐用于MVP）

```typescript
// 数据持久化层
interface StorageLayer {
  // 故事数据
  stories: {
    save(story: Storybook): void;
    loadAll(): Storybook[];
    load(id: string): Storybook | null;
    delete(id: string): void;
  };
  
  // 用户数据
  user: {
    saveProgress(storyId: string, progress: ReadingProgress): void;
    loadProgress(storyId: string): ReadingProgress | null;
    saveCollection(bookIds: string[]): void;
    loadCollection(): string[];
  };
}

// 使用 IndexedDB 或 localStorage
```

影响范围：
- 修改文件：`src/data/storybooksData.ts`
- 新增文件：`src/services/storageService.ts`
- 影响组件：所有使用 `useStorybooksStore` 的组件

#### 方案B：后端数据库方案（推荐用于生产环境）

```sql
-- 数据库表结构设计

-- 故事表
CREATE TABLE stories (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  cover_url TEXT,
  category VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(36), -- 如果支持多用户
  is_public BOOLEAN DEFAULT false
);

-- 故事页面表
CREATE TABLE story_pages (
  id VARCHAR(36) PRIMARY KEY,
  story_id VARCHAR(36) REFERENCES stories(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  background_url TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 交互元素表
CREATE TABLE interactive_elements (
  id VARCHAR(36) PRIMARY KEY,
  page_id VARCHAR(36) REFERENCES story_pages(id) ON DELETE CASCADE,
  emoji VARCHAR(10),
  x_position DECIMAL(5,2),
  y_position DECIMAL(5,2),
  sound_url TEXT,
  reward_text TEXT
);

-- 故事问题表
CREATE TABLE story_questions (
  id VARCHAR(36) PRIMARY KEY,
  page_id VARCHAR(36) REFERENCES story_pages(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL
);

-- 问题选项表
CREATE TABLE question_options (
  id VARCHAR(36) PRIMARY KEY,
  question_id VARCHAR(36) REFERENCES story_questions(id) ON DELETE CASCADE,
  text VARCHAR(255) NOT NULL,
  emoji VARCHAR(10),
  is_correct BOOLEAN DEFAULT false,
  feedback_text TEXT
);

-- 用户阅读进度表
CREATE TABLE reading_progress (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  story_id VARCHAR(36) REFERENCES stories(id) ON DELETE CASCADE,
  current_page INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, story_id)
);

-- 用户收藏表
CREATE TABLE user_collections (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  story_id VARCHAR(36) REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, story_id)
);
```

影响范围：
- 新增后端服务：需要创建 REST API 或 GraphQL API
- 修改文件：
  - `src/data/storybooksData.ts` - 添加数据同步逻辑
  - `src/services/storyGeneration.ts` - 添加保存到数据库的逻辑
  - `src/services/streamingStoryGenerator.ts` - 添加保存到数据库的逻辑
- 新增文件：
  - `src/services/apiService.ts` - API 调用封装
  - `src/services/cacheService.ts` - 缓存管理
- 影响组件：
  - `src/pages/Index.tsx` - 需要处理加载状态
  - `src/pages/StoryReader.tsx` - 需要保存阅读进度

### 三、依赖项分析

当前依赖：
- `zustand@^5.0.6` - 状态管理（无持久化）

如采用方案A，需新增：
- 无需新增依赖（使用浏览器原生 API）

如采用方案B，需新增：
- `axios@^1.10.0` - 已存在，可用于 API 调用
- 或 `@tanstack/react-query@^5.56.2` - 已存在，可用于数据获取

### 四、改动影响范围总结

#### 最小改动（方案A - localStorage）
1. `src/data/storybooksData.ts` - 添加持久化逻辑
2. `src/pages/Index.tsx` - 添加加载状态处理
3. 影响范围：小，仅前端改动

#### 中等改动（方案A - IndexedDB）
1. `src/data/storybooksData.ts` - 重构数据层
2. `src/services/storageService.ts` - 新增存储服务
3. `src/pages/Index.tsx` - 异步加载处理
4. `src/pages/StoryReader.tsx` - 进度保存
5. 影响范围：中等，需要处理异步操作

#### 大改动（方案B - 后端数据库）
1. 后端服务（新建）
2. `src/data/storybooksData.ts` - 完全重构
3. `src/services/apiService.ts` - 新增 API 服务
4. `src/services/storyGeneration.ts` - 添加保存逻辑
5. `src/services/streamingStoryGenerator.ts` - 添加保存逻辑
6. 所有使用 Store 的组件 - 添加错误处理和加载状态
7. 影响范围：大，需要前后端协同开发

### 五、建议

- 短期（MVP）：采用方案A（localStorage），快速实现持久化
- 中期：升级到 IndexedDB，支持更大数据量
- 长期（生产）：采用方案B，支持多用户、数据同步、云端存储

### 六、关键风险点

1. 数据丢失：当前无持久化，刷新即丢失
2. 性能：大量故事数据可能导致内存压力
3. 扩展性：硬编码数据难以管理
4. 用户体验：无法保存阅读进度和收藏

---
查看相关文件，总结当前数据库情况：


[4 tools called]


## 数据库架构总结

### 一、数据库表结构（3个表）

#### 1. `stories` 表（故事主表）
```sql
- id: UUID (主键，自动生成)
- title: TEXT (必填)
- cover_url: TEXT (封面图片URL)
- description: TEXT (故事描述)
- category: TEXT (分类)
- created_at: TIMESTAMP (自动生成)
- user_id: UUID (外键 → auth.users，级联删除)
```

#### 2. `story_pages` 表（故事页面表）
```sql
- id: UUID (主键，自动生成)
- story_id: UUID (外键 → stories.id，级联删除)
- background_url: TEXT (背景图片URL)
- text: TEXT (必填，页面文本)
- page_number: INTEGER (页码)
- created_at: TIMESTAMP (自动生成)
```

#### 3. `user_events` 表（用户事件表）
```sql
- id: UUID (主键，自动生成)
- user_id: UUID (外键 → auth.users，级联删除)
- story_id: UUID (外键 → stories.id，可选，级联删除)
- event_type: TEXT (必填，事件类型)
- metadata: JSONB (事件元数据，默认空对象)
- created_at: TIMESTAMP (自动生成)
```

### 二、索引配置（7个索引）

- `idx_stories_user_id` - 按用户查询故事
- `idx_stories_created_at` - 按时间排序
- `idx_story_pages_story_id` - 查询故事页面
- `idx_story_pages_page_number` - 页面排序
- `idx_user_events_user_id` - 查询用户事件
- `idx_user_events_story_id` - 查询故事相关事件
- `idx_user_events_event_type` - 按事件类型查询
- `idx_user_events_created_at` - 按时间排序事件

### 三、安全策略（Row Level Security）

所有表已启用 RLS，策略如下：

#### `stories` 表策略
- SELECT: 只能查看自己的故事 (`auth.uid() = user_id`)
- INSERT: 只能创建自己的故事
- UPDATE: 只能更新自己的故事
- DELETE: 只能删除自己的故事

#### `story_pages` 表策略
- 所有操作：只能操作自己故事的页面（通过 `story_id` 关联检查）

#### `user_events` 表策略
- SELECT: 只能查看自己的事件
- INSERT: 只能创建自己的事件

### 四、数据流

#### 故事数据流
```
前端生成故事 → saveStory() → 数据库生成UUID → 返回完整故事对象
```

#### 事件记录流
```
用户操作 → logUserEvent() → 验证UUID格式 → 插入user_events表
```

### 五、已修复的问题

1. UUID 格式错误（22P02）
   - 问题：前端生成的短ID（如 "4v3sdxa5i"）被写入 UUID 字段
   - 修复：`saveStory()` 不再传入前端 id，由数据库生成 UUID
   - 修复：`logUserEvent()` 仅在 `story_id` 为有效 UUID 时写入

2. 数据一致性
   - 所有故事 ID 由数据库生成（UUID）
   - 事件记录使用数据库返回的 UUID
   - 页面关联使用正确的 `story_id`

### 六、当前数据状态

#### 支持的操作
- 创建故事：自动生成 UUID，保存到 `stories` 和 `story_pages`
- 查询故事：按用户ID查询，支持单条和列表
- 更新故事：更新基本信息，重建页面数据
- 删除故事：级联删除相关页面和事件
- 事件记录：支持 11 种事件类型，自动验证 UUID

#### 事件类型（11种）
1. `story_view` - 查看故事列表
2. `story_start` - 开始阅读故事
3. `story_complete` - 完成故事
4. `page_view` - 查看页面
5. `page_turn` - 翻页
6. `interactive_click` - 点击交互元素
7. `question_answer` - 回答问题
8. `story_generate` - 生成故事
9. `story_save` - 保存故事
10. `story_delete` - 删除故事

#### 数据限制
- `interactiveElements` 和 `question` 暂未持久化（页面数据中为空）
- 事件记录失败不影响主流程（静默失败）
- 所有操作需要用户登录（RLS 保护）

### 七、待优化项

1. 数据完整性
   - 将 `interactiveElements` 和 `question` 存入数据库（可用 JSONB 字段或单独表）

2. 性能优化
   - 添加分页查询
   - 使用 React Query 缓存
   - 批量事件记录优化

3. 功能扩展
   - 故事收藏功能
   - 故事分享功能
   - 数据分析仪表板

### 八、数据库健康状态

- 表结构：已创建并配置
- 索引：已创建，覆盖常用查询
- 安全策略：RLS 已启用，策略已配置
- 数据完整性：外键约束正常
- UUID 处理：已修复，由数据库生成
- 错误处理：已实现，失败不影响主流程

总结：数据库架构已就绪，安全策略已配置，UUID 问题已修复，可正常使用。
