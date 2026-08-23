import React from 'react';
import { useTheme } from '../../store/themeStore.js';
import { Truck, Clock, MapPin, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ShippingPolicyPage: React.FC = () => {
  const { isArabic } = useTheme();

  return (
    <div className="space-y-10 pb-20 text-start max-w-4xl mx-auto">
      {/* Header */}
      <div className="py-6 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">
          {isArabic ? 'سياسة الشحن والتوصيل' : 'Shipping & Delivery Policy'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500">
          {isArabic
            ? 'كل ما تحتاج معرفته عن أوقات ومصاريف الشحن لجميع المحافظات'
            : 'Everything you need to know about delivery times and shipping rates'}
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <Truck className="w-6 h-6 text-amber-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {isArabic ? 'شحن مجاني' : 'Free Shipping'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isArabic ? 'للطلبات التي تتجاوز قيمتها 1000 جنيه مصري.' : 'On all orders exceeding 1000 EGP.'}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <Clock className="w-6 h-6 text-amber-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {isArabic ? 'توصيل سريع' : 'Fast Dispatch'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isArabic ? 'خلال 2 إلى 4 أيام عمل داخل القاهرة والجيزة.' : 'Within 2 to 4 business days for Cairo & Giza.'}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <MapPin className="w-6 h-6 text-amber-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {isArabic ? 'تغطية لكافة المحافظات' : 'Nationwide Coverage'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isArabic ? 'نشحن لجميع محافظات ومدن جمهورية مصر العربية.' : 'We deliver to all cities and governorates in Egypt.'}
          </p>
        </div>
      </div>

      {/* Policy Details */}
      <div className="space-y-6 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{isArabic ? 'أوقات وتكاليف الشحن التقديرية' : 'Estimated Delivery Times & Rates'}</span>
          </h2>
          <ul className="list-disc list-inside space-y-1.5 pt-1">
            <li>
              <strong>{isArabic ? 'القاهرة الكبرى والجيزة والإسكندرية:' : 'Cairo, Giza & Alexandria:'}</strong>{' '}
              {isArabic ? '2 - 4 أيام عمل (تكلفة الشحن 50 جنيه).' : '2 - 4 business days (50 EGP standard rate).'}
            </li>
            <li>
              <strong>{isArabic ? 'محافظات الدلتا والقناة:' : 'Delta & Canal Governorates:'}</strong>{' '}
              {isArabic ? '3 - 5 أيام عمل (تكلفة الشحن 50 - 65 جنيه).' : '3 - 5 business days.'}
            </li>
            <li>
              <strong>{isArabic ? 'محافظات الصعيد والبحر الأحمر وجنوب سيناء:' : 'Upper Egypt & Coastal cities:'}</strong>{' '}
              {isArabic ? '4 - 6 أيام عمل.' : '4 - 6 business days.'}
            </li>
          </ul>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>{isArabic ? 'حق المعاينة عند الاستلام' : 'Inspection on Delivery'}</span>
          </h2>
          <p>
            {isArabic
              ? 'يحق للعميل معاينة المنتجات والتأكد من الخامة والمقاس أثناء تواجد مندوب الشحن قبل دفع المبلغ نقداً.'
              : 'Customers have the full right to inspect fabric quality and size upon courier arrival prior to paying cash on delivery.'}
          </p>
        </div>
      </div>
    </div>
  );
};
