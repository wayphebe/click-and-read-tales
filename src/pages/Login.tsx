import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useUserStore } from '../store/useUserStore';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, initialize } = useUserStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 如果已经登录，重定向到首页
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "请输入邮箱",
        description: "请输入您的邮箱地址",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;

      setMessage('登录链接已发送到您的邮箱，请查收！');
      toast({
        title: "邮件已发送",
        description: "请检查您的邮箱并点击登录链接",
      });
    } catch (error: any) {
      console.error('Error sending login email:', error);
      toast({
        title: "发送失败",
        description: error.message || "发送登录邮件时出现错误，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      await initialize();
      navigate('/login');
      
      toast({
        title: "已登出",
        description: "您已成功登出",
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "登出失败",
        description: error.message || "登出时出现错误",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-magical-background font-magical flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-yellow-300 animate-pulse">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="absolute top-40 right-20 text-pink-300 animate-pulse delay-1000">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="absolute bottom-20 left-1/4 text-blue-300 animate-pulse delay-2000">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="absolute bottom-40 right-1/3 text-purple-300 animate-pulse delay-3000">
          <Sparkles className="h-3 w-3" />
        </div>
      </div>

      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-3">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              点击阅读故事
            </span>
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            使用邮箱登录，开启你的故事之旅
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱地址</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
                {message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  发送登录链接
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 text-center mb-4">
              我们会向您的邮箱发送一个登录链接，点击链接即可登录，无需密码。
            </p>
          </div>

          {user && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full"
              >
                登出
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

