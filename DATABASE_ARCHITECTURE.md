# 数据库架构文档

## 📁 项目结构

```
src/
├── lib/
│   └── db.ts              # 数据库操作核心模块（通用 CRUD）
├── types/
│   └── database.ts         # 数据库类型定义
├── hooks/
│   └── useItems.ts        # Items 数据访问 Hooks
└── services/
    └── itemService.ts     # 服务层（向后兼容，已废弃）
```

## 🏗️ 架构层次

### 1. 数据访问层 (`lib/db.ts`)

**职责**：封装 Supabase 的底层操作，提供通用的数据库操作函数

**核心函数**：
- `dbQuery<T>()` - 通用查询
- `dbFindById<T>()` - 根据 ID 查询
- `dbCreate<T>()` - 创建记录
- `dbUpdate<T>()` - 更新记录
- `dbDelete()` - 删除记录
- `dbCreateMany<T>()` - 批量创建
- `dbUpdateMany<T>()` - 批量更新
- `dbDeleteMany()` - 批量删除

**特点**：
- ✅ 统一的错误处理
- ✅ 类型安全（TypeScript 泛型）
- ✅ 可复用的通用操作
- ✅ 详细的错误日志

**使用示例**：
```typescript
import { dbQuery, dbCreate } from '@/lib/db';
import type { Item } from '@/types/database';

// 查询所有 items
const items = await dbQuery<Item>('items', {
  orderBy: 'created_at',
  orderDirection: 'desc',
});

// 创建新 item
const newItem = await dbCreate<Item>('items', {
  name: '新项目',
  description: '描述',
});
```

### 2. 类型定义层 (`types/database.ts`)

**职责**：定义数据库相关的 TypeScript 类型

**包含**：
- 实体类型（如 `Item`）
- 输入类型（如 `CreateItemInput`, `UpdateItemInput`）

**使用示例**：
```typescript
import type { Item, CreateItemInput } from '@/types/database';

const input: CreateItemInput = {
  name: '新项目',
  description: '描述',
};
```

### 3. Hooks 层 (`hooks/useItems.ts`)

**职责**：提供 React Query hooks，管理数据状态和缓存

**核心 Hooks**：
- `useItems()` - 获取所有 items
- `useItem(id)` - 获取单个 item
- `useCreateItem()` - 创建 item 的 mutation
- `useUpdateItem()` - 更新 item 的 mutation
- `useDeleteItem()` - 删除 item 的 mutation

**特点**：
- ✅ 自动缓存管理
- ✅ 自动重新获取
- ✅ 加载和错误状态
- ✅ 乐观更新支持

**使用示例**：
```typescript
import { useItems, useCreateItem } from '@/hooks/useItems';

function MyComponent() {
  const { data: items, isLoading, error } = useItems();
  const createMutation = useCreateItem();

  const handleCreate = () => {
    createMutation.mutate(
      { name: '新项目', description: '描述' },
      {
        onSuccess: () => {
          console.log('创建成功！');
        },
      }
    );
  };

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      <button onClick={handleCreate}>创建</button>
    </div>
  );
}
```

### 4. 服务层 (`services/itemService.ts`)

**状态**：⚠️ 已废弃，保留用于向后兼容

**说明**：新代码应该直接使用 hooks，而不是服务层函数

## 🔄 数据流

```
组件 (Component)
    ↓
Hooks (useItems, useCreateItem, ...)
    ↓
数据库操作层 (lib/db.ts)
    ↓
Supabase Client (lib/supabaseClient.ts)
    ↓
Supabase 数据库
```

## 📝 添加新表/实体

### 步骤 1: 定义类型

在 `types/database.ts` 中添加：

```typescript
export interface Product {
  id: string;
  name: string;
  price: number;
  created_at: string;
}

export interface CreateProductInput {
  name: string;
  price: number;
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
}
```

### 步骤 2: 创建 Hooks

创建 `hooks/useProducts.ts`：

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbQuery, dbFindById, dbCreate, dbUpdate, dbDelete } from '@/lib/db';
import type { Product, CreateProductInput, UpdateProductInput } from '@/types/database';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => dbQuery<Product>('products', {
      orderBy: 'created_at',
      orderDirection: 'desc',
    }),
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => dbCreate<Product>('products', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// ... 其他 hooks
```

### 步骤 3: 在组件中使用

```typescript
import { useProducts, useCreateProduct } from '@/hooks/useProducts';

function ProductsList() {
  const { data: products } = useProducts();
  const createProduct = useCreateProduct();
  
  // ...
}
```

## 🎯 最佳实践

### ✅ 推荐做法

1. **使用 Hooks**：新代码应该使用 hooks 而不是直接调用服务层
2. **类型安全**：始终使用 TypeScript 类型
3. **错误处理**：在组件中处理 hooks 返回的错误
4. **缓存管理**：利用 React Query 的自动缓存

### ❌ 避免做法

1. **直接使用 db 模块**：不要在组件中直接调用 `dbQuery` 等函数
2. **绕过类型**：不要使用 `any` 类型
3. **忽略错误**：总是处理错误状态
4. **手动管理缓存**：让 React Query 自动管理

## 🔍 调试技巧

### 查看数据库操作日志

所有数据库操作都会在控制台输出日志：
```
✅ items 创建成功: {id: "...", name: "..."}
✅ items 更新成功: {id: "...", name: "..."}
✅ items 删除成功: abc-123
```

### 查看 React Query 状态

在组件中使用：
```typescript
const { data, isLoading, error, isFetching } = useItems();
console.log({ data, isLoading, error, isFetching });
```

### 查看缓存

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
const cachedData = queryClient.getQueryData(['items']);
console.log('缓存的数据:', cachedData);
```

## 🚀 扩展建议

### 1. 添加分页

```typescript
export const useItemsPaginated = (page: number, pageSize: number = 10) => {
  return useQuery({
    queryKey: ['items', 'paginated', page, pageSize],
    queryFn: () => dbQuery<Item>('items', {
      orderBy: 'created_at',
      orderDirection: 'desc',
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
  });
};
```

### 2. 添加过滤

```typescript
export const useItemsFiltered = (filters: { category?: string }) => {
  return useQuery({
    queryKey: ['items', 'filtered', filters],
    queryFn: () => dbQuery<Item>('items', {
      filters,
      orderBy: 'created_at',
      orderDirection: 'desc',
    }),
  });
};
```

### 3. 添加实时订阅

```typescript
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useItemsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('items-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'items',
      }, () => {
        // 数据变化时刷新缓存
        queryClient.invalidateQueries({ queryKey: ['items'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
```

## 📚 相关文档

- [Supabase 设置指南](./SUPABASE_SETUP.md)
- [认证设置指南](./AUTH_SETUP.md)
- [React Query 文档](https://tanstack.com/query/latest)

