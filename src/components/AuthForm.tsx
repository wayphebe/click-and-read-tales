import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, signIn, type SignUpData, type SignInData } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
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

type AuthMode = 'signin' | 'signup';

export default function AuthForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });

  // 如果已登录，重定向
  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        // 注册
        if (formData.password !== formData.confirmPassword) {
          toast.error('两次输入的密码不一致');
          setLoading(false);
          return;
        }

        const signUpData: SignUpData = {
          email: formData.email,
          password: formData.password,
          metadata: formData.name ? { name: formData.name } : undefined,
        };

        await signUp(signUpData);
        toast.success('注册成功！请检查邮箱验证链接');
        setFormData({ email: '', password: '', name: '', confirmPassword: '' });
        setMode('signin');
      } else {
        // 登录
        const signInData: SignInData = {
          email: formData.email,
          password: formData.password,
        };

        await signIn(signInData);
        toast.success('登录成功！');
        navigate('/');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'signin' ? '登录' : '注册'}</CardTitle>
          <CardDescription>
            {mode === 'signin'
              ? '使用邮箱和密码登录'
              : '创建新账号'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  姓名（可选）
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="输入您的姓名"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                邮箱 *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                密码 *
              </label>
              <Input
                id="password"
                type="password"
                placeholder={mode === 'signup' ? '至少 6 个字符' : '输入密码'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={mode === 'signup' ? 6 : undefined}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  确认密码 *
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '处理中...' : mode === 'signin' ? '登录' : '注册'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setFormData({ email: '', password: '', name: '', confirmPassword: '' });
              }}
            >
              {mode === 'signin' ? '还没有账号？注册' : '已有账号？登录'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

