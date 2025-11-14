查看项目中的现有文档，了解文档风格，然后编写部署总结文档。


[2 tools called]


编写 Vercel 部署总结文档，参考项目现有文档风格：


[1 tool called]


以下是 Vercel 部署总结文档，请创建 `VERCEL_DEPLOYMENT.md` 文件并复制以下内容：

```markdown
# Vercel 部署指南

本文档详细说明如何将 Click and Read Tales 应用部署到 Vercel 平台。

## 📋 部署前准备

### 1. 项目信息

- **框架**: Vite + React + TypeScript
- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **Node 版本**: 推荐 18.x 或更高

### 2. 必需的环境变量

项目需要以下环境变量：

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_KEY` | Supabase Anon Key | Supabase Dashboard > Settings > API |

### 3. 检查清单

部署前请确认：

- [ ] 代码已推送到 GitHub 仓库
- [ ] Supabase 项目已创建并配置完成
- [ ] 数据库表已创建（执行 `supabase_schema.sql`）
- [ ] 本地环境可以正常构建（`npm run build`）
- [ ] 本地环境可以正常运行（`npm run dev`）

## 🚀 部署方法

### 方法一：通过 Vercel 网站部署（推荐）

#### 步骤 1: 登录 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 授权 Vercel 访问你的 GitHub 仓库

#### 步骤 2: 导入项目

1. 点击 **"Add New Project"** 或 **"Import Project"**
2. 在仓库列表中找到 `click-and-read-tales`
3. 如果看不到仓库，点击 **"Adjust GitHub App Permissions"** 授权访问

#### 步骤 3: 配置项目设置

在项目配置页面：

- **Framework Preset**: 选择 **"Vite"**（或保持自动检测）
- **Root Directory**: 留空（使用根目录）
- **Build Command**: `npm run build`（默认）
- **Output Directory**: `dist`（默认）
- **Install Command**: `npm install`（默认）
- **Node.js Version**: 选择 18.x 或更高

#### 步骤 4: 配置环境变量

在 **"Environment Variables"** 部分添加：

1. 点击 **"Add"** 添加第一个变量：
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: 你的 Supabase 项目 URL
   - **Environment**: 选择 `Production`, `Preview`, `Development`（全选）

2. 点击 **"Add"** 添加第二个变量：
   - **Name**: `VITE_SUPABASE_KEY`
   - **Value**: 你的 Supabase Anon Key
   - **Environment**: 选择 `Production`, `Preview`, `Development`（全选）

> 💡 **提示**: 环境变量可以在部署后随时修改，修改后需要重新部署才会生效。

#### 步骤 5: 部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（通常 1-3 分钟）
3. 构建成功后，Vercel 会提供一个部署 URL（如 `https://your-project.vercel.app`）

#### 步骤 6: 验证部署

1. 访问部署 URL
2. 检查应用是否正常加载
3. 测试登录功能
4. 检查浏览器控制台是否有错误

### 方法二：通过 Vercel CLI 部署

#### 步骤 1: 安装 Vercel CLI

```bash
npm i -g vercel
```

#### 步骤 2: 登录

```bash
vercel login
```

按照提示在浏览器中完成登录。

#### 步骤 3: 初始化项目

在项目根目录运行：

```bash
vercel
```

按提示操作：
- **Set up and deploy?** → 输入 `Y`
- **Which scope?** → 选择你的账号
- **Link to existing project?** → 输入 `N`（首次部署）
- **What's your project's name?** → 使用默认名称或自定义
- **In which directory is your code located?** → 输入 `./`
- **Want to override the settings?** → 输入 `N`

#### 步骤 4: 配置环境变量

```bash
# 添加 Supabase URL
vercel env add VITE_SUPABASE_URL

# 添加 Supabase Key
vercel env add VITE_SUPABASE_KEY
```

每次添加变量时：
- 选择环境：`Production`, `Preview`, `Development`（建议全选）
- 输入对应的值

#### 步骤 5: 部署到生产环境

```bash
vercel --prod
```

## ⚙️ 配置文件

### vercel.json（可选但推荐）

在项目根目录创建 `vercel.json` 文件，确保 SPA 路由正常工作：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**说明**:
- `rewrites` 配置确保所有路由都指向 `index.html`，这对于 React Router 的客户端路由是必需的
- 其他配置项通常可以自动检测，但显式配置可以避免问题

## 🔧 部署后配置

### 1. 自定义域名

1. 在 Vercel 项目页面，点击 **"Settings"** > **"Domains"**
2. 输入你的域名（如 `app.yourdomain.com`）
3. 按照提示配置 DNS 记录：
   - **类型**: CNAME
   - **名称**: `app`（或 `@` 用于根域名）
   - **值**: `cname.vercel-dns.com`
4. 等待 DNS 生效（通常几分钟到几小时）

### 2. 环境变量管理

- **修改环境变量**: Settings > Environment Variables
- **不同环境**: 可以为 Production、Preview、Development 设置不同的值
- **重新部署**: 修改环境变量后，需要重新部署才能生效

