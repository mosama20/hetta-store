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
import { useStoreSettings } from '../../store/settingsStore.js';
import { cn } from '../../utils/cn.js';

interface NavGroup {
  groupTitleAr: string;
  groupTitleEn: string;
  items: {
    labelAr: string;
    labelEn: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    perm?: string;
  }[];
}

export const AdminLayout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const { isArabic, toggleLanguage, isDark, toggleTheme } = useTheme();
  const { settings } = useStoreSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navGroups: NavGroup[] = [
    {
      groupTitleAr: 'العمليات والمبيعات',
      groupTitleEn: 'Operations & Sales',
      items: [
        {
          labelAr: 'نظرة عامة',
          labelEn: 'Dashboard',
          path: '/admin',
          icon: LayoutDashboard,
        },
        {
          labelAr: 'طلبات العملاء',
          labelEn: 'Customer Orders',
          path: '/admin/orders',
          icon: ShoppingCart,
          perm: 'orders.read',
        },
        {
          labelAr: 'تحليلات الزوار والتسويق',
          labelEn: 'Visitor Analytics',
          path: '/admin/analytics',
          icon: BarChart3,
          perm: 'audit.read',
        },
      ],
    },
    {
      groupTitleAr: 'المنتجات والكتالوج',
      groupTitleEn: 'Catalog & Inventory',
      items: [
        {
          labelAr: 'المنتجات والمخزون',
          labelEn: 'Products',
          path: '/admin/products',
          icon: Package,
          perm: 'products.read',
        },
        {
          labelAr: 'الأقسام والتصنيفات',
          labelEn: 'Categories',
          path: '/admin/categories',
          icon: Layers,
          perm: 'categories.read',
        },
        {
          labelAr: 'الألوان والمقاسات',
          labelEn: 'Attributes',
          path: '/admin/attributes',
          icon: Palette,
          perm: 'products.read',
        },
        {
          labelAr: 'العروض والخصومات',
          labelEn: 'Discounts & Coupons',
          path: '/admin/discounts',
          icon: Percent,
          perm: 'discounts.read',
        },
      ],
    },
    {
      groupTitleAr: 'المتجر والمحتوى',
      groupTitleEn: 'Storefront & CMS',
      items: [
        {
          labelAr: 'محتوى الهوم بيج (CMS)',
          labelEn: 'Homepage CMS',
          path: '/admin/cms',
          icon: LayoutTemplate,
          perm: 'cms.read',
        },
        {
          labelAr: 'إعدادات المتجر والهوية',
          labelEn: 'Store Settings',
          path: '/admin/settings',
          icon: Settings,
          perm: 'settings.read',
        },
        {
          labelAr: 'مكتبة الوسائط',
          labelEn: 'Media Library',
          path: '/admin/media',
          icon: Image,
          perm: 'media.read',
        },
      ],
    },
    {
      groupTitleAr: 'النظام والمراقبة',
      groupTitleEn: 'System & Security',
      items: [
        {
          labelAr: 'المستخدمين والصلاحيات',
          labelEn: 'Users & Roles',
          path: '/admin/users',
          icon: Users,
          perm: 'users.read',
        },
        {
          labelAr: 'سجل العمليات',
          labelEn: 'Audit Logs',
          path: '/admin/audit-logs',
          icon: ScrollText,
          perm: 'audit.read',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col md:flex-row text-zinc-900 dark:text-zinc-100">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {settings.store_logo ? (
            <img src={settings.store_logo} alt="Logo" className="h-6 w-auto max-w-[120px] object-contain" />
          ) : (
            <span className="font-extrabold text-sm tracking-wide">
              {isArabic ? settings.store_name_ar || 'FASHION STORE' : settings.store_name_en || 'FASHION STORE'}
            </span>
          )}
        </div>
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
          'w-64 bg-white dark:bg-zinc-900 border-r rtl:border-r-0 rtl:border-l border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between shrink-0 transition-all duration-200 overflow-y-auto',
          'fixed inset-y-0 z-50 md:relative md:translate-x-0',
          mobileNavOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0 rtl:translate-x-full rtl:md:translate-x-0',
        )}
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <Link
              to="/admin"
              className="flex items-center space-x-2 rtl:space-x-reverse font-black text-base tracking-tight"
            >
              {settings.store_logo ? (
                <img
                  src={settings.store_logo}
                  alt="Logo"
                  className="h-8 max-w-[140px] w-auto object-contain rounded"
                />
              ) : (
                <>
                  <span className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-sm">
                    {(settings.store_name_en || 'FS').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[120px]">
                    {isArabic ? settings.store_name_ar || 'لوحة التحكم' : settings.store_name_en || 'Admin'}
                  </span>
                </>
              )}
            </Link>
            <button onClick={() => setMobileNavOpen(false)} className="md:hidden p-1 text-zinc-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="space-y-5">
            {navGroups.map((group, gIdx) => {
              const visibleItems = group.items.filter((item) => !item.perm || hasPermission(item.perm));
              if (visibleItems.length === 0) return null;

              return (
                <div key={gIdx} className="space-y-1">
                  <span className="px-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block pb-1">
                    {isArabic ? group.groupTitleAr : group.groupTitleEn}
                  </span>
                  {visibleItems.map((item) => {
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
                          'flex items-center space-x-2.5 rtl:space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold transition',
                          isActive
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100',
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{isArabic ? item.labelAr : item.labelEn}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User profile & bottom utilities */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3 mt-6">
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
            className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-semibold"
          >
            <Store className="w-3.5 h-3.5" />
            <span>{isArabic ? 'زيارة واجهة المتجر' : 'View Storefront'}</span>
          </Link>

          {/* User info */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl flex items-center justify-between border border-zinc-200/60 dark:border-zinc-800">
            <div className="text-start truncate">
              <p className="text-xs font-bold truncate">{user?.fullName || 'المدير'}</p>
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
