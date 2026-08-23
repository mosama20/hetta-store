import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Order } from '../../types/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice } from '../../utils/formatters.js';
import { Button } from '../../components/common/Button.js';
import { CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const { isArabic } = useTheme();
  const state = location.state as { order?: Order; whatsappUrl?: string } | undefined;

  const order = state?.order;
  const whatsappUrl = state?.whatsappUrl;

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">{isArabic ? 'الطلب غير متوفر' : 'Order Not Found'}</h2>
        <Link to="/shop">
          <Button variant="primary">{isArabic ? 'تصفح المتجر' : 'Go to Shop'}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-xl mx-auto space-y-8 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
          {isArabic ? 'تم استلام طلبك بنجاح!' : 'Order Received Successfully!'}
        </h1>
        <p className="text-sm text-zinc-500">
          {isArabic
            ? `رقم الطلب الخاص بك هو: ${order.orderNumber}`
            : `Your order tracking number is: ${order.orderNumber}`}
        </p>
      </div>

      {/* WhatsApp Call to Action */}
      {whatsappUrl && (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-800 space-y-4">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {isArabic
              ? 'اضغط على الزر أدناه لإرسال تفاصيل طلبك مباشرة إلى فريق المبيعات عبر واتساب لتأكيد الشحن فوراً:'
              : 'Click the button below to send your order details directly to our WhatsApp team for immediate dispatch confirmation:'}
          </p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="block w-full">
            <Button
              variant="gold"
              size="lg"
              className="w-full shadow-xl bg-emerald-600 hover:bg-emerald-700"
            >
              <MessageCircle className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
              <span>{isArabic ? 'المتابعة الآن عبر واتساب' : 'Continue on WhatsApp'}</span>
            </Button>
          </a>
        </div>
      )}

      {/* Summary Card */}
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-start space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          {isArabic ? 'تفاصيل الطلب' : 'Order Details'}
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">{isArabic ? 'اسم العميل:' : 'Customer Name:'}</span>
            <span className="font-bold">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">{isArabic ? 'رقم الهاتف:' : 'Phone:'}</span>
            <span className="font-bold" dir="ltr">
              {order.customerPhone}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">{isArabic ? 'الإجمالي:' : 'Total Amount:'}</span>
            <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">
              {formatPrice(Number(order.totalAmount), 'EGP', isArabic)}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Link to="/shop">
          <Button variant="outline" size="md">
            <span>{isArabic ? 'مواصلة التسوق' : 'Continue Shopping'}</span>
            <ArrowRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
