# Supabase 用户认证（Auth）设置指南

## 概述

本项目已集成 Supabase Auth，支持用户注册、登录、登出等功能。

## 已创建的文件

### 1. 认证服务
- **`src/services/authService.ts`** - 认证相关的 API 调用
  - `signUp()` - 用户注册
  - `signIn()` - 用户登录
  - `signOut()` - 用户登出
  - `getCurrentUser()` - 获取当前用户
  - `getSession()` - 获取当前会话
  - `resetPassword()` - 重置密码（发送邮件）
  - `updatePassword()` - 更新密码

### 2. 认证上下文
- **`src/contexts/AuthContext.tsx`** - React Context 提供全局认证状态
  - `AuthProvider` - 认证状态提供者
  - `useAuth()` - 获取认证状态的 Hook

### 3. UI 组件
- **`src/components/AuthForm.tsx`** - 登录/注册表单组件
- **`src/components/ProtectedRoute.tsx`** - 路由保护组件（需要登录才能访问）
- **`src/components/UserProfile.tsx`** - 用户信息显示组件

## 使用方式

### 1. 在组件中使用认证状态

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, session, loading } = useAuth();

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <div>请先登录</div>;
  }

  return <div>欢迎，{user.email}！</div>;
}
```

### 2. 保护路由

```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

// 在 App.tsx 中
<Route
  path="/protected"
  element={
    <ProtectedRoute>
      <YourProtectedComponent />
    </ProtectedRoute>
  }
/>
```

### 3. 手动登录/注册

```tsx
import { signIn, signUp } from '@/services/authService';

// 登录
await signIn({
  email: 'user@example.com',
  password: 'password123',
});

// 注册
await signUp({
  email: 'user@example.com',
  password: 'password123',
  metadata: {
    name: 'John Doe',
  },
});
```

## 路由配置

已添加以下路由：

- `/auth` - 登录/注册页面
- `/demo/items` - 受保护的路由（需要登录）

## Supabase 配置

### 1. 启用 Email 认证

1. 进入 Supabase Dashboard
2. 前往 **Authentication** > **Providers**
3. 确保 **Email** 提供商已启用

### 2. 配置 Email 模板（可选）

1. 前往 **Authentication** > **Email Templates**
2. 可以自定义：
   - 确认邮件模板
   - 重置密码邮件模板
   - 邀请邮件模板

### 3. 配置重定向 URL

1. 前往 **Authentication** > **URL Configuration**
2. 添加以下重定向 URL：
   - `http://localhost:8080` (开发环境)
   - `http://localhost:8080/auth` (开发环境)
   - 你的生产环境 URL

### 4. 配置 Site URL

在 **Authentication** > **URL Configuration** 中设置：
- **Site URL**: `http://localhost:8080` (开发环境)

## 数据库 RLS 策略（可选）

如果你想根据用户身份限制数据访问，可以更新 RLS 策略：

```sql
-- 示例：只允许用户访问自己的 items
-- 首先需要在 items 表中添加 user_id 列
ALTER TABLE items ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- 更新策略
DROP POLICY IF EXISTS "Allow public read access" ON items;
DROP POLICY IF EXISTS "Allow public insert" ON items;
DROP POLICY IF EXISTS "Allow public update" ON items;
DROP POLICY IF EXISTS "Allow public delete" ON items;

-- 只允许用户访问自己的数据
CREATE POLICY "Users can view own items" 
  ON items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items" 
  ON items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" 
  ON items FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" 
  ON items FOR DELETE 
  USING (auth.uid() = user_id);
```

然后更新 `itemService.ts` 中的创建函数：

```typescript
export const createItem = async (name: string, description?: string): Promise<Item> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('请先登录');
  }

  const { data, error } = await supabase
    .from('items')
    .insert({
      name,
      description: description || null,
      user_id: user.id, // 添加用户 ID
    })
    .select()
    .single();

  // ... 其余代码
};
```

## 测试认证功能

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问登录页面：
   ```
   http://localhost:8080/auth
   ```

3. 测试流程：
   - 注册新账号
   - 检查邮箱（开发环境可能需要在 Supabase Dashboard 查看）
   - 登录
   - 访问受保护的路由 `/demo/items`
   - 查看用户信息
   - 退出登录

## 常见问题

### 问题：注册后没有收到验证邮件

**解决方案**：
1. 检查垃圾邮件文件夹
2. 在 Supabase Dashboard 的 **Authentication** > **Users** 中查看用户状态
3. 开发环境可以暂时禁用邮箱验证（不推荐生产环境）

### 问题：登录后立即退出

**可能原因**：
- Session 存储配置问题
- 浏览器阻止了 localStorage

**解决方案**：
- 检查浏览器控制台是否有错误
- 确保 Supabase 客户端配置正确

### 问题：重置密码邮件链接无效

**解决方案**：
1. 确保在 Supabase Dashboard 中配置了正确的重定向 URL
2. 检查邮件中的链接是否包含正确的 redirect_to 参数

## 下一步

- [ ] 添加社交登录（Google, GitHub 等）
- [ ] 实现邮箱验证流程
- [ ] 添加密码强度验证
- [ ] 实现"记住我"功能
- [ ] 添加用户资料编辑功能
- [ ] 实现基于角色的访问控制（RBAC）