### 3. 自动部署

Vercel 默认配置：
- **生产环境**: 推送到 `main` 分支自动触发部署
- **预览环境**: 每个 Pull Request 自动创建预览部署
- **分支部署**: 推送到其他分支也会创建预览部署

可以在 **Settings** > **Git** 中配置分支和部署行为。

## 🐛 常见问题排查

### 1. 构建失败

**问题**: 部署时构建失败

**排查步骤**:
1. 检查 Vercel 构建日志中的错误信息
2. 确认本地可以正常构建：`npm run build`
3. 检查 `package.json` 中的依赖是否正确
4. 确认 Node.js 版本兼容性

**常见原因**:
- 缺少依赖
- TypeScript 类型错误
- 环境变量未配置

### 2. 页面空白或 404

**问题**: 部署后页面显示空白或刷新后 404

**解决方案**:
1. 确认已创建 `vercel.json` 并配置了 `rewrites`
2. 检查路由配置是否正确
3. 查看浏览器控制台的错误信息

### 3. Supabase 连接失败

**问题**: 无法连接到 Supabase

**排查步骤**:
1. 检查环境变量是否正确配置
2. 确认环境变量值是否正确（无多余空格）
3. 检查 Supabase 项目的 CORS 设置
4. 在 Supabase Dashboard 中添加 Vercel 域名到允许列表

**Supabase CORS 配置**:
1. 进入 Supabase Dashboard
2. 前往 **Settings** > **API**
3. 在 **CORS** 部分添加你的 Vercel 域名

### 4. 环境变量未生效

**问题**: 修改环境变量后应用仍使用旧值

**解决方案**:
1. 环境变量修改后需要重新部署
2. 在 Vercel 控制台手动触发重新部署
3. 确认环境变量作用域（Production/Preview/Development）正确

### 5. 构建时间过长

**问题**: 构建时间超过预期

**优化建议**:
1. 检查 `node_modules` 大小，移除不必要的依赖
2. 使用 Vercel 的缓存功能
3. 优化构建脚本
4. 考虑使用 Vercel 的 Edge Functions（如适用）

## 📊 部署状态监控

### 查看部署历史

1. 在 Vercel 项目页面，点击 **"Deployments"** 标签
2. 查看所有部署记录
3. 点击特定部署查看详细日志

### 部署通知

可以在 **Settings** > **Notifications** 中配置：
- 部署成功/失败通知
- 邮件通知
- Slack/Discord 集成

## 🔄 回滚部署

如果需要回滚到之前的版本：

1. 在 **Deployments** 页面找到要回滚的部署
2. 点击部署右侧的 **"..."** 菜单
3. 选择 **"Promote to Production"**

## 📝 最佳实践

### 1. 环境分离

- **Production**: 生产环境，使用生产 Supabase 项目
- **Preview**: 预览环境，可以使用测试 Supabase 项目
- **Development**: 本地开发环境

### 2. 安全建议

- ✅ 不要在代码中硬编码敏感信息
- ✅ 使用环境变量管理配置
- ✅ 定期更新依赖包
- ✅ 启用 Vercel 的安全功能（如适用）

### 3. 性能优化

- 使用 Vercel 的 CDN 加速
- 启用自动压缩
- 优化图片和静态资源
- 使用代码分割减少初始加载时间

### 4. 监控和分析

- 集成 Vercel Analytics（如需要）
- 监控错误日志
- 跟踪性能指标

## 🎯 部署检查清单

部署完成后，请验证以下功能：

- [ ] 应用可以正常访问
- [ ] 登录功能正常
- [ ] 故事列表可以加载
- [ ] 故事阅读功能正常
- [ ] 故事生成功能正常
- [ ] 用户事件记录正常
- [ ] 路由跳转正常（刷新页面不会 404）
- [ ] 移动端显示正常
- [ ] 浏览器控制台无错误

## 📚 相关文档

- [Vercel 官方文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Supabase 设置指南](./SUPABASE_SETUP.md)
- [项目实现总结](./IMPLEMENTATION_SUMMARY.md)

## 🆘 获取帮助

如果遇到问题：

1. 查看 Vercel 构建日志
2. 检查浏览器控制台错误
3. 参考 [Vercel 故障排除文档](https://vercel.com/docs/concepts/deployments/troubleshooting)
4. 联系 Vercel 支持

---

**最后更新**: 2024年

**维护者**: 项目团队
```

将以上内容保存为 `VERCEL_DEPLOYMENT.md` 文件。文档包含：

1. 部署前准备：环境变量、检查清单
2. 两种部署方法：网站和 CLI
3. 配置文件说明：`vercel.json`
4. 部署后配置：域名、环境变量、自动部署
5. 常见问题排查：构建失败、路由问题、Supabase 连接等
6. 最佳实践：安全、性能、监控
7. 部署检查清单

需要我帮你创建这个文件，或对文档内容进行调整吗？