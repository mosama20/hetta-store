import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Order, OrderStatus } from '../../types/index.js';
import { ordersApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, formatDate, getLocalized } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { Select } from '../../components/common/Select.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { MessageCircle, ArrowLeft, Printer, Trash2, Tag, Truck, ShieldCheck, AlertTriangle } from 'lucide-react';

export const AdminOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isArabic } = useTheme();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Deletion modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    ordersApi.getById(id).then((o) => {
      setOrder(o);
      setStatus(o.status);
      setIsLoading(false);
    });
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!id) return;
    setIsUpdating(true);
    const updated = await ordersApi.updateStatus(id, newStatus);
    setOrder(updated);
    setStatus(updated.status);
    setIsUpdating(false);
  };

  const handleDeleteOrder = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await ordersApi.delete(id);
      navigate('/darsh50/orders');
    } catch {
      // delete error
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !order) {
    return (
      <LoadingState
        message={isArabic ? 'جاري تحميل تفاصيل الطلب...' : 'Loading order details...'}
      />
    );
  }

  const subtotal = order.subtotal !== undefined
    ? Number(order.subtotal)
    : order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  const discountAmount = order.discountAmount !== undefined ? Number(order.discountAmount) : 0;
  const shippingFee = order.shippingFee !== undefined ? Number(order.shippingFee) : (subtotal >= 1000 ? 0 : 50);

  const waUrl = `https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `مرحباً ${order.customerName}، معك فريق متجرنا بخصوص طلبك رقم ${order.orderNumber} (الحالة الحالية: ${order.status}).`,
  )}`;

  return (
    <div className="space-y-6 text-start max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between text-xs text-zinc-500 print:hidden">
        <Link
          to="/darsh50/orders"
          className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 rtl:rotate-180" />
          <span>{isArabic ? 'العودة لقائمة الطلبات' : 'Back to Orders'}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isArabic ? 'حذف هذه العملية' : 'Delete Order'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-bold text-zinc-900 dark:text-zinc-100"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isArabic ? 'طباعة الفاتورة / البوليصة' : 'Print Packing Slip'}</span>
          </button>
        </div>
      </div>

      <AdminPageHeader
        title={`${isArabic ? 'تفاصيل الطلب' : 'Order'} ${order.orderNumber}`}
        description={`${isArabic ? 'تاريخ الإنشاء:' : 'Created on:'} ${formatDate(order.createdAt, isArabic)}`}
        action={
          <div className="flex items-center space-x-3 rtl:space-x-reverse print:hidden">
            <a href={waUrl} target="_blank" rel="noreferrer">
              <Button variant="gold" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <MessageCircle className="w-4 h-4 mr-1.5" />
                <span>{isArabic ? 'مراسلة العميل واتساب' : 'WhatsApp Customer'}</span>
              </Button>
            </a>
            <Select
              value={status}
              disabled={isUpdating}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              options={[
                { value: 'PENDING', label: 'PENDING (قيد الانتظار)' },
                { value: 'CONTACTED', label: 'CONTACTED (تم التواصل)' },
                { value: 'CONFIRMED', label: 'CONFIRMED (مؤكد)' },
                { value: 'PROCESSING', label: 'PROCESSING (قيد التجهيز)' },
                { value: 'COMPLETED', label: 'COMPLETED (تم التسليم)' },
                { value: 'CANCELLED', label: 'CANCELLED (ملغي)' },
              ]}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Details */}
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-zinc-400 border-b pb-2">
            {isArabic ? 'بيانات العميل' : 'Customer Info'}
          </h3>
          <div className="space-y-1 text-xs">
            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {order.customerName}
            </p>
            <p className="text-zinc-500 font-semibold" dir="ltr">
              {order.customerPhone}
            </p>
            <p className="text-zinc-500">
              {order.customerCity || ''} {order.customerAddress ? `- ${order.customerAddress}` : ''}
            </p>
            {order.notes && <p className="text-amber-600 pt-1 italic">{order.notes}</p>}
          </div>
        </Card>

        {/* Status Snapshot */}
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-zinc-400 border-b pb-2">
            {isArabic ? 'حالة الطلب' : 'Status'}
          </h3>
          <div className="space-y-2">
            <Badge
              variant={
                order.status === 'COMPLETED'
                  ? 'success'
                  : order.status === 'CONFIRMED'
                    ? 'gold'
                    : order.status === 'CANCELLED'
                      ? 'danger'
                      : 'warning'
              }
              className="text-sm px-3 py-1"
            >
              {order.status}
            </Badge>
            <p className="text-xs text-zinc-400">
              {isArabic ? 'الإجمالي المطلوب للدفع:' : 'Final Invoice Total:'}
            </p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              {formatPrice(Number(order.totalAmount), 'EGP', isArabic)}
            </p>
          </div>
        </Card>

        {/* Store Stamp / Dispatch Info */}
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-zinc-400 border-b pb-2">
            {isArabic ? 'معلومات التوصيل' : 'Dispatch Info'}
          </h3>
          <div className="space-y-1 text-xs text-zinc-500">
            <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-zinc-600" />
              <span>{isArabic ? 'شحن ومعاينة قبل الاستلام' : 'Delivery with Inspection'}</span>
            </p>
            <p className="text-[11px] pt-1 text-emerald-600 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isArabic ? 'دفع نقدي عند الاستلام' : 'Cash on Delivery'}</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Snapshot Items Table with Financial Breakdown */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          {isArabic ? 'المنتجات المطلوبة (لقطة الفاتورة)' : 'Order Items & Invoice Breakdown'}
        </h3>
        <table className="w-full text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-bold uppercase">
            <tr>
              <th className="p-3 text-start">{isArabic ? 'المنتج' : 'Product Snapshot'}</th>
              <th className="p-3 text-start">{isArabic ? 'اللون والمقاس' : 'Attributes'}</th>
              <th className="p-3 text-start">SKU</th>
              <th className="p-3 text-start">{isArabic ? 'سعر الوحدة' : 'Unit Price'}</th>
              <th className="p-3 text-start">{isArabic ? 'الكمية' : 'Qty'}</th>
              <th className="p-3 text-end">{isArabic ? 'المجموع' : 'Subtotal'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="p-3 font-bold">
                  {getLocalized(item.productNameAr, item.productNameEn, isArabic)}
                </td>
                <td className="p-3 text-zinc-500">
                  {getLocalized(item.colorNameAr, item.colorNameEn, isArabic)} / {item.sizeNameEn}
                </td>
                <td className="p-3 font-mono text-zinc-400">{item.skuSnapshot}</td>
                <td className="p-3">{formatPrice(Number(item.unitPrice), 'EGP', isArabic)}</td>
                <td className="p-3 font-bold">{item.quantity}</td>
                <td className="p-3 text-end font-black">
                  {formatPrice(Number(item.subtotal), 'EGP', isArabic)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals & Discount Breakdown Box */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <div className="w-full sm:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>{isArabic ? 'المجموع الفرعي للمنتجات:' : 'Items Subtotal:'}</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatPrice(subtotal, 'EGP', isArabic)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>{isArabic ? `خصم الكوبون ${order.appliedCoupon ? `(${order.appliedCoupon})` : ''}:` : `Coupon Discount ${order.appliedCoupon ? `(${order.appliedCoupon})` : ''}:`}</span>
                </span>
                <span>-{formatPrice(discountAmount, 'EGP', isArabic)}</span>
              </div>
            )}

            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>{isArabic ? 'مصاريف الشحن:' : 'Shipping Fee:'}</span>
              <span className="font-semibold">{shippingFee === 0 ? (isArabic ? 'مجاني' : 'Free') : formatPrice(shippingFee, 'EGP', isArabic)}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800 text-sm font-black text-zinc-900 dark:text-zinc-100">
              <span>{isArabic ? 'الإجمالي المطلوب للتحصيل:' : 'Grand Total Due:'}</span>
              <span className="text-base">{formatPrice(Number(order.totalAmount), 'EGP', isArabic)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={isArabic ? 'تأكيد حذف الطلب' : 'Confirm Delete Order'}
      >
        <div className="space-y-4 text-start">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-semibold">
              {isArabic
                ? `هل أنت متأكد من رغبتك في حذف هذا الطلب (${order.orderNumber}) نهائياً من سجل العمليات؟`
                : `Are you sure you want to permanently delete order (${order.orderNumber})?`}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
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
              <span>{isArabic ? 'نعم، احذف العملية' : 'Yes, Delete Order'}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
