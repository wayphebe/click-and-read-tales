/**
 * Items 数据访问 Hook
 * 使用 React Query 管理 Items 的状态和缓存
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbQuery, dbFindById, dbCreate, dbUpdate, dbDelete } from '@/lib/db';
import type { Item, CreateItemInput, UpdateItemInput } from '@/types/database';

/**
 * 获取所有 Items
 */
export const useItems = () => {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => dbQuery<Item>('items', { orderBy: 'created_at', orderDirection: 'desc' }),
  });
};

/**
 * 根据 ID 获取单个 Item
 */
export const useItem = (id: string | undefined) => {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => {
      if (!id) return null;
      return dbFindById<Item>('items', id);
    },
    enabled: !!id,
  });
};

/**
 * 创建 Item 的 Mutation
 */
export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateItemInput) => {
      // 输入验证
      if (!input.name || input.name.trim().length === 0) {
        throw new Error('名称不能为空');
      }

      if (input.name.length > 255) {
        throw new Error('名称长度不能超过 255 个字符');
      }

      return dbCreate<Item>('items', {
        name: input.name.trim(),
        description: input.description?.trim() || null,
      });
    },
    onSuccess: () => {
      // 使 items 列表缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

/**
 * 更新 Item 的 Mutation
 */
export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateItemInput }) => {
      // 输入验证
      if (input.name !== undefined) {
        if (!input.name || input.name.trim().length === 0) {
          throw new Error('名称不能为空');
        }
        if (input.name.length > 255) {
          throw new Error('名称长度不能超过 255 个字符');
        }
      }

      const updateData: Record<string, any> = {};
      if (input.name !== undefined) {
        updateData.name = input.name.trim();
      }
      if (input.description !== undefined) {
        updateData.description = input.description.trim() || null;
      }

      return dbUpdate<Item>('items', id, updateData);
    },
    onSuccess: (data, variables) => {
      // 更新缓存
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items', variables.id] });
    },
  });
};

/**
 * 删除 Item 的 Mutation
 */
export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return dbDelete('items', id);
    },
    onSuccess: () => {
      // 使 items 列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

