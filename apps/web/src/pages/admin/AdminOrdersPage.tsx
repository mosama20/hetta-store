import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderStatus } from '../../types/index.js';
import { ordersApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Select } from '../../components/common/Select.js';
import { Input } from '../../components/common/Input.js';
import { Button } from '../../components/common/Button.js';
import { Modal } from '../../components/common/Modal.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { Eye, Trash2, Tag, AlertTriangle } from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Deletion modal state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrders = () => {
    setIsLoading(true);
    ordersApi
      .getAll({
        page,
        limit: 12,
        status: (status as OrderStatus) || undefined,
        search: search || undefined,
      })
      .then((res) => {
        setOrders(res.items);
        setTotalPages(res.totalPages);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status, search]);

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await ordersApi.delete(orderToDelete.id);
      setOrderToDelete(null);
      fetchOrders();
    } catch {
      // delete error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-start pb-20">
      <AdminPageHeader
        title={isArabic ? 'طلبات العملاء والعمليات' : 'Customer Orders & Transactions'}
        description={
          isArabic
            ? 'متابعة دورة حياة الطلبات وحالات الشحن وحذف وتعديل العمليات'
            : 'Track orders, verify payment slips, and manage transaction records'
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-64">
          <Input
            placeholder={
              isArabic ? 'بحث برقم الطلب أو اسم العميل...' : 'Search order number, name...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: isArabic ? 'جميع الحالات' : 'All Statuses' },
              { value: 'PENDING', label: 'PENDING (قيد الانتظار)' },
              { value: 'CONTACTED', label: 'CONTACTED (تم التواصل)' },
              { value: 'CONFIRMED', label: 'CONFIRMED (مؤكد)' },
              { value: 'PROCESSING', label: 'PROCESSING (قيد التجهيز)' },
              { value: 'COMPLETED', label: 'COMPLETED (تم التسليم)' },
              { value: 'CANCELLED', label: 'CANCELLED (ملغي)' },
            ]}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading orders...'} />
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <p className="font-bold text-sm">
              {isArabic ? 'لا توجد طلبات مسجلة حالياً' : 'No orders found'}
            </p>
            <p className="text-xs">
              {isArabic
                ? 'عندما يقوم العملاء بالطلب من المتجر ستظهر العمليات هنا فوراً.'
                : 'When customers place orders, transactions will appear here.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-bold uppercase">
              <tr>
                <th className="p-3.5 text-start">{isArabic ? 'رقم الطلب' : 'Order #'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'العميل' : 'Customer'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'الكوبون / الخصم' : 'Discount / Promo'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'الإجمالي النهائي' : 'Final Total'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'التاريخ' : 'Date'}</th>
                <th className="p-3.5 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-end">{isArabic ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                  <td className="p-3.5 font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {o.orderNumber}
                  </td>
                  <td className="p-3.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {o.customerName}
                    </p>
                    <p className="text-[11px] text-zinc-500" dir="ltr">
                      {o.customerPhone}
                    </p>
                  </td>
                  <td className="p-3.5">
                    {o.appliedCoupon || (o.discountAmount && o.discountAmount > 0) ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{o.appliedCoupon || 'خصم'} (-{formatPrice(Number(o.discountAmount || 0), 'EGP', isArabic)})</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="p-3.5 font-black text-zinc-900 dark:text-zinc-100">
                    {formatPrice(Number(o.totalAmount), 'EGP', isArabic)}
                  </td>
                  <td className="p-3.5 text-zinc-500">{formatDate(o.createdAt, isArabic)}</td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        o.status === 'COMPLETED'
                          ? 'success'
                          : o.status === 'CONFIRMED'
                            ? 'gold'
                            : o.status === 'CANCELLED'
                              ? 'danger'
                              : 'warning'
                      }
                    >
                      {o.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/orders/${o.id}`}>
                        <button
                          className="p-1.5 text-zinc-500 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                          title={isArabic ? 'عرض التفاصيل' : 'View Details'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
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
              ))}
            </tbody>
          </table>
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
            <p className="text-xs font-semibold">
              {isArabic
                ? `هل أنت متأكد من رغبتك في حذف الطلب رقم (${orderToDelete?.orderNumber}) للعميل (${orderToDelete?.customerName}) نهائياً؟`
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
