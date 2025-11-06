# Supabase 集成指南

本文档说明如何在项目中使用 Supabase 数据库和认证功能。

## 📋 前置步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 等待项目初始化完成

### 2. 获取 API 凭证

1. 进入项目 Dashboard
2. 前往 **Settings** > **API**
3. 复制以下信息：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_KEY`

### 3. 配置环境变量

1. 复制 `.env.example` 为 `.env`
2. 填入你的 Supabase 凭证：

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 创建数据库表

1. 在 Supabase Dashboard 中，打开 **SQL Editor**
2. 复制 `supabase_schema.sql` 文件中的内容
3. 粘贴到 SQL Editor 并执行

这将创建以下表：
- `stories` - 故事数据
- `story_pages` - 故事页面
- `user_events` - 用户行为事件

### 5. 配置认证

1. 在 Supabase Dashboard 中，前往 **Authentication** > **Providers**
2. 确保 **Email** 提供者已启用
3. 配置 **Email Templates**（可选）：
   - 可以自定义登录邮件的模板

## 🚀 功能说明

### 用户认证

- **登录方式**：Magic Link（无密码登录）
- **登录页面**：`/login`
- **保护路由**：所有页面（除登录页）都需要登录

### 数据存储

- **故事数据**：自动保存到 `stories` 表
- **页面数据**：自动保存到 `story_pages` 表
- **用户事件**：自动记录到 `user_events` 表

### 事件追踪

系统会自动记录以下事件：

- `story_view` - 查看故事列表
- `story_start` - 开始阅读故事
- `story_complete` - 完成故事
- `page_view` - 查看页面
- `page_turn` - 翻页
- `interactive_click` - 点击交互元素
- `question_answer` - 回答问题
- `story_generate` - 生成故事
- `story_save` - 保存故事

## 📁 文件结构

### 新增文件

```
src/
├── services/
│   ├── supabaseClient.ts      # Supabase 客户端初始化
│   ├── storyService.ts         # 故事 CRUD 操作
│   └── eventService.ts         # 用户事件记录
├── store/
│   └── useUserStore.ts         # 用户状态管理
└── pages/
    └── Login.tsx               # 登录页面

supabase_schema.sql             # 数据库表结构
.env.example                    # 环境变量示例
```

### 修改的文件

- `src/App.tsx` - 添加路由保护和登录页
- `src/data/storybooksData.ts` - 添加从 Supabase 加载数据的方法
- `src/pages/Index.tsx` - 从 Supabase 加载故事，保存新故事
- `src/pages/StoryReader.tsx` - 从 Supabase 加载故事，记录用户事件

## 🔒 安全说明

### Row Level Security (RLS)

所有表都启用了 RLS，确保：
- 用户只能访问自己的数据
- 用户只能创建自己的故事
- 用户只能记录自己的事件

### 环境变量

- 不要将 `.env` 文件提交到 Git
- 生产环境使用环境变量或密钥管理服务

## 🐛 故障排除

### 1. 无法登录

- 检查 `.env` 文件中的凭证是否正确
- 检查 Supabase 项目是否正常运行
- 查看浏览器控制台的错误信息

### 2. 数据加载失败

- 检查数据库表是否已创建
- 检查 RLS 策略是否正确配置
- 检查网络连接

### 3. 事件记录失败

- 事件记录是异步的，失败不会影响主流程
- 查看浏览器控制台的错误信息
- 检查 `user_events` 表的 RLS 策略

## 📊 数据查询示例

### 查询用户的故事

```sql
SELECT * FROM stories 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC;
```

### 查询用户事件

```sql
SELECT * FROM user_events 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC;
```

### 统计故事完成率

```sql
SELECT 
  story_id,
  COUNT(*) FILTER (WHERE event_type = 'story_start') as starts,
  COUNT(*) FILTER (WHERE event_type = 'story_complete') as completes
FROM user_events
WHERE user_id = 'user-uuid'
GROUP BY story_id;
```

## 🎯 下一步

- [ ] 添加用户个人资料页面
- [ ] 添加故事分享功能
- [ ] 添加故事收藏功能
- [ ] 添加数据分析仪表板
- [ ] 优化数据加载性能

