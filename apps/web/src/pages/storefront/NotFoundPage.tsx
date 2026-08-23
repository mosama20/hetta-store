import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../store/themeStore.js';
import { Button } from '../../components/common/Button.js';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { isArabic } = useTheme();

  return (
    <div className="py-24 text-center space-y-6">
      <h1 className="text-7xl font-black text-zinc-900 dark:text-zinc-100">404</h1>
      <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
        {isArabic ? 'الصفحة المطلوبة غير موجودة' : 'Page Not Found'}
      </h2>
      <p className="text-sm text-zinc-500 max-w-sm mx-auto">
        {isArabic
          ? 'ربما تم نقل الصفحة أو تغيير الرابط.'
          : 'The page you are looking for might have been removed or is temporarily unavailable.'}
      </p>
      <Link to="/" className="inline-block pt-2">
        <Button variant="primary" size="md">
          <Home className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          <span>{isArabic ? 'العودة للرئيسية' : 'Back to Home'}</span>
        </Button>
      </Link>
    </div>
  );
};
