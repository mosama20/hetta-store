import React from 'react';
import { useTheme } from '../../store/themeStore.js';
import { RotateCcw, ShieldCheck, CheckCircle2, PhoneCall } from 'lucide-react';

export const ReturnsPolicyPage: React.FC = () => {
  const { isArabic } = useTheme();

  return (
    <div className="space-y-10 pb-20 text-start max-w-4xl mx-auto">
      {/* Header */}
      <div className="py-6 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">
          {isArabic ? 'سياسة الاستبدال والاسترجاع' : 'Exchange & Returns Policy'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500">
          {isArabic
            ? 'شروط وإجراءات الاسترجاع والاستبدال خلال 14 يوماً من استلام الطلب'
            : 'Conditions and procedures for exchanges and returns within 14 days'}
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <RotateCcw className="w-6 h-6 text-amber-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {isArabic ? 'استرجاع واستبدال 14 يوم' : '14-Day Guarantee'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isArabic ? 'يمكنك تبديل المقاس أو استرجاع المنتج بسهولة.' : 'Effortless size exchange or complete return.'}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <ShieldCheck className="w-6 h-6 text-amber-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {isArabic ? 'حالة المنتج الأصلية' : 'Original Condition'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isArabic ? 'يشترط وجود التكت والملصقات وبنفس التغليف الأصلي.' : 'Must include tags and original packaging.'}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <PhoneCall className="w-6 h-6 text-amber-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {isArabic ? 'طلب مباشر عبر واتساب' : 'Direct WhatsApp Request'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isArabic ? 'فريقنا متاح لمساعدتك وترتيب مندوب الاستبدال فوراً.' : 'Our team arranges return pickup via WhatsApp.'}
          </p>
        </div>
      </div>

      {/* Conditions */}
      <div className="space-y-6 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{isArabic ? 'شروط قبول الاستبدال والاسترجاع' : 'Eligibility Requirements'}</span>
          </h2>
          <ul className="list-disc list-inside space-y-2 pt-1">
            <li>{isArabic ? 'أن يتم تقديم طلب الاستبدال أو الاسترجاع خلال 14 يوماً من تاريخ استلام الشحنة.' : 'Requests must be made within 14 days of delivery receipt.'}</li>
            <li>{isArabic ? 'أن تكون المنتجات غير ملبوسة، غير مغسولة، وخالية من أي عطور أو أضرار.' : 'Items must be unwashed, unworn, scent-free, and undamaged.'}</li>
            <li>{isArabic ? 'وجود جميع البطاقات والتكتات الأصلية (Tags) المرفقة بالملابس.' : 'All original brand tags and labels must remain attached.'}</li>
            <li>{isArabic ? 'في حالة وجود عيب صناعة أو استلام مقاس خاطئ، يتحمل المتجر كافة مصاريف الشحن.' : 'If an item is defective or incorrect, CRAFT covers all return shipping fees.'}</li>
          </ul>
        </div>

        {/* WhatsApp CTA */}
        <div className="p-6 rounded-2xl bg-[#f2eee9] dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'هل تريد استبدال مقاسك الآن؟' : 'Need to exchange your size?'}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              {isArabic ? 'تواصل معنا مباشرة عبر واتساب مع ذكر رقم طلبك.' : 'Contact our team on WhatsApp with your order number.'}
            </p>
          </div>
          <a
            href="https://wa.me/201234567890?text=مرحباً، أود تقديم طلب استبدال/استرجاع"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition shrink-0"
          >
            {isArabic ? 'طلب استبدال عبر واتساب' : 'Request on WhatsApp'}
          </a>
        </div>
      </div>
    </div>
  );
};
