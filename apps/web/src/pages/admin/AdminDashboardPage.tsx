import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardStats, OrderStatus } from '../../types/index.js';
import { dashboardApi, ordersApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, formatDate, getLocalized } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { AdminStatCard } from '../../components/admin/AdminStatCard.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Truck,
  TrendingUp,
  RefreshCw,
  Plus,
  Layers,
  Percent,
  LayoutTemplate,
  MessageCircle,
  Eye,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(() => {
    try {
      const cached = sessionStorage.getItem('craft_admin_dashboard_stats');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(!stats);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const fetchStats = (showLoading = false) => {
    if (showLoading && !stats) setIsLoading(true);
    setIsRefreshing(true);
    dashboardApi
      .getStats()
      .then((data) => {
        setStats(data);
        try {
          sessionStorage.setItem('craft_admin_dashboard_stats', JSON.stringify(data));
        } catch {}
        setIsLoading(false);
        setIsRefreshing(false);
      })
      .catch(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    // Optimistic UI update
    const previousOrders = stats?.recentOrders;
    if (stats && previousOrders) {
      setStats({
        ...stats,
        recentOrders: previousOrders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o,
        ),
      });
    }

    try {
      await ordersApi.updateStatus(orderId, newStatus);
      setStatusFeedback(
        isArabic
          ? 'تم تحديث حالة الطلب والمبيعات فورياً!'
          : 'Order status and live revenue updated!',
      );
      setTimeout(() => setStatusFeedback(null), 2500);
      // Refresh stats in background without full reload
      fetchStats(false);
    } catch {
      // Rollback on failure
      if (stats && previousOrders) {
        setStats({ ...stats, recentOrders: previousOrders });
      }
      setStatusFeedback(isArabic ? 'فشل تحديث الحالة' : 'Failed to update status');
      setTimeout(() => setStatusFeedback(null), 2500);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (isLoading && !stats) {
    return (
      <LoadingState message={isArabic ? 'جاري تحميل مؤشرات المتجر المباشرة...' : 'Loading live metrics...'} />
    );
  }

  const getStatusColor = (s: OrderStatus) => {
    switch (s) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'CONTACTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'CONFIRMED':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-300';
    }
  };

  return (
    <div className="space-y-7 text-start max-w-7xl mx-auto pb-24">
      {/* ========================================================
          1. HEADER & REFRESH ACTION
      ======================================================== */}
      <AdminPageHeader
        title={isArabic ? 'نظرة عامة على المتجر والأداء' : 'Store Operations & Revenue Dashboard'}
        description={
          isArabic
            ? 'مؤشرات المبيعات المباشرة، متابعة حالات الطلبات، وإدارة العمليات'
            : 'Live sales revenue, order fulfillment pipeline, and operational control center'
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStats(false)}
              isLoading={isRefreshing}
              className="shadow-sm text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isArabic ? 'تحديث البيانات' : 'Refresh Data'}</span>
            </Button>
            <Link to="/darsh50/products/new">
              <Button variant="gold" size="sm" className="shadow-md text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                <span>{isArabic ? 'إضافة منتج' : 'New Product'}</span>
              </Button>
            </Link>
          </div>
        }
      />

      {statusFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* ========================================================
          2. CORE FINANCIAL & OPERATIONAL STAT CARDS (4 KPIs)
      ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Revenue */}
        <AdminStatCard
          title={isArabic ? 'إجمالي المبيعات المؤكدة' : 'Confirmed Total Revenue'}
          value={formatPrice(stats.totalRevenue, 'EGP', isArabic)}
          icon={<DollarSign className="w-6 h-6 text-emerald-500" />}
          subtitle={
            isArabic
              ? `${formatPrice(stats.completedRevenue || 0, 'EGP', isArabic)} تم تحصيلها بالكامل`
              : `${formatPrice(stats.completedRevenue || 0, 'EGP', isArabic)} fully delivered`
          }
        />

        {/* Today's Sales */}
        <AdminStatCard
          title={isArabic ? 'مبيعات اليوم' : "Today's Sales"}
          value={formatPrice(stats.todayRevenue || 0, 'EGP', isArabic)}
          icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
          subtitle={
            isArabic
              ? `${stats.todayOrdersCount || 0} طلبات واردة اليوم`
              : `${stats.todayOrdersCount || 0} orders placed today`
          }
        />

        {/* Average Order Value (AOV) */}
        <AdminStatCard
          title={isArabic ? 'متوسط قيمة الطلب (AOV)' : 'Average Order Value'}
          value={formatPrice(stats.averageOrderValue || 0, 'EGP', isArabic)}
          icon={<ShoppingCart className="w-6 h-6 text-indigo-500" />}
          subtitle={
            isArabic
              ? `${stats.totalOrders} إجمالي كل الطلبات`
              : `From ${stats.totalOrders} total orders`
          }
        />

        {/* Active Products & Stock Alert */}
        <AdminStatCard
          title={isArabic ? 'المنتجات والمخزون' : 'Catalog & Inventory'}
          value={`${stats.activeProducts} / ${stats.totalProducts}`}
          icon={<Package className="w-6 h-6 text-purple-500" />}
          subtitle={
            stats.lowStockCount > 0
              ? isArabic
                ? `${stats.lowStockCount} مقاسات قريبة من النفاذ`
                : `${stats.lowStockCount} items low stock`
              : isArabic
                ? 'المخزون متوفر ومستقر'
                : 'Inventory healthy'
          }
        />
      </div>

      {/* ========================================================
          3. LIVE ORDER LIFECYCLE PIPELINE (مسار الطلبات التفاعلي)
      ======================================================== */}
      <Card className="p-4 sm:p-5 bg-zinc-900 text-white border border-zinc-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-wide">
                {isArabic ? 'مسار متابعة دورة حياة الطلبات (Order Pipeline)' : 'Live Order Fulfillment Pipeline'}
              </h3>
              <p className="text-[10px] text-zinc-400">
                {isArabic ? 'اضغط على أي مرحلة للانتقال المباشر للطلبات التابعة لها' : 'Click any status stage to view filtered orders'}
              </p>
            </div>
          </div>
          <Link
            to="/darsh50/orders"
            className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>{isArabic ? 'كل الطلبات' : 'View All'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Pipeline Stage Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {[
            { key: 'PENDING', count: stats.pendingOrders, labelAr: 'قيد الانتظار', labelEn: 'Pending', icon: Clock, bg: 'hover:border-amber-500/80 bg-zinc-800/80' },
            { key: 'CONTACTED', count: stats.contactedOrders || 0, labelAr: 'تم التواصل', labelEn: 'Contacted', icon: MessageCircle, bg: 'hover:border-blue-500/80 bg-zinc-800/80' },
            { key: 'CONFIRMED', count: stats.confirmedOrders || 0, labelAr: 'مؤكد', labelEn: 'Confirmed', icon: CheckCircle2, bg: 'hover:border-indigo-500/80 bg-zinc-800/80' },
            { key: 'PROCESSING', count: stats.processingOrders || 0, labelAr: 'قيد التجهيز', labelEn: 'Processing', icon: Truck, bg: 'hover:border-purple-500/80 bg-zinc-800/80' },
            { key: 'COMPLETED', count: stats.completedOrders, labelAr: 'تم التسليم', labelEn: 'Completed', icon: CheckCircle2, bg: 'hover:border-emerald-500/80 bg-zinc-800/80' },
            { key: 'CANCELLED', count: stats.cancelledOrders || 0, labelAr: 'ملغي', labelEn: 'Cancelled', icon: AlertTriangle, bg: 'hover:border-red-500/80 bg-zinc-800/80' },
          ].map((stage) => (
            <Link
              key={stage.key}
              to={`/darsh50/orders?status=${stage.key}`}
              className={`p-3 rounded-xl border border-zinc-700/80 transition flex flex-col justify-between text-start ${stage.bg} group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{stage.key}</span>
                <stage.icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 transition" />
              </div>
              <div className="pt-2">
                <span className="text-lg font-black font-mono text-white block">{stage.count}</span>
                <span className="text-[10px] text-zinc-400 truncate block">
                  {isArabic ? stage.labelAr : stage.labelEn}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* ========================================================
          4. QUICK ACTIONS TOOLBAR (اختصارات سريعة بدون تكرار)
      ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/darsh50/products/new"
          className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-amber-500 dark:hover:border-amber-500 transition flex items-center gap-3 text-start group"
        >
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{isArabic ? 'إضافة منتج' : 'Add Product'}</p>
            <p className="text-[10px] text-zinc-400">{isArabic ? 'منتج وصور ومقاسات' : 'Inventory item'}</p>
          </div>
        </Link>

        <Link
          to="/darsh50/categories"
          className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-blue-500 dark:hover:border-blue-500 transition flex items-center gap-3 text-start group"
        >
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{isArabic ? 'ترتيب الأقسام' : 'Categories'}</p>
            <p className="text-[10px] text-zinc-400">{isArabic ? 'تنظيم هيكل العرض' : 'Taxonomy hierarchy'}</p>
          </div>
        </Link>

        <Link
          to="/darsh50/cms"
          className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-purple-500 dark:hover:border-purple-500 transition flex items-center gap-3 text-start group"
        >
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition">
            <LayoutTemplate className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{isArabic ? 'محتوى الهوم بيج (CMS)' : 'Homepage CMS'}</p>
            <p className="text-[10px] text-zinc-400">{isArabic ? 'ترتيب البنرات والسيكشنز' : 'Banners & sections'}</p>
          </div>
        </Link>

        <Link
          to="/darsh50/discounts"
          className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 transition flex items-center gap-3 text-start group"
        >
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{isArabic ? 'أكواد الخصم' : 'Coupons & Deals'}</p>
            <p className="text-[10px] text-zinc-400">{isArabic ? 'العروض الترويجية' : 'Promotional codes'}</p>
          </div>
        </Link>
      </div>

      {/* ========================================================
          5. RECENT ORDERS WITH INLINE STATUS MODIFIER & PRODUCTS
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (Spans 2 columns) */}
        <Card className="lg:col-span-2 p-5 sm:p-6 space-y-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isArabic ? 'أحدث طلبات العملاء (تعديل الحالة فورياً)' : 'Recent Orders (Instant Status Control)'}
              </h3>
            </div>
            <Link
              to="/darsh50/orders"
              className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1"
            >
              <span>{isArabic ? 'عرض كافة الطلبات' : 'View All'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              {isArabic ? 'لا توجد طلبات مسجلة حتى الآن' : 'No recent orders'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-bold uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-3 text-start">{isArabic ? 'رقم الطلب' : 'Order #'}</th>
                    <th className="p-3 text-start">{isArabic ? 'العميل' : 'Customer'}</th>
                    <th className="p-3 text-start">{isArabic ? 'المبلغ' : 'Amount'}</th>
                    <th className="p-3 text-center min-w-[150px]">{isArabic ? 'الحالة (تغيير مباشر)' : 'Status (Change)'}</th>
                    <th className="p-3 text-end">{isArabic ? 'عرض' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stats.recentOrders.map((order) => {
                    const isUpdating = updatingOrderId === order.id;
                    const statusColor = getStatusColor(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                        <td className="p-3">
                          <Link
                            to={`/darsh50/orders/${order.id}`}
                            className="font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                          <span className="block text-[10px] text-zinc-400">{formatDate(order.createdAt, isArabic)}</span>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">
                            {order.customerName}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono" dir="ltr">
                            {order.customerPhone}
                          </p>
                        </td>
                        <td className="p-3 font-black text-zinc-900 dark:text-zinc-100 font-mono">
                          {formatPrice(Number(order.totalAmount), 'EGP', isArabic)}
                        </td>
                        <td className="p-3 text-center">
                          <select
                            value={order.status}
                            disabled={isUpdating}
                            onChange={(e) => handleQuickStatusChange(order.id, e.target.value as OrderStatus)}
                            className={`text-[11px] font-bold px-2 py-1 rounded-xl border transition-all cursor-pointer outline-none w-full ${statusColor} ${
                              isUpdating ? 'opacity-50 animate-pulse' : ''
                            }`}
                          >
                            <option value="PENDING">{isArabic ? 'قيد الانتظار' : 'Pending'}</option>
                            <option value="CONTACTED">{isArabic ? 'تم التواصل' : 'Contacted'}</option>
                            <option value="CONFIRMED">{isArabic ? 'مؤكد' : 'Confirmed'}</option>
                            <option value="PROCESSING">{isArabic ? 'قيد التجهيز' : 'Processing'}</option>
                            <option value="COMPLETED">{isArabic ? 'تم التسليم' : 'Completed'}</option>
                            <option value="CANCELLED">{isArabic ? 'ملغي' : 'Cancelled'}</option>
                          </select>
                        </td>
                        <td className="p-3 text-end">
                          <Link to={`/darsh50/orders/${order.id}`}>
                            <button
                              className="p-1.5 text-zinc-500 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                              title={isArabic ? 'تفاصيل الطلب' : 'View order'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Latest Products Column */}
        <Card className="p-5 sm:p-6 space-y-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isArabic ? 'أحدث المنتجات' : 'Recent Products'}
              </h3>
            </div>
            <Link
              to="/darsh50/products"
              className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1"
            >
              <span>{isArabic ? 'الكتالوج' : 'Catalog'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentProducts.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <img
                    src={
                      prod.images[0]?.url ||
                      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80'
                    }
                    alt=""
                    className="w-10 h-11 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0"
                  />
                  <div className="truncate max-w-[120px]">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {getLocalized(prod.nameAr, prod.nameEn, isArabic)}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      {formatDate(prod.createdAt, isArabic)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black font-mono text-zinc-900 dark:text-zinc-100">
                  {formatPrice(Number(prod.basePrice), 'EGP', isArabic)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ========================================================
          6. VISITOR ATTRIBUTION & TRAFFIC BANNER (Single, Clean)
      ======================================================== */}
      <Link
        to="/darsh50/analytics"
        className="block p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-md hover:shadow-lg transition group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 rounded-xl bg-white/20 group-hover:scale-105 transition">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black">
                {isArabic ? 'لوحة تحليلات الزوار المباشرة وحملات التسويق (Visitor Analytics & Ads)' : 'Live Visitor Traffic & Ad Campaign Attribution'}
              </h3>
              <p className="text-[11px] text-blue-100 mt-0.5">
                {isArabic
                  ? 'متابعة الزوار الحقيقيين، مصادر الزيارات (TikTok, Meta, Google)، وسلات الشراء المتروكة'
                  : 'Track active sessions, traffic UTM sources, conversion rates, and abandoned carts'}
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold bg-white/20 group-hover:bg-white/30 px-3.5 py-2 rounded-xl transition shrink-0">
            <span>{isArabic ? 'فتح التحليلات' : 'Analytics'}</span>
            <ArrowUpRight className="w-4 h-4 ml-1 rtl:mr-1 rtl:ml-0" />
          </div>
        </div>
      </Link>
    </div>
  );
};
