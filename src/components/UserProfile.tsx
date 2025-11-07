import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/services/authService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('已退出登录');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '退出失败');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>用户信息</CardTitle>
        <CardDescription>当前登录用户</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">邮箱</p>
          <p className="font-medium">{user.email}</p>
        </div>
        {user.user_metadata?.name && (
          <div>
            <p className="text-sm text-muted-foreground">姓名</p>
            <p className="font-medium">{user.user_metadata.name}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-muted-foreground">用户 ID</p>
          <p className="font-mono text-xs text-muted-foreground break-all">
            {user.id}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">注册时间</p>
          <p className="font-medium">
            {new Date(user.created_at).toLocaleString('zh-CN')}
          </p>
        </div>
        <Button variant="destructive" onClick={handleSignOut} className="w-full">
          退出登录
        </Button>
      </CardContent>
    </Card>
  );
}

