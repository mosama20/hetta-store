import React, { useEffect, useState } from 'react';
import { SheinOrder, SheinOrderStatus } from '../../types/index.js';
import { sheinApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatDate } from '../../utils/formatters.js';
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
  ExternalLink,
  MessageCircle,
  Package,
  ShoppingBag,
  Search,
} from 'lucide-react';

const STATUS_OPTIONS: { value: SheinOrderStatus; labelAr: string; labelEn: string; color: string }[] = [
  { value: 'PENDING', labelAr: 'قيد الانتظار', labelEn: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' },
  { value: 'CONFIRMED', labelAr: 'تم التأكيد مع العميل', labelEn: 'Confirmed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' },
  { value: 'PURCHASED', labelAr: 'تم الشراء من SHEIN', labelEn: 'Purchased from SHEIN', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300' },
  { value: 'IN_TRANSIT', labelAr: 'قيد الشحن والتوصيل', labelEn: 'In Transit', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300' },
  { value: 'DELIVERED', labelAr: 'تم التسليم بنجاح', labelEn: 'Delivered', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' },
  { value: 'CANCELLED', labelAr: 'ملغي', labelEn: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300' },
];

export const AdminSheinOrdersPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [orders, setOrders] = useState<SheinOrder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected Order for Details Modal
  const [activeOrder, setActiveOrder] = useState<SheinOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Delete modal
  const [orderToDelete, setOrderToDelete] = useState<SheinOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrders = () => {
    setIsLoading(true);
    sheinApi
      .getAllOrders({
        page,
        limit: 12,
        status: (selectedStatus as SheinOrderStatus) || undefined,
        search: search || undefined,
      })
      .then((res) => {
        setOrders(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load SHEIN orders:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [page, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: SheinOrderStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await sheinApi.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o)));
      if (activeOrder && activeOrder.id === orderId) {
        setActiveOrder({ ...activeOrder, status: updated.status });
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await sheinApi.deleteOrder(orderToDelete.id);
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      setOrderToDelete(null);
      if (activeOrder?.id === orderToDelete.id) {
        setActiveOrder(null);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to delete order');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={isArabic ? 'طلبات SHEIN (الوسيط)' : 'SHEIN Concierge Orders'}
        description={
          isArabic
            ? `إدارة ومراجعة طلبات استيراد منتجات شي إن للعملاء (الإجمالي: ${totalCount} طلب)`
            : `Manage customer custom import orders from SHEIN (${totalCount} orders)`
        }
      />

      {/* Filters & Search Row */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearch} className="w-full md:w-96 flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isArabic ? 'بحث برقم الطلب، اسم العميل، أو الهاتف...' : 'Search by order #, name, phone...'}
            />
            <Button type="submit" variant="outline" className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => {
                setSelectedStatus('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                selectedStatus === ''
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              {isArabic ? 'الكل' : 'All'}
            </button>
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st.value}
                onClick={() => {
                  setSelectedStatus(st.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  selectedStatus === st.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                {isArabic ? st.labelAr : st.labelEn}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table of SHEIN Orders */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <LoadingState message={isArabic ? 'جاري تحميل طلبات شي إن...' : 'Loading SHEIN orders...'} />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 dark:text-zinc-400 space-y-3">
            <ShoppingBag className="w-12 h-12 mx-auto text-purple-400 opacity-60" />
            <p className="font-bold">{isArabic ? 'لا توجد طلبات شي إن حالياً' : 'No SHEIN orders found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs">
                <tr>
                  <th className="py-3.5 px-4">{isArabic ? 'رقم الطلب' : 'Order #'}</th>
                  <th className="py-3.5 px-4">{isArabic ? 'العميل' : 'Customer'}</th>
                  <th className="py-3.5 px-4">{isArabic ? 'المنتجات' : 'Items'}</th>
                  <th className="py-3.5 px-4">{isArabic ? 'الإجمالي' : 'Total'}</th>
                  <th className="py-3.5 px-4">{isArabic ? 'الحالة' : 'Status'}</th>
                  <th className="py-3.5 px-4">{isArabic ? 'التاريخ' : 'Date'}</th>
                  <th className="py-3.5 px-4 text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {orders.map((order) => {
                  const statusObj = STATUS_OPTIONS.find((s) => s.value === order.status);
                  const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {order.orderNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{order.customerName}</div>
                        <div className="text-xs text-zinc-500 font-mono" dir="ltr">
                          {order.customerPhone}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold">
                          <Package className="w-3.5 h-3.5 text-purple-500" />
                          <span>{order.items?.length || 0} قطع</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                        {order.totalAmount} ج.م
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as SheinOrderStatus)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-purple-500 ${
                            statusObj?.color || 'bg-zinc-100 text-zinc-800'
                          }`}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st.value} value={st.value}>
                              {isArabic ? st.labelAr : st.labelEn}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-zinc-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details Button */}
                          <button
                            type="button"
                            onClick={() => setActiveOrder(order)}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 transition"
                            title={isArabic ? 'عرض التفاصيل' : 'View Details'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Chat Button */}
                          <a
                            href={`https://wa.me/${cleanPhone.startsWith('2') ? cleanPhone : '2' + cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 transition"
                            title={isArabic ? 'محادثة واتساب' : 'WhatsApp'}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(order)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 transition"
                            title={isArabic ? 'حذف الطلب' : 'Delete Order'}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {activeOrder && (
        <Modal
          isOpen={true}
          onClose={() => setActiveOrder(null)}
          title={`${isArabic ? 'تفاصيل طلب شي إن' : 'SHEIN Order Details'} #${activeOrder.orderNumber}`}
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
            {/* Customer Info Card */}
            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl space-y-2 text-xs sm:text-sm border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between">
                <span className="text-zinc-500">{isArabic ? 'اسم العميل:' : 'Customer:'}</span>
                <strong className="text-zinc-900 dark:text-white">{activeOrder.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{isArabic ? 'رقم الهاتف:' : 'Phone:'}</span>
                <span className="font-mono text-zinc-900 dark:text-white" dir="ltr">{activeOrder.customerPhone}</span>
              </div>
              {activeOrder.customerCity && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">{isArabic ? 'المحافظة / الحي:' : 'City / Area:'}</span>
                  <span>{activeOrder.customerCity} {activeOrder.customerDistrict ? `- ${activeOrder.customerDistrict}` : ''}</span>
                </div>
              )}
              {activeOrder.customerAddress && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">{isArabic ? 'العنوان التفصيلي:' : 'Address:'}</span>
                  <span className="text-right">{activeOrder.customerAddress}</span>
                </div>
              )}
              {activeOrder.notes && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400">
                  <strong>{isArabic ? 'ملاحظة العميل:' : 'Note:'}</strong> {activeOrder.notes}
                </div>
              )}
            </div>

            {/* Products List */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center justify-between">
                <span>{isArabic ? 'المنتجات المطلوبة من SHEIN:' : 'Requested Items:'}</span>
                <span className="text-xs text-purple-600 font-bold">{activeOrder.items?.length || 0} قطع</span>
              </h4>

              <div className="space-y-3">
                {activeOrder.items?.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-3.5 items-start"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold shrink-0 text-sm">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <h5 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white leading-snug">
                        {item.title}
                      </h5>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        {item.size && <span>المقاس: <strong className="text-zinc-800 dark:text-zinc-200">{item.size}</strong></span>}
                        {item.color && <span>اللون: <strong className="text-zinc-800 dark:text-zinc-200">{item.color}</strong></span>}
                        <span>الكمية: <strong className="text-zinc-800 dark:text-zinc-200">{item.quantity}</strong></span>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-zinc-500 italic">
                          *{item.notes}
                        </p>
                      )}

                      {/* Direct Shein Link button */}
                      <div className="pt-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.subtotal} ج.م</span>
                        <a
                          href={item.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                        >
                          <span>{isArabic ? 'فتح المنتج في SHEIN ↗' : 'Open in SHEIN ↗'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{isArabic ? 'إجمالي المنتجات:' : 'Products Subtotal:'}</span>
                <span>{activeOrder.productsTotal} ج.م</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{isArabic ? 'الشحن الدولي من شي إن:' : 'SHEIN Shipping:'}</span>
                <span>{activeOrder.sheinShippingFee} ج.م</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{isArabic ? 'رسوم الخدمة:' : 'Service Fee:'}</span>
                <span>{activeOrder.serviceFee} ج.م</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{isArabic ? 'التوصيل الداخلي بمصر:' : 'Domestic Delivery:'}</span>
                <span>{activeOrder.deliveryFee} ج.م</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-purple-200 dark:border-purple-900/40 font-black text-sm sm:text-base text-purple-800 dark:text-purple-300">
                <span>{isArabic ? 'الإجمالي النهائي المطلوب:' : 'Grand Total:'}</span>
                <span>{activeOrder.totalAmount} ج.م</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setActiveOrder(null)}>
                {isArabic ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setOrderToDelete(null)}
          title={isArabic ? 'تأكيد حذف طلب SHEIN' : 'Confirm Delete Order'}
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isArabic
                ? `هل أنت متأكد من حذف الطلب رقم (${orderToDelete.orderNumber}) للعميل (${orderToDelete.customerName})؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete order #${orderToDelete.orderNumber}?`}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOrderToDelete(null)}>
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (isArabic ? 'جاري الحذف...' : 'Deleting...') : (isArabic ? 'نعم، احذف' : 'Delete')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
