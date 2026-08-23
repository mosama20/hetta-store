import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardStats } from '../../types/index.js';
import { dashboardApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, formatDate, getLocalized } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { AdminStatCard } from '../../components/admin/AdminStatCard.js';
import { Card } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { Package, ShoppingCart, DollarSign, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getStats()
      .then((data) => {
        setStats(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading || !stats) {
    return (
      <LoadingState message={isArabic ? 'جاري تحميل الإحصائيات...' : 'Loading live metrics...'} />
    );
  }

  return (
    <div className="space-y-8 text-start">
      <AdminPageHeader
        title={isArabic ? 'نظرة عامة على المتجر' : 'Store Dashboard'}
        description={
          isArabic
            ? 'مؤشرات الأداء المباشرة والمبيعات والطلبات'
            : 'Live operational and sales performance metrics'
        }
      />

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title={isArabic ? 'إجمالي المبيعات' : 'Total Revenue'}
          value={formatPrice(stats.totalRevenue, 'EGP', isArabic)}
          icon={<DollarSign className="w-6 h-6 text-emerald-500" />}
          subtitle={isArabic ? 'من الطلبات المكتملة' : 'Confirmed & completed orders'}
        />
        <AdminStatCard
          title={isArabic ? 'إجمالي الطلبات' : 'Total Orders'}
          value={stats.totalOrders}
          icon={<ShoppingCart className="w-6 h-6 text-blue-500" />}
          subtitle={
            isArabic
              ? `${stats.pendingOrders} طلبات قيد الانتظار`
              : `${stats.pendingOrders} pending confirmation`
          }
        />
        <AdminStatCard
          title={isArabic ? 'المنتجات النشطة' : 'Active Products'}
          value={`${stats.activeProducts} / ${stats.totalProducts}`}
          icon={<Package className="w-6 h-6 text-purple-500" />}
          subtitle={isArabic ? 'من إجمالي الكتالوج' : 'Of total inventory items'}
        />
        <AdminStatCard
          title={isArabic ? 'مخزون منخفض' : 'Low Stock Variants'}
          value={stats.lowStockCount}
          icon={<AlertTriangle className="w-6 h-6 text-amber-500" />}
          subtitle={isArabic ? 'أقل من 5 قطع بالمخزن' : 'Items under 5 units'}
        />
      </div>

      {/* Tables Section: Recent Orders & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'أحدث الطلبات' : 'Recent Customer Orders'}
            </h3>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-amber-600 hover:text-amber-500 flex items-center"
            >
              <span>{isArabic ? 'عرض الكل' : 'View All'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition border border-zinc-100 dark:border-zinc-800/60"
              >
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {order.orderNumber}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {order.customerName} ({order.customerPhone})
                  </p>
                </div>
                <div className="text-end space-y-1">
                  <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                    {formatPrice(Number(order.totalAmount), 'EGP', isArabic)}
                  </p>
                  <Badge
                    variant={
                      order.status === 'COMPLETED'
                        ? 'success'
                        : order.status === 'PENDING'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Products */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'أحدث المنتجات المضافة' : 'Latest Products'}
            </h3>
            <Link
              to="/admin/products"
              className="text-xs font-semibold text-amber-600 hover:text-amber-500 flex items-center"
            >
              <span>{isArabic ? 'الكتالوج' : 'Catalog'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentProducts.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <img
                    src={
                      prod.images[0]?.url ||
                      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80'
                    }
                    alt=""
                    className="w-10 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {getLocalized(prod.nameAr, prod.nameEn, isArabic)}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {formatDate(prod.createdAt, isArabic)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold">
                  {formatPrice(Number(prod.basePrice), 'EGP', isArabic)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
