import { createClient } from '@supabase/supabase-js';

// 获取环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 详细的错误检查和提示
if (!supabaseUrl) {
  const errorMsg = `
❌ 缺少 VITE_SUPABASE_URL 环境变量

请检查：
1. 项目根目录是否有 .env 文件
2. .env 文件中是否包含: VITE_SUPABASE_URL=https://your-project.supabase.co
3. 是否重启了开发服务器（修改 .env 后需要重启）

当前环境变量值: ${import.meta.env.VITE_SUPABASE_URL || 'undefined'}
  `;
  console.error(errorMsg);
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  const errorMsg = `
❌ 缺少 VITE_SUPABASE_ANON_KEY 环境变量

请检查：
1. 项目根目录是否有 .env 文件
2. .env 文件中是否包含: VITE_SUPABASE_ANON_KEY=your-anon-key
3. 是否重启了开发服务器（修改 .env 后需要重启）

当前环境变量值: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '已设置（但可能为空）' : 'undefined'}
  `;
  console.error(errorMsg);
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// 验证 URL 格式
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  console.warn('⚠️  Supabase URL 格式可能不正确，应该以 http:// 或 https:// 开头');
}

// 验证 Key 格式（Supabase anon key 通常以 eyJ 开头）
if (!supabaseAnonKey.startsWith('eyJ')) {
  console.warn('⚠️  Supabase anon key 格式可能不正确，通常以 eyJ 开头');
}

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// 测试连接（仅在开发环境）
if (import.meta.env.DEV) {
  console.log('✅ Supabase 客户端已初始化');
  console.log('📍 URL:', supabaseUrl);
  console.log('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...');
}

