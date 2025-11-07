/**
 * 数据库操作核心模块
 * 封装 Supabase 的通用操作，提供统一的错误处理和类型安全
 */

import { supabase } from './supabaseClient';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * 数据库操作结果类型
 */
export interface DbResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

/**
 * 查询选项
 */
export interface QueryOptions {
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

/**
 * 统一的错误处理函数
 */
export const handleDbError = (error: PostgrestError | null, operation: string): never => {
  if (!error) {
    throw new Error(`${operation}失败: 未知错误`);
  }

  // 详细的错误信息
  console.error(`❌ ${operation}错误:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });

  // 根据错误代码提供更友好的提示
  let userMessage = error.message;

  if (error.code === 'PGRST116') {
    userMessage = '记录不存在';
  } else if (error.code === '23505') {
    userMessage = '数据已存在（唯一性约束冲突）';
  } else if (error.code === '42501') {
    userMessage = '权限不足，请检查 RLS 策略';
  } else if (error.code === '42P01') {
    userMessage = '表不存在，请先在 Supabase 中创建表';
  } else if (error.message.includes('JWT')) {
    userMessage = '认证失败，请检查 Supabase 配置';
  } else if (error.message.includes('network') || error.message.includes('fetch')) {
    userMessage = '网络连接失败，请检查网络和 Supabase URL';
  }

  throw new Error(`${operation}失败: ${userMessage}`);
};

/**
 * 通用查询函数
 */
export const dbQuery = async <T>(
  table: string,
  options: QueryOptions = {}
): Promise<T[]> => {
  let query = supabase.from(table).select('*');

  // 应用排序
  if (options.orderBy) {
    query = query.order(options.orderBy, {
      ascending: options.orderDirection !== 'desc',
    });
  }

  // 应用过滤条件
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }

  // 应用分页
  if (options.limit) {
    const from = options.offset || 0;
    const to = from + options.limit - 1;
    query = query.range(from, to);
  }

  const { data, error } = await query;

  if (error) {
    handleDbError(error, '查询');
  }

  return (data as T[]) || [];
};

/**
 * 根据 ID 查询单条记录
 */
export const dbFindById = async <T>(
  table: string,
  id: string
): Promise<T | null> => {
  if (!id) {
    throw new Error('查询失败: ID 不能为空');
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 记录不存在，返回 null
      return null;
    }
    handleDbError(error, '查询');
  }

  return data as T | null;
};

/**
 * 创建记录
 */
export const dbCreate = async <T>(
  table: string,
  data: Record<string, any>
): Promise<T> => {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) {
    handleDbError(error, '创建');
  }

  if (!result) {
    throw new Error('创建失败: 未返回数据');
  }

  console.log(`✅ ${table} 创建成功:`, result);
  return result as T;
};

/**
 * 更新记录
 */
export const dbUpdate = async <T>(
  table: string,
  id: string,
  updates: Record<string, any>
): Promise<T> => {
  if (!id) {
    throw new Error('更新失败: ID 不能为空');
  }

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleDbError(error, '更新');
  }

  if (!data) {
    throw new Error('更新失败: 未返回数据');
  }

  console.log(`✅ ${table} 更新成功:`, data);
  return data as T;
};

/**
 * 删除记录
 */
export const dbDelete = async (table: string, id: string): Promise<void> => {
  if (!id) {
    throw new Error('删除失败: ID 不能为空');
  }

  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) {
    handleDbError(error, '删除');
  }

  console.log(`✅ ${table} 删除成功:`, id);
};

/**
 * 批量创建记录
 */
export const dbCreateMany = async <T>(
  table: string,
  items: Record<string, any>[]
): Promise<T[]> => {
  const { data, error } = await supabase
    .from(table)
    .insert(items)
    .select();

  if (error) {
    handleDbError(error, '批量创建');
  }

  return (data as T[]) || [];
};

/**
 * 批量更新记录
 */
export const dbUpdateMany = async <T>(
  table: string,
  updates: Array<{ id: string; data: Record<string, any> }>
): Promise<T[]> => {
  // Supabase 不支持批量更新，需要逐个更新
  const results = await Promise.all(
    updates.map(({ id, data }) => dbUpdate<T>(table, id, data))
  );

  return results;
};

/**
 * 批量删除记录
 */
export const dbDeleteMany = async (table: string, ids: string[]): Promise<void> => {
  const { error } = await supabase.from(table).delete().in('id', ids);

  if (error) {
    handleDbError(error, '批量删除');
  }

  console.log(`✅ ${table} 批量删除成功:`, ids.length, '条记录');
};

