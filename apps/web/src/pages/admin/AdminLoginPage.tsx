import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore.js';
import { useTheme } from '../../store/themeStore.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { Card } from '../../components/common/Card.js';
import { Lock, Shield } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const { isArabic } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@fashionstore.com');
  const [password, setPassword] = useState('Admin@Fashion2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await login({ email, password });
      navigate('/admin');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (msg.includes('Network error') || msg.includes('Failed to fetch')) {
        setErrorMsg(
          isArabic
            ? 'سيرفر الـ API غير متصل حالياً. يرجى التأكد من تشغيل السيرفر وقاعدة البيانات (npm run dev).'
            : 'API server is unreachable. Please make sure the backend server is running.',
        );
      } else if (msg.includes('Invalid') || msg.includes('Unauthorized') || msg.includes('credentials')) {
        setErrorMsg(
          isArabic
            ? 'بيانات الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.'
            : 'Invalid email or password. Please verify your credentials.',
        );
      } else {
        setErrorMsg(msg || (isArabic ? 'فشل تسجيل الدخول' : 'Login failed'));
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white">
      <Card className="w-full max-w-md p-8 bg-zinc-900 border-zinc-800 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">FASHION STORE</h1>
          <p className="text-xs text-zinc-400">
            {isArabic ? 'تسجيل الدخول إلى لوحة الإدارة' : 'Sign in to management console'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-red-300 text-xs font-semibold text-start">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-start">
          <Input
            label={isArabic ? 'البريد الإلكتروني' : 'Email Address'}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label={isArabic ? 'كلمة المرور' : 'Password'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="gold"
            size="lg"
            isLoading={isLoading}
            className="w-full shadow-xl mt-4"
          >
            <Lock className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            <span>{isArabic ? 'دخول لوحة التحكم' : 'Sign In'}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
};
