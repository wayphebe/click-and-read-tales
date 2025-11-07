# Supabase 数据库设置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project" 创建新项目
4. 填写项目信息：
   - Project Name: 你的项目名称
   - Database Password: 设置数据库密码（请妥善保存）
   - Region: 选择离你最近的区域

## 2. 获取 API 凭证

1. 项目创建完成后，进入项目 Dashboard
2. 前往 **Settings** > **API**
3. 复制以下信息：
   - **Project URL** (例如: `https://xxxxx.supabase.co`)
   - **anon/public key** (以 `eyJ...` 开头的长字符串)

## 3. 配置环境变量

1. 在项目根目录创建 `.env` 文件（如果不存在）
2. 添加以下内容：

```env
VITE_SUPABASE_URL=你的_Project_URL
VITE_SUPABASE_ANON_KEY=你的_anon_key
```

**注意**: `.env` 文件已添加到 `.gitignore`，不会被提交到版本控制。

## 4. 创建数据库表

1. 在 Supabase Dashboard 中，点击左侧菜单的 **SQL Editor**
2. 点击 **New Query**
3. 打开项目根目录的 `supabase_setup.sql` 文件
4. 复制所有 SQL 代码
5. 粘贴到 SQL Editor 中
6. 点击 **Run** 执行

执行成功后，你会看到：
- ✅ `items` 表已创建
- ✅ 索引已创建
- ✅ RLS 策略已配置
- ✅ 自动更新触发器已设置

## 5. 验证设置

1. 在 Supabase Dashboard 中，点击左侧菜单的 **Table Editor**
2. 你应该能看到 `items` 表
3. 表结构应该包含以下字段：
   - `id` (UUID, Primary Key)
   - `name` (Text, Not Null)
   - `description` (Text, Nullable)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

## 6. 运行项目

1. 确保已安装依赖：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 访问 demo 页面：
   ```
   http://localhost:8080/demo/items
   ```

## 7. 测试 CRUD 操作

在 `/demo/items` 页面，你可以测试：

- ✅ **Create**: 填写表单创建新的 item
- ✅ **Read**: 查看所有 items 列表
- ✅ **Update**: 点击"编辑"按钮修改 item
- ✅ **Delete**: 点击"删除"按钮删除 item

## 8. 安全注意事项

⚠️ **重要**: 当前配置的 RLS 策略允许所有人进行读写操作，这仅适用于开发阶段。

**生产环境建议**:
1. 实现用户认证（Supabase Auth）
2. 修改 RLS 策略，限制只有认证用户才能操作
3. 根据业务需求设置更细粒度的权限控制

示例生产环境策略：
```sql
-- 只允许认证用户读取
CREATE POLICY "Users can read own items" 
  ON items FOR SELECT 
  USING (auth.uid() = user_id);

-- 只允许认证用户插入
CREATE POLICY "Users can insert own items" 
  ON items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

## 9. 故障排查

### 问题：环境变量未加载
- 确保 `.env` 文件在项目根目录
- 确保变量名以 `VITE_` 开头
- 重启开发服务器

### 问题：连接失败
- 检查 Supabase URL 和 Key 是否正确
- 检查网络连接
- 查看浏览器控制台的错误信息

### 问题：RLS 策略阻止操作
- 在 Supabase Dashboard 的 **Authentication** > **Policies** 中检查策略
- 开发阶段可以使用 "Allow public access" 策略

## 10. 下一步

- 集成 Supabase Auth 实现用户认证
- 为故事书（storybooks）创建表结构
- 实现更复杂的数据关系（一对多、多对多）
- 使用 Supabase Realtime 实现实时数据同步
