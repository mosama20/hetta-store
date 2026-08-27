import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderStatus } from '../../types/index.js';
import { ordersApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Input } from '../../components/common/Input.js';
import { Button } from '../../components/common/Button.js';
import { Modal } from '../../components/common/Modal.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import {
  Eye,
  Trash2,
  Tag,
  AlertTriangle,
  MessageCircle,
  CheckCircle2,
  Clock,
  Truck,
  Check,
  XCircle,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Deletion modal state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrders = () => {
    setIsLoading(true);
    ordersApi
      .getAll({
        page,
        limit: 12,
        status: (selectedStatus as OrderStatus) || undefined,
        search: search || undefined,
      })
      .then((res) => {
        setOrders(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [page, selectedStatus, search]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const updated = await ordersApi.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o)),
      );
      setToastMsg({
        type: 'success',
        text: isArabic
          ? `تم تغيير حالة الطلب بنجاح إلى: ${getStatusLabel(newStatus).labelAr}`
          : `Order status updated to: ${getStatusLabel(newStatus).labelEn}`,
      });
      setTimeout(() => setToastMsg(null), 3000);
    } catch {
      setToastMsg({
        type: 'error',
        text: isArabic ? 'فشل تحديث حالة الطلب' : 'Failed to update order status',
      });
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await ordersApi.delete(orderToDelete.id);
      setOrderToDelete(null);
      fetchOrders();
      setToastMsg({
        type: 'success',
        text: isArabic ? 'تم حذف الطلب بنجاح' : 'Order deleted successfully',
      });
      setTimeout(() => setToastMsg(null), 3000);
    } catch {
      setToastMsg({
        type: 'error',
        text: isArabic ? 'فشل حذف الطلب' : 'Failed to delete order',
      });
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusLabel = (s: OrderStatus) => {
    switch (s) {
      case 'PENDING':
        return { labelAr: 'قيد الانتظار', labelEn: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800' };
      case 'CONTACTED':
        return { labelAr: 'تم التواصل', labelEn: 'Contacted', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800' };
      case 'CONFIRMED':
        return { labelAr: 'مؤكد', labelEn: 'Confirmed', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' };
      case 'PROCESSING':
        return { labelAr: 'قيد التجهيز والشحن', labelEn: 'Processing', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800' };
      case 'COMPLETED':
        return { labelAr: 'تم التسليم والتحصيل', labelEn: 'Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' };
      case 'CANCELLED':
        return { labelAr: 'ملغي / مسترجع', labelEn: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800' };
      default:
        return { labelAr: s, labelEn: s, color: 'bg-zinc-100 text-zinc-800 border-zinc-300' };
    }
  };

  const statusFilterTabs = [
    { key: '', labelAr: 'جميع الطلبات', labelEn: 'All Orders', icon: Sparkles },
    { key: 'PENDING', labelAr: 'قيد الانتظار', labelEn: 'Pending', icon: Clock },
    { key: 'CONTACTED', labelAr: 'تم التواصل', labelEn: 'Contacted', icon: PhoneCall },
    { key: 'CONFIRMED', labelAr: 'مؤكدة', labelEn: 'Confirmed', icon: Check },
    { key: 'PROCESSING', labelAr: 'قيد التجهيز', labelEn: 'Processing', icon: Truck },
    { key: 'COMPLETED', labelAr: 'تم التسليم', labelEn: 'Completed', icon: CheckCircle2 },
    { key: 'CANCELLED', labelAr: 'ملغية', labelEn: 'Cancelled', icon: XCircle },
  ];

  const currentFilterTotalRevenue = orders.reduce((sum, o) => {
    if (o.status !== 'CANCELLED') {
      return sum + Number(o.totalAmount || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6 text-start pb-24 max-w-7xl mx-auto">
      <AdminPageHeader
        title={isArabic ? 'إدارة ومتابعة طلبات العملاء' : 'Order Tracking & Live Management'}
        description={
          isArabic
            ? 'متابعة دورة حياة الطلب، تغيير الحالة بضغطة زر، تحديث المبيعات، ومراسلة العملاء عبر واتساب'
            : 'Track live order status lifecycle, instant inline status updates, WhatsApp direct messaging'
        }
      />

      {toastMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-sm ${
            toastMsg.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
              : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ========================================================
          1. STATUS FILTER TABS & SEARCH
      ======================================================== */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {statusFilterTabs.map((tab) => {
            const isSelected = selectedStatus === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.key);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  isSelected
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isArabic ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Active Filter Summary */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder={
                isArabic ? '🔍 بحث برقم الطلب، اسم العميل، الهاتف...' : '🔍 Search by order #, name, phone...'
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400 self-end sm:self-center">
            <span>
              {isArabic ? 'إجمالي الطلبات المعروضة:' : 'Showing:'} <span className="font-mono text-zinc-900 dark:text-zinc-100 font-black">{totalCount}</span>
            </span>
            <span>•</span>
            <span>
              {isArabic ? 'مجموع الصفحة:' : 'Page Total:'}{' '}
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                {formatPrice(currentFilterTotalRevenue, 'EGP', isArabic)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. ORDERS LIVE DATA TABLE
      ======================================================== */}
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {isLoading ? (
          <LoadingState message={isArabic ? 'جاري تحميل الطلبات...' : 'Loading orders...'} />
        ) : orders.length === 0 ? (
          <div className="p-14 text-center text-zinc-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <Clock className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'لا توجد طلبات مطابقة لهذا الفلتر' : 'No orders match this filter'}
            </p>
            <p className="text-xs text-zinc-400">
              {isArabic
                ? 'جرب البحث برقم آخر أو اختيار حالة مختلفة.'
                : 'Try adjusting your search criteria or filter status.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/70 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5 text-start">{isArabic ? 'رقم الطلب' : 'Order #'}</th>
                  <th className="p-3.5 text-start">{isArabic ? 'العميل والهاتف' : 'Customer & Phone'}</th>
                  <th className="p-3.5 text-start">{isArabic ? 'المحافظة / العنوان' : 'Location'}</th>
                  <th className="p-3.5 text-start">{isArabic ? 'الخصم والكوبون' : 'Discount / Promo'}</th>
                  <th className="p-3.5 text-start">{isArabic ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                  <th className="p-3.5 text-start">{isArabic ? 'تاريخ الطلب' : 'Date'}</th>
                  <th className="p-3.5 text-center min-w-[170px]">{isArabic ? 'حالة الطلب (تغيير فوري)' : 'Status (Instant Change)'}</th>
                  <th className="p-3.5 text-end">{isArabic ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {orders.map((o) => {
                  const statusInfo = getStatusLabel(o.status);
                  const isRowUpdating = updatingOrderId === o.id;
                  const waUrl = `https://wa.me/${(o.customerPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `مرحباً ${o.customerName}، بخصوص طلبك رقم ${o.orderNumber} من متجرنا (الحالة الحالية: ${statusInfo.labelAr}).`,
                  )}`;

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Order Number */}
                      <td className="p-3.5">
                        <Link
                          to={`/darsh50/orders/${o.id}`}
                          className="font-mono font-black text-xs text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="p-3.5">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {o.customerName}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono" dir="ltr">
                          {o.customerPhone}
                        </p>
                      </td>

                      {/* City / Address */}
                      <td className="p-3.5 text-zinc-600 dark:text-zinc-400 max-w-[140px] truncate">
                        {o.customerCity ? (
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {o.customerCity}
                          </span>
                        ) : (
                          '—'
                        )}
                        {o.customerAddress ? (
                          <span className="block text-[10px] text-zinc-400 truncate">
                            {o.customerAddress}
                          </span>
                        ) : null}
                      </td>

                      {/* Coupon / Discount */}
                      <td className="p-3.5">
                        {o.appliedCoupon || (o.discountAmount && o.discountAmount > 0) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            <Tag className="w-2.5 h-2.5" />
                            <span>{o.appliedCoupon || 'خصم'} (-{formatPrice(Number(o.discountAmount || 0), 'EGP', isArabic)})</span>
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="p-3.5 font-black text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                        {formatPrice(Number(o.totalAmount), 'EGP', isArabic)}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-zinc-500 text-[11px]">
                        {formatDate(o.createdAt, isArabic)}
                      </td>

                      {/* Inline Status Dropdown Modifier */}
                      <td className="p-3.5 text-center">
                        <select
                          value={o.status}
                          disabled={isRowUpdating}
                          onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                          className={`w-full text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer outline-none ${statusInfo.color} ${
                            isRowUpdating ? 'opacity-50 animate-pulse' : ''
                          }`}
                        >
                          <option value="PENDING">⏳ {isArabic ? 'قيد الانتظار (Pending)' : 'Pending'}</option>
                          <option value="CONTACTED">📞 {isArabic ? 'تم التواصل (Contacted)' : 'Contacted'}</option>
                          <option value="CONFIRMED">✅ {isArabic ? 'مؤكد (Confirmed)' : 'Confirmed'}</option>
                          <option value="PROCESSING">📦 {isArabic ? 'قيد التجهيز (Processing)' : 'Processing'}</option>
                          <option value="COMPLETED">🎉 {isArabic ? 'تم التسليم (Completed)' : 'Completed'}</option>
                          <option value="CANCELLED">❌ {isArabic ? 'ملغي (Cancelled)' : 'Cancelled'}</option>
                        </select>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 text-end">
                        <div className="flex items-center justify-end gap-1">
                          {/* WhatsApp direct customer link */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition"
                            title={isArabic ? 'مراسلة واتساب' : 'WhatsApp customer'}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* View details */}
                          <Link to={`/darsh50/orders/${o.id}`}>
                            <button
                              className="p-1.5 text-zinc-500 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                              title={isArabic ? 'تفاصيل الفاتورة والطلب' : 'View order details'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>

                          {/* Delete order */}
                          <button
                            onClick={() => setOrderToDelete(o)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title={isArabic ? 'حذف هذه العملية' : 'Delete Order'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        title={isArabic ? 'تأكيد حذف العملية / الطلب' : 'Confirm Order Deletion'}
      >
        <div className="space-y-4 text-start">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-semibold leading-relaxed">
              {isArabic
                ? `هل أنت متأكد من رغبتك في حذف الطلب رقم (${orderToDelete?.orderNumber}) للعميل (${orderToDelete?.customerName}) نهائياً؟ سيتم تعديل الإحصائيات تلقائياً.`
                : `Are you sure you want to permanently delete order (${orderToDelete?.orderNumber})?`}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOrderToDelete(null)}
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteOrder}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>{isArabic ? 'نعم، احذف الطلب' : 'Yes, Delete Order'}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
