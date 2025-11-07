查看关键文件，总结当前的后端架构和数据库设计：


[6 tools called]


# 后端架构与数据库设计总结

## 一、整体架构

### 架构模式：BaaS（Backend as a Service）
- 使用 Supabase 作为后端服务
- 前端直接通过 Supabase Client 访问数据库
- 无独立后端服务器（Serverless 架构）

### 技术栈
- 数据库：Supabase (PostgreSQL)
- ORM/查询：Supabase JS Client
- 状态管理：React Query (TanStack Query)
- 认证：Supabase Auth
- 类型安全：TypeScript

---

## 二、项目结构

```
src/
├── lib/
│   ├── supabaseClient.ts    # Supabase 客户端初始化
│   └── db.ts                 # 数据库操作核心模块（通用 CRUD）
├── types/
│   └── database.ts           # 数据库类型定义
├── hooks/
│   └── useItems.ts          # Items 数据访问 Hooks
├── services/
│   ├── authService.ts       # 认证服务
│   └── itemService.ts       # Items 服务（已废弃，向后兼容）
└── contexts/
    └── AuthContext.tsx      # 认证上下文
```

---

## 三、数据访问架构（分层设计）

### 第 1 层：Supabase 客户端 (`lib/supabaseClient.ts`)
职责：初始化 Supabase 连接

功能：
- 环境变量验证
- 客户端配置（会话持久化、自动刷新 Token）
- 开发环境日志

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

### 第 2 层：数据库操作层 (`lib/db.ts`)
职责：封装通用数据库操作

核心函数：
- `dbQuery<T>()` - 通用查询（支持排序、过滤、分页）
- `dbFindById<T>()` - 根据 ID 查询
- `dbCreate<T>()` - 创建记录
- `dbUpdate<T>()` - 更新记录
- `dbDelete()` - 删除记录
- `dbCreateMany<T>()` - 批量创建
- `dbUpdateMany<T>()` - 批量更新
- `dbDeleteMany()` - 批量删除

特点：
- 统一错误处理（`handleDbError`）
- TypeScript 泛型支持
- 操作日志输出
- 错误代码映射（PGRST116, 23505, 42501 等）

### 第 3 层：类型定义层 (`types/database.ts`)
职责：定义数据库实体和输入类型

当前类型：
```typescript
export interface Item {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateItemInput {
  name: string;
  description?: string;
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
}
```

### 第 4 层：Hooks 层 (`hooks/useItems.ts`)
职责：提供 React Query hooks，管理数据状态和缓存

核心 Hooks：
- `useItems()` - 获取所有 items（自动缓存）
- `useItem(id)` - 获取单个 item
- `useCreateItem()` - 创建 mutation
- `useUpdateItem()` - 更新 mutation
- `useDeleteItem()` - 删除 mutation

特点：
- 自动缓存管理
- 自动重新获取
- 加载和错误状态
- 乐观更新支持

### 第 5 层：服务层 (`services/itemService.ts`)
状态：已废弃，保留用于向后兼容

说明：新代码应使用 hooks，而非服务层函数

---

## 四、数据流

```
React 组件
    ↓
Hooks (useItems, useCreateItem, ...)
    ↓
数据库操作层 (lib/db.ts)
    ↓
Supabase Client (lib/supabaseClient.ts)
    ↓
Supabase REST API
    ↓
PostgreSQL 数据库
```

---

## 五、数据库设计

### 当前表结构

#### 1. `items` 表
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

字段说明：
- `id`: UUID 主键，自动生成
- `name`: 名称（必填）
- `description`: 描述（可选）
- `created_at`: 创建时间（自动）
- `updated_at`: 更新时间（自动，通过触发器更新）

索引：
- `idx_items_created_at` - 按创建时间降序索引

触发器：
- `update_items_updated_at` - 更新时自动更新 `updated_at`

### 安全策略（RLS）

当前配置（开发阶段）：
```sql
-- 允许所有人读取
CREATE POLICY "Allow public read access" ON items FOR SELECT USING (true);

-- 允许所有人插入
CREATE POLICY "Allow public insert" ON items FOR INSERT WITH CHECK (true);

-- 允许所有人更新
CREATE POLICY "Allow public update" ON items FOR UPDATE USING (true);

-- 允许所有人删除
CREATE POLICY "Allow public delete" ON items FOR DELETE USING (true);
```

注意：生产环境应改为基于用户的策略

---

## 六、认证架构

### 认证服务 (`services/authService.ts`)

功能：
- `signUp()` - 用户注册
- `signIn()` - 用户登录
- `signOut()` - 用户登出
- `getCurrentUser()` - 获取当前用户
- `getSession()` - 获取当前会话
- `resetPassword()` - 重置密码（发送邮件）
- `updatePassword()` - 更新密码

### 认证上下文 (`contexts/AuthContext.tsx`)

功能：
- 全局认证状态管理
- 自动监听认证状态变化
- 提供 `useAuth()` hook

### 用户数据存储

位置：Supabase 的 `auth.users` 表（系统表）

包含字段：
- `id` - 用户 ID
- `email` - 邮箱
- `created_at` - 注册时间
- `email_confirmed_at` - 邮箱确认时间
- `last_sign_in_at` - 最后登录时间
- `raw_user_meta_data` - 用户元数据（如姓名）

---

## 七、错误处理机制

### 统一错误处理 (`lib/db.ts`)

错误代码映射：
- `PGRST116` → "记录不存在"
- `23505` → "数据已存在（唯一性约束冲突）"
- `42501` → "权限不足，请检查 RLS 策略"
- `42P01` → "表不存在"
- JWT 相关 → "认证失败"
- 网络相关 → "网络连接失败"

错误日志：
- 控制台输出详细错误信息
- 包含错误代码、消息、详情和提示

---

## 八、扩展性设计

### 添加新表的步骤

1. 在 Supabase 中创建表（SQL）
2. 在 `types/database.ts` 中定义类型
3. 创建对应的 hooks（如 `hooks/useProducts.ts`）
4. 在组件中使用 hooks

### 支持的功能扩展

- 分页查询（通过 `QueryOptions`）
- 过滤查询（通过 `filters`）
- 排序（通过 `orderBy` 和 `orderDirection`）
- 批量操作（`dbCreateMany`, `dbUpdateMany`, `dbDeleteMany`）
- 实时订阅（Supabase Realtime）

---

## 九、优势与特点

### 优势
1. 无服务器架构：无需维护后端服务器
2. 类型安全：完整的 TypeScript 支持
3. 自动缓存：React Query 自动管理
4. 模块化：清晰的层次结构
5. 可扩展：易于添加新表/实体
6. 实时能力：支持 Supabase Realtime

### 特点
- BaaS 架构，前端直接访问数据库
- 统一的错误处理
- 完整的类型定义
- 自动化的缓存管理
- 开发友好的日志输出

---

## 十、当前状态

### 已实现
- 数据库操作核心模块
- Items 表的完整 CRUD
- 用户认证系统
- 类型定义
- Hooks 层封装
- 错误处理机制

### 待优化（生产环境）
- RLS 策略改为基于用户的权限控制
- 添加数据验证层
- 添加分页支持
- 添加实时订阅
- 性能优化（查询优化、索引优化）

---

## 总结

采用 BaaS 架构，通过 Supabase 提供数据库和认证服务。代码采用分层设计，从客户端初始化到 Hooks 层，职责清晰。数据库设计简洁，当前以 `items` 表为主，支持扩展。整体架构模块化、类型安全，便于维护和扩展。