import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order, OrderStatus } from '../../types/index.js';
import { ordersApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, formatDate, getLocalized } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { Select } from '../../components/common/Select.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { MessageCircle, ArrowLeft, Printer } from 'lucide-react';

export const AdminOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isArabic } = useTheme();

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const waUrl = `https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `مرحباً ${order.customerName}، معك فريق متجر CRAFT بخصوص طلبك رقم ${order.orderNumber} (الحالة الحالية: ${order.status}).`,
  )}`;

  return (
    <div className="space-y-6 text-start max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between text-xs text-zinc-500 print:hidden">
        <Link
          to="/admin/orders"
          className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 rtl:rotate-180" />
          <span>{isArabic ? 'العودة للطلبات' : 'Back to Orders'}</span>
        </Link>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-bold"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{isArabic ? 'طباعة الفاتورة / البوليصة' : 'Print Packing Slip'}</span>
        </button>
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
              {order.customerCity} - {order.customerAddress}
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
              {isArabic ? 'الإجمالي النهائي:' : 'Final Total:'}
            </p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              {formatPrice(Number(order.totalAmount), 'EGP', isArabic)}
            </p>
          </div>
        </Card>

        {/* Store Stamp / Dispatch Info */}
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-zinc-400 border-b pb-2">
            {isArabic ? 'معلومات المتجر' : 'Store Dispatch'}
          </h3>
          <div className="space-y-1 text-xs text-zinc-500">
            <p className="font-bold text-zinc-900 dark:text-zinc-100">CRAFT Egypt</p>
            <p>100% Egyptian Combed Cotton</p>
            <p className="text-[11px] pt-1 text-emerald-600 font-bold">
              {isArabic ? 'معاينة عند الاستلام ودفع نقدي' : 'Cash on Delivery with Inspection'}
            </p>
          </div>
        </Card>
      </div>

      {/* Snapshot Items Table */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          {isArabic ? 'المنتجات المطلوبة (لقطة تاريخية محفوظة)' : 'Immutable Order Items Snapshot'}
        </h3>
        <table className="w-full text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-bold uppercase">
            <tr>
              <th className="p-3 text-start">{isArabic ? 'المنتج' : 'Product Snapshot'}</th>
              <th className="p-3 text-start">{isArabic ? 'اللون والمقاس' : 'Attributes'}</th>
              <th className="p-3 text-start">SKU</th>
              <th className="p-3 text-start">{isArabic ? 'سعر الوحدة' : 'Unit Price'}</th>
              <th className="p-3 text-start">{isArabic ? 'الكمية' : 'Qty'}</th>
              <th className="p-3 text-end">{isArabic ? 'الإجمالي' : 'Subtotal'}</th>
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
      </Card>
    </div>
  );
};
