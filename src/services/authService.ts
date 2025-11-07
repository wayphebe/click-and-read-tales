import { supabase } from '@/lib/supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  metadata?: {
    name?: string;
    [key: string]: any;
  };
}

export interface SignInData {
  email: string;
  password: string;
}

// 注册新用户
export const signUp = async (data: SignUpData): Promise<{ user: User | null; session: Session | null }> => {
  // 输入验证
  if (!data.email || !data.email.trim()) {
    throw new Error('邮箱不能为空');
  }

  if (!data.password || data.password.length < 6) {
    throw new Error('密码长度至少为 6 个字符');
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new Error('邮箱格式不正确');
  }

  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: data.metadata || {},
      },
    });

    if (error) {
      handleAuthError(error, '注册');
    }

    return {
      user: authData.user,
      session: authData.session,
    };
  } catch (error) {
    if (error instanceof Error && !error.message.includes('注册失败')) {
      handleAuthError(error as AuthError, '注册');
    }
    throw error;
  }
};

// 登录
export const signIn = async (data: SignInData): Promise<{ user: User; session: Session }> => {
  // 输入验证
  if (!data.email || !data.email.trim()) {
    throw new Error('邮箱不能为空');
  }

  if (!data.password) {
    throw new Error('密码不能为空');
  }

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password,
    });

    if (error) {
      handleAuthError(error, '登录');
    }

    if (!authData.user || !authData.session) {
      throw new Error('登录失败: 未返回用户数据');
    }

    return {
      user: authData.user,
      session: authData.session,
    };
  } catch (error) {
    if (error instanceof Error && !error.message.includes('登录失败')) {
      handleAuthError(error as AuthError, '登录');
    }
    throw error;
  }
};

// 登出
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      handleAuthError(error, '登出');
    }
  } catch (error) {
    if (error instanceof Error && !error.message.includes('登出失败')) {
      handleAuthError(error as AuthError, '登出');
    }
    throw error;
  }
};

// 获取当前用户
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      handleAuthError(error, '获取用户');
    }

    return user;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('获取用户失败')) {
      handleAuthError(error as AuthError, '获取用户');
    }
    return null;
  }
};

// 获取当前会话
export const getSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      handleAuthError(error, '获取会话');
    }

    return session;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('获取会话失败')) {
      handleAuthError(error as AuthError, '获取会话');
    }
    return null;
  }
};

// 重置密码（发送重置邮件）
export const resetPassword = async (email: string): Promise<void> => {
  if (!email || !email.trim()) {
    throw new Error('邮箱不能为空');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('邮箱格式不正确');
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      handleAuthError(error, '重置密码');
    }
  } catch (error) {
    if (error instanceof Error && !error.message.includes('重置密码失败')) {
      handleAuthError(error as AuthError, '重置密码');
    }
    throw error;
  }
};

// 更新密码
export const updatePassword = async (newPassword: string): Promise<void> => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('密码长度至少为 6 个字符');
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      handleAuthError(error, '更新密码');
    }
  } catch (error) {
    if (error instanceof Error && !error.message.includes('更新密码失败')) {
      handleAuthError(error as AuthError, '更新密码');
    }
    throw error;
  }
};

// 错误处理辅助函数
const handleAuthError = (error: AuthError | Error, operation: string): never => {
  console.error(`❌ ${operation}错误:`, error);

  let userMessage = error instanceof Error ? error.message : '未知错误';

  // 根据错误类型提供更友好的提示
  if (error instanceof Error) {
    if (error.message.includes('Invalid login credentials')) {
      userMessage = '邮箱或密码错误';
    } else if (error.message.includes('Email not confirmed')) {
      userMessage = '请先验证邮箱';
    } else if (error.message.includes('User already registered')) {
      userMessage = '该邮箱已被注册';
    } else if (error.message.includes('Password')) {
      userMessage = '密码不符合要求';
    } else if (error.message.includes('Email')) {
      userMessage = '邮箱格式不正确';
    }
  }

  throw new Error(`${operation}失败: ${userMessage}`);
};

