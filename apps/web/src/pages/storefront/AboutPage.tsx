import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../store/themeStore.js';
import { useStoreSettings } from '../../store/settingsStore.js';
import { ShieldCheck, Award, Sparkles, HeartHandshake, ArrowRight, ArrowLeft } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { isArabic } = useTheme();
  const { settings } = useStoreSettings();

  const storeName = isArabic ? settings.store_name_ar || 'متجرنا' : settings.store_name_en || 'Our Store';

  return (
    <div className="space-y-12 sm:space-y-16 pb-20 text-start max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-4 pt-6">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          {isArabic ? 'قصتنا ورؤيتنا' : 'OUR STORY & VISION'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
          {isArabic ? `عن ${storeName}` : `About ${storeName}`}
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {isArabic
            ? `نحرص في ${storeName} على تقديم أحدث صيحات الموضة والأزياء العصرية بخامات متميزة وأسعار تنافسية مع تجربة تسوق إلكترونية سريعة ومريحة.`
            : `At ${storeName}, we are dedicated to bringing you the latest fashion and contemporary styles with exceptional quality and unmatched service.`}
        </p>
      </section>

      {/* Main Philosophy Card */}
      <section className="p-8 sm:p-12 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
          {isArabic ? 'رؤيتنا في الجودة والتصميم' : 'Our Commitment to Quality'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
          {isArabic
            ? 'نعمل بشغف لاختيار أجود الأقمشة والخامات ومتابعة أدق التفاصيل من مراحل التصميم والقص حتى التغليف والشحن. هدفنا الأساسي هو رضا العميل وتقديم قيمة حقيقية تدوم.'
            : 'We meticulously select premium fabrics and monitor every detail from design to packaging and swift delivery. Our primary goal is customer satisfaction and timeless value.'}
        </p>
        <div className="pt-2">
          <Link to="/shop">
            <button className="px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-xl shadow hover:bg-zinc-800 transition flex items-center gap-2">
              <span>{isArabic ? 'تصفح تشكيلة المنتجات' : 'Explore Collection'}</span>
              {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </Link>
        </div>
      </section>

      {/* Brand Values */}
      <section className="space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {isArabic ? 'قيمنا ومبادئنا' : 'Our Core Values'}
          </h2>
          <p className="text-xs text-zinc-500">
            {isArabic ? `ما يميز تجربة التسوق في ${storeName}` : `Why choose ${storeName}`}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <Award className="w-6 h-6 text-amber-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'خامات منتقاة' : 'Premium Fabrics'}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {isArabic ? 'اختيار دقيق لأفضل الخامات والأقمشة العصرية لراحة تدوم.' : 'Curated premium materials ensuring comfort and durability.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'تصاميم عصرية' : 'Modern Silhouettes'}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {isArabic ? 'مواكبة لأحدث صيحات الموضة وقصات مريحة لكل الأوقات.' : 'Keeping up with modern trends and comfortable daily cuts.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'حق المعاينة والضمان' : 'Satisfaction Guarantee'}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {isArabic ? 'حق معاينة الشحنة قبل الاستلام مع سياسة استبدال سهلة وسريعة.' : 'Inspect package before paying with easy return options.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <HeartHandshake className="w-6 h-6 text-amber-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'دعم فوري ومباشر' : 'Direct Support'}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {isArabic ? 'تواصل ومتابعة سريعة لطلباتك عبر واتساب طوال الأسبوع.' : 'Instant WhatsApp support and order follow-up all week.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
