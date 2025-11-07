/**
 * Items 服务层
 * 使用 db 模块提供业务逻辑封装
 * 
 * @deprecated 推荐使用 hooks/useItems.ts 中的 hooks
 * 此文件保留用于向后兼容，新代码请使用 hooks
 */

import { dbQuery, dbFindById, dbCreate, dbUpdate, dbDelete } from '@/lib/db';
import type { Item, CreateItemInput, UpdateItemInput } from '@/types/database';

/**
 * 创建 Item
 * @deprecated 使用 useCreateItem hook
 */
export const createItem = async (name: string, description?: string): Promise<Item> => {
  const input: CreateItemInput = { name, description };
  return dbCreate<Item>('items', {
    name: input.name.trim(),
    description: input.description?.trim() || null,
  });
};

/**
 * 获取所有 Items
 * @deprecated 使用 useItems hook
 */
export const getItems = async (): Promise<Item[]> => {
  return dbQuery<Item>('items', {
    orderBy: 'created_at',
    orderDirection: 'desc',
  });
};

/**
 * 根据 ID 获取单个 Item
 * @deprecated 使用 useItem hook
 */
export const getItemById = async (id: string): Promise<Item | null> => {
  return dbFindById<Item>('items', id);
};

/**
 * 更新 Item
 * @deprecated 使用 useUpdateItem hook
 */
export const updateItem = async (
  id: string,
  updates: UpdateItemInput
): Promise<Item> => {
  const updateData: Record<string, any> = {};
  
  if (updates.name !== undefined) {
    updateData.name = updates.name.trim();
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description.trim() || null;
  }

  return dbUpdate<Item>('items', id, updateData);
};

/**
 * 删除 Item
 * @deprecated 使用 useDeleteItem hook
 */
export const deleteItem = async (id: string): Promise<void> => {
  return dbDelete('items', id);
};

// 导出类型以便向后兼容
export type { Item, CreateItemInput, UpdateItemInput };

