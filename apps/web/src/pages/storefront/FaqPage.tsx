import React, { useState } from 'react';
import { useTheme } from '../../store/themeStore.js';
import { useStoreSettings } from '../../store/settingsStore.js';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface FaqItem {
  qAr: string;
  qEn: string;
  aAr: string;
  aEn: string;
}

export const FaqPage: React.FC = () => {
  const { isArabic } = useTheme();
  const { settings } = useStoreSettings();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const storeNameAr = settings.store_name_ar || 'المتجر';
  const storeNameEn = settings.store_name_en || 'Our Store';

  const faqs: FaqItem[] = [
    {
      qAr: 'كيف أعرف المقاس المناسب لي؟',
      qEn: 'How do I pick the right size for me?',
      aAr: `قصات ${storeNameAr} مصممة بنمط أوفر سايز (Oversized Fit) مريح. يمكنك الاطلاع على دليل المقاسات المفصل بالسنتيمتر في صفحة كل منتج، أو اختيار مقاسك المعتاد للحصول على مظهر أوفر سايز، أو مقاس أقل بدرجة لمظهر مضبوط.`,
      aEn: `${storeNameEn} silhouettes feature a modern oversized fit. Check the Size Guide on each product page with exact measurements in centimeters, or order your normal size for an oversized look.`,
    },
    {
      qAr: 'ما هي طرق الدفع المتاحة؟',
      qEn: 'What payment methods are supported?',
      aAr: 'الدفع عند الاستلام (Cash on Delivery) بعد معاينة المنتجات مع مندوب الشحن، بالإضافة لإمكانية التحويل عبر المحافظ الإلكترونية وإنستاباي (InstaPay) عند الطلب عبر واتساب.',
      aEn: 'We offer Cash on Delivery (COD) with full inspection upon delivery, as well as InstaPay and mobile wallet transfers via WhatsApp checkout.',
    },
    {
      qAr: 'كم يستغرق توصيل الطلب؟',
      qEn: 'How long does delivery take?',
      aAr: 'يستغرق التوصيل داخل القاهرة الكبرى والجيزة والإسكندرية من يومين إلى 4 أيام عمل، وباقي المحافظات من 3 إلى 5 أيام عمل.',
      aEn: 'Delivery takes 2 to 4 business days for Cairo, Giza, and Alexandria, and 3 to 5 business days for other governorates.',
    },
    {
      qAr: 'هل يمكنني معاينة المنتجات قبل الدفع؟',
      qEn: 'Can I inspect the products before paying?',
      aAr: 'نعم، نتيح لجميع عملائنا حق معاينة الخامات والتشطيب مع مندوب الشحن قبل سداد قيمة الطلب للتأكد من رضاك التام.',
      aEn: 'Yes, all customers have the right to inspect fabric quality and finishing with the courier prior to payment.',
    },
    {
      qAr: `ما هي خامات الملابس المستخدمة في ${storeNameAr}؟`,
      qEn: `What fabrics do you use in ${storeNameEn} garments?`,
      aAr: 'نستخدم خامات قطن مصري 100% عالي الكثافة (Combed Cotton) معالج ضد الانكماش والوبر بصبغات بيئية ثابتة تدوم طويلاً.',
      aEn: 'We exclusively use premium 100% Egyptian combed cotton with anti-pilling and pre-shrunk treatments.',
    },
    {
      qAr: 'كيف يمكنني استبدال أو إرجاع منتج؟',
      qEn: 'How do I exchange or return an item?',
      aAr: 'يمكنك التواصل مباشرة مع فريق خدمة العملاء عبر واتساب برقم طلبك خلال 14 يوماً من الاستلام، وسنقوم بترتيب مندوب للاستبدال أو الاسترجاع فوراً.',
      aEn: 'Simply message our WhatsApp support with your order number within 14 days of delivery, and we will dispatch an exchange courier right away.',
    },
  ];

  return (
    <div className="space-y-10 pb-20 text-start max-w-4xl mx-auto">
      {/* Header */}
      <div className="py-6 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-amber-500">
          <HelpCircle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">{isArabic ? 'مركز المساعدة' : 'Help Center'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">
          {isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500">
          {isArabic
            ? 'إجابات على أكثر الاستفسارات تكراراً حول المنتجات والمقاسات والشحن'
            : 'Answers to the most common questions about orders, sizing, and shipping'}
        </p>
      </div>

      {/* Accordion FAQ List */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-start text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
              >
                <span>{isArabic ? faq.qAr : faq.qEn}</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-black dark:text-white' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                  {isArabic ? faq.aAr : faq.aEn}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
