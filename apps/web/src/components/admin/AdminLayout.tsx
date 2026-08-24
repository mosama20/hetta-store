import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Palette,
  Percent,
  ShoppingCart,
  Users,
  LayoutTemplate,
  Settings,
  Image,
  ScrollText,
  BarChart3,
  LogOut,
  Globe,
  Sun,
  Moon,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { useAuth } from '../../store/authStore.js';
import { useTheme } from '../../store/themeStore.js';
import { cn } from '../../utils/cn.js';

export const AdminLayout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const { isArabic, toggleLanguage, isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: isArabic ? 'نظرة عامة' : 'Dashboard', path: '/admin', icon: LayoutDashboard },
    {
      label: isArabic ? 'إحصائيات الزوار والتسويق' : 'Visitor Analytics',
      path: '/admin/analytics',
      icon: BarChart3,
      perm: 'audit.read',
    },
    {
      label: isArabic ? 'المنتجات والمخزون' : 'Products',
      path: '/admin/products',
      icon: Package,
      perm: 'products.read',
    },
    {
      label: isArabic ? 'الأقسام والتصنيفات' : 'Categories',
      path: '/admin/categories',
      icon: Layers,
      perm: 'categories.read',
    },
    {
      label: isArabic ? 'الألوان والمقاسات' : 'Attributes',
      path: '/admin/attributes',
      icon: Palette,
      perm: 'products.read',
    },
    {
      label: isArabic ? 'العروض والخصومات' : 'Discounts',
      path: '/admin/discounts',
      icon: Percent,
      perm: 'discounts.read',
    },
    {
      label: isArabic ? 'طلبات العملاء' : 'Orders',
      path: '/admin/orders',
      icon: ShoppingCart,
      perm: 'orders.read',
    },
    {
      label: isArabic ? 'المستخدمين والصلاحيات' : 'Users',
      path: '/admin/users',
      icon: Users,
      perm: 'users.read',
    },
    {
      label: isArabic ? 'محتوى الواجهة (CMS)' : 'CMS Sections',
      path: '/admin/cms',
      icon: LayoutTemplate,
      perm: 'cms.read',
    },
    {
      label: isArabic ? 'إعدادات المتجر' : 'Settings',
      path: '/admin/settings',
      icon: Settings,
      perm: 'settings.read',
    },
    {
      label: isArabic ? 'مكتبة الوسائط' : 'Media',
      path: '/admin/media',
      icon: Image,
      perm: 'media.read',
    },
    {
      label: isArabic ? 'سجل العمليات' : 'Audit Logs',
      path: '/admin/audit-logs',
      icon: ScrollText,
      perm: 'audit.read',
    },
  ];

  const visibleNavItems = navItems.filter((item) => !item.perm || hasPermission(item.perm));

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col md:flex-row text-zinc-900 dark:text-zinc-100">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <span className="font-extrabold text-sm tracking-wide">FASHION STORE ADMIN</span>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 bg-white dark:bg-zinc-900 border-r rtl:border-r-0 rtl:border-l border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between shrink-0 transition-all duration-200',
          'fixed inset-y-0 z-50 md:relative md:translate-x-0',
          mobileNavOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0 rtl:translate-x-full rtl:md:translate-x-0',
        )}
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <Link
              to="/admin"
              className="flex items-center space-x-2 rtl:space-x-reverse font-black text-base tracking-tight"
            >
              <span className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm">
                FS
              </span>
              <span>ADMIN PANEL</span>
            </Link>
            <button onClick={() => setMobileNavOpen(false)} className="md:hidden p-1 text-zinc-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition',
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100',
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & bottom utilities */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-1 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <Link
            to="/"
            target="_blank"
            className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <Store className="w-3.5 h-3.5" />
            <span>{isArabic ? 'زيارة المتجر' : 'View Storefront'}</span>
          </Link>

          {/* User info */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl flex items-center justify-between">
            <div className="text-start truncate">
              <p className="text-xs font-bold truncate">{user?.fullName || 'Administrator'}</p>
              <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title={isArabic ? 'تسجيل الخروج' : 'Logout'}
              className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
