import { useState } from 'react';
import {
  useItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from '@/hooks/useItems';
import type { Item } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import UserProfile from './UserProfile';

export default function ItemsDemo() {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // 使用 hooks 获取数据
  const { data: items = [], isLoading, error } = useItems();
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('请输入名称');
      return;
    }

    if (editingItem) {
      updateMutation.mutate(
        {
          id: editingItem.id,
          input: {
            name: formData.name,
            description: formData.description || undefined,
          },
        },
        {
          onSuccess: () => {
            setEditingItem(null);
            setFormData({ name: '', description: '' });
            toast.success('Item 更新成功！');
          },
          onError: (error: Error) => {
            toast.error(`更新失败: ${error.message}`);
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          name: formData.name,
          description: formData.description || undefined,
        },
        {
          onSuccess: () => {
            setFormData({ name: '', description: '' });
            toast.success('Item 创建成功！');
          },
          onError: (error: Error) => {
            toast.error(`创建失败: ${error.message}`);
          },
        }
      );
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
    });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个 item 吗？')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success('Item 删除成功！');
        },
        onError: (error: Error) => {
          toast.error(`删除失败: ${error.message}`);
        },
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <UserProfile />
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Supabase CRUD Demo - Items 管理</CardTitle>
          <CardDescription>
            这是一个完整的 CRUD 操作示例，展示如何与 Supabase 数据库交互
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                名称 *
              </label>
              <Input
                id="name"
                type="text"
                placeholder="输入 item 名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                描述
              </label>
              <Input
                id="description"
                type="text"
                placeholder="输入 item 描述（可选）"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || isLoading}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? '处理中...'
                  : editingItem
                  ? '更新'
                  : '创建'}
              </Button>
              {editingItem && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  取消
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items 列表</CardTitle>
          <CardDescription>
            {isLoading ? '加载中...' : `共 ${items.length} 个 items`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4">
              错误: {error instanceof Error ? error.message : '未知错误'}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无数据，请创建一个 item
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="border">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          创建时间: {new Date(item.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending || isLoading}
                        >
                          {deleteMutation.isPending ? '删除中...' : '删除'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

