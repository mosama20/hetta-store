import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  RotateCcw,
  Award,
  Truck,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Product, Category, CMSSection } from '../../types/index.js';
import { productsApi, categoriesApi, cmsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { useStoreSettings } from '../../store/settingsStore.js';
import { getLocalized } from '../../utils/formatters.js';
import { ProductCard } from '../../components/storefront/ProductCard.js';
import { MarqueeBanner } from '../../components/storefront/MarqueeBanner.js';
import { LoadingState } from '../../components/common/LoadingState.js';

export const HomePage: React.FC = () => {
  const { isArabic } = useTheme();
  const { settings } = useStoreSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cmsSections, setCmsSections] = useState<CMSSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    Promise.all([
      productsApi.getAll({ limit: 12 }),
      categoriesApi.getAll(),
      cmsApi.getActiveSections().catch(() => []),
    ])
      .then(([prodRes, catRes, cmsRes]) => {
        setProducts(prodRes.items || []);
        setCategories(catRes || []);
        setCmsSections(cmsRes || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading...'} />;
  }

  // Dynamic CMS sections
  const heroSection = cmsSections.find((s) => s.key === 'hero_banner' || s.type === 'HERO');
  const marqueeSection = cmsSections.find((s) => s.key === 'marquee_ticker' || s.type === 'MARQUEE');
  const categoriesSection = cmsSections.find((s) => s.key === 'categories_section' || s.type === 'CATEGORIES');
  const trustSection = cmsSections.find((s) => s.key === 'trust_bar' || s.type === 'TRUST_BAR');
  const newArrivalsSection = cmsSections.find((s) => s.key === 'new_arrivals' || s.type === 'NEW_ARRIVALS');
  const promoSection = cmsSections.find((s) => (s.key === 'promo_banner' || s.key === 'promo_summer' || s.type === 'PROMO_BANNER') && s.isActive);
  const aboutSection = cmsSections.find((s) => (s.key === 'about_section' || s.key === 'about_craft' || s.type === 'ABOUT') && s.isActive);

  const showHero = heroSection ? heroSection.isActive !== false : true;
  const showMarquee = marqueeSection ? marqueeSection.isActive !== false : true;
  const showCategories = categoriesSection ? categoriesSection.isActive !== false : true;
  const showTrust = trustSection ? trustSection.isActive !== false : true;
  const showNewArrivals = newArrivalsSection ? newArrivalsSection.isActive !== false : true;

  const storeName = isArabic ? settings.store_name_ar || 'متجرنا' : settings.store_name_en || 'Our Store';

  const heroTitle = heroSection?.titleAr || heroSection?.titleEn
    ? getLocalized(heroSection.titleAr, heroSection.titleEn, isArabic)
    : isArabic
      ? `أهلاً بكم في ${storeName}`
      : `Welcome to ${storeName}`;

  const heroSubtitle = heroSection?.subtitleAr || heroSection?.subtitleEn
    ? getLocalized(heroSection.subtitleAr, heroSection.subtitleEn, isArabic)
    : isArabic
      ? 'اكتشف أحدث التشكيلات العصرية بأعلى معايير الجودة والتصميم.'
      : 'Discover our latest premium collection crafted with top quality standards.';

  const heroPayload = (heroSection?.payload || {}) as Record<string, any>;
  const promoPayload = (promoSection?.payload || {}) as Record<string, any>;
  const newArrivalsPayload = (newArrivalsSection?.payload || {}) as Record<string, any>;

  const heroBadge = heroPayload.badgeAr || heroPayload.badgeEn
    ? isArabic
      ? String(heroPayload.badgeAr || heroPayload.badgeEn)
      : String(heroPayload.badgeEn || heroPayload.badgeAr)
    : isArabic
      ? 'تشكيلة جديدة'
      : 'NEW DROP';

  const heroCtaText = heroPayload.ctaTextAr || heroPayload.ctaTextEn
    ? isArabic
      ? String(heroPayload.ctaTextAr || heroPayload.ctaTextEn)
      : String(heroPayload.ctaTextEn || heroPayload.ctaTextAr)
    : isArabic
      ? 'تسوق الآن'
      : 'Shop Now';

  const heroCtaLink = heroPayload.ctaLink ? String(heroPayload.ctaLink) : '/shop';
  const heroImage = heroPayload.imageUrl ? String(heroPayload.imageUrl) : '';

  // New Arrivals titles and limit
  const newArrivalsTitle = newArrivalsSection?.titleAr || newArrivalsSection?.titleEn
    ? getLocalized(newArrivalsSection.titleAr, newArrivalsSection.titleEn, isArabic)
    : isArabic
      ? 'أحدث المنتجات'
      : 'New Arrivals';

  const newArrivalsSubtitle = newArrivalsSection?.subtitleAr || newArrivalsSection?.subtitleEn
    ? getLocalized(newArrivalsSection.subtitleAr, newArrivalsSection.subtitleEn, isArabic)
    : isArabic
      ? 'المعروضات'
      : 'EXPLORE';

  const newArrivalsLimit = Number(newArrivalsPayload.limit) || 12;
  const displayedProducts = products.slice(0, newArrivalsLimit);

  // Categories section titles
  const categoriesTitle = categoriesSection?.titleAr || categoriesSection?.titleEn
    ? getLocalized(categoriesSection.titleAr, categoriesSection.titleEn, isArabic)
    : isArabic
      ? 'تصفح حسب القسم'
      : 'Shop by Category';

  return (
    <div className="space-y-10 sm:space-y-16 lg:space-y-20 pb-16">
      {/* ========================================================
          1. HERO BANNER (100% Dynamic from Dashboard CMS)
      ======================================================== */}
      {showHero && (
        <section className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#f6f4f0] via-[#ece7de] to-[#dfd7ca] dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
          <div className={`grid items-center ${heroImage ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Text Content */}
            <div className="p-8 sm:p-12 lg:p-16 space-y-4 sm:space-y-6 text-start flex flex-col justify-center">
              <div className="space-y-3 sm:space-y-4 max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{heroBadge}</span>
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-zinc-100 leading-[1.15] tracking-tight whitespace-pre-line">
                  {heroTitle}
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed whitespace-pre-line">
                  {heroSubtitle}
                </p>
                <div className="pt-2 sm:pt-4 flex flex-wrap gap-3">
                  <Link to={heroCtaLink}>
                    <button className="px-7 py-3 sm:px-9 sm:py-3.5 bg-black text-white dark:bg-white dark:text-black font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition flex items-center gap-2">
                      <span>{heroCtaText}</span>
                      {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                  </Link>
                  <Link to="/about">
                    <button className="px-6 py-3 sm:px-7 sm:py-3.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-xs sm:text-sm rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition">
                      {isArabic ? 'عن المتجر' : 'About Us'}
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* User's Uploaded Hero Banner Photo (If configured) */}
            {heroImage && (
              <div className="h-64 sm:h-80 md:h-full min-h-[280px] sm:min-h-[380px] relative">
                <img
                  src={heroImage}
                  alt={heroTitle}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================
          ANIMATED MARQUEE TICKER
      ======================================================== */}
      {showMarquee && (
        <section className="rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
          <MarqueeBanner variant="dark" />
        </section>
      )}

      {/* ========================================================
          2. DYNAMIC CATEGORIES (Only displays user's real categories)
      ======================================================== */}
      {showCategories && categories.length > 0 && (
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
              {categoriesTitle}
            </h2>
            <Link
              to="/shop"
              className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition"
            >
              {isArabic ? 'عرض الكل' : 'View All'}
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group flex flex-col items-center space-y-2 text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-[#f4f4f4] dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-1.5 sm:p-2 overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.nameEn}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-sm sm:text-base font-black text-zinc-700 dark:text-zinc-300">
                      {(cat.nameAr || cat.nameEn).slice(0, 2)}
                    </span>
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition line-clamp-1">
                  {getLocalized(cat.nameAr, cat.nameEn, isArabic)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          3. VALUE PROPOSITION / TRUST BAR
      ======================================================== */}
      {showTrust && (
        <section className="py-5 px-4 sm:px-8 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-start">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-800 dark:text-zinc-200 shrink-0" />
              <div>
                <p className="text-[11px] sm:text-xs font-black text-zinc-900 dark:text-zinc-100">
                  {isArabic ? 'شحن سريع وموثوق' : 'Fast Delivery'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-500">
                  {isArabic ? 'توصيل لباب بيتك' : 'To your doorstep'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-800 dark:text-zinc-200 shrink-0" />
              <div>
                <p className="text-[11px] sm:text-xs font-black text-zinc-900 dark:text-zinc-100">
                  {isArabic ? 'إرجاع واستبدال فوري' : 'Easy Exchange'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-500">
                  {isArabic ? 'خلال 14 يوماً' : 'Within 14 days'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-800 dark:text-zinc-200 shrink-0" />
              <div>
                <p className="text-[11px] sm:text-xs font-black text-zinc-900 dark:text-zinc-100">
                  {isArabic ? 'جودة مضمونة' : 'Premium Quality'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-500">
                  {isArabic ? 'أفضل الخامات' : 'Finest materials'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-800 dark:text-zinc-200 shrink-0" />
              <div>
                <p className="text-[11px] sm:text-xs font-black text-zinc-900 dark:text-zinc-100">
                  {isArabic ? 'دفع عند الاستلام' : 'Cash on Delivery'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-500">
                  {isArabic ? 'معاينة قبل الاستلام' : 'Inspect before paying'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          4. NEW ARRIVALS / "جديدنا" (User's Real Products)
      ======================================================== */}
      {showNewArrivals && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                {newArrivalsSubtitle}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {newArrivalsTitle}
              </h2>
            </div>

            {displayedProducts.length > 0 && (
              <Link
                to="/shop"
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              >
                {isArabic ? 'عرض كل المنتجات' : 'View All'}
              </Link>
            )}
          </div>

          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {displayedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div className="py-14 sm:py-20 px-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {isArabic ? 'التشكيلة قادمة قريباً!' : 'New Collection Coming Soon!'}
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  {isArabic
                    ? 'نقوم حالياً بتجهيز وإضافة أحدث المنتجات إلى المتجر. يمكنك التواصل معنا مباشرة أو زيارة لوحة التحكم لإضافة المنتجات.'
                    : 'We are currently curating and uploading new products. Stay tuned!'}
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Link to="/admin/products/new">
                  <button className="px-5 py-2 bg-black text-white dark:bg-white dark:text-black text-xs font-bold rounded-xl shadow hover:bg-zinc-800 transition">
                    {isArabic ? 'إضافة منتج من لوحة التحكم' : 'Add Products in Admin'}
                  </button>
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          5. PROMO / STORY SECTION (If enabled in CMS)
      ======================================================== */}
      {promoSection && (
        <section className="p-8 sm:p-12 rounded-3xl bg-[#f6f5f1] dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {promoPayload.badgeAr || promoPayload.badgeEn
              ? isArabic
                ? String(promoPayload.badgeAr || promoPayload.badgeEn)
                : String(promoPayload.badgeEn || promoPayload.badgeAr)
              : isArabic
                ? 'عرض خاص'
                : 'SPECIAL PROMOTION'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 whitespace-pre-line">
            {getLocalized(promoSection.titleAr, promoSection.titleEn, isArabic)}
          </h2>
          {promoSection.subtitleAr && (
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed whitespace-pre-line">
              {getLocalized(promoSection.subtitleAr, promoSection.subtitleEn, isArabic)}
            </p>
          )}
          {promoPayload.imageUrl && (
            <div className="max-w-md mx-auto rounded-2xl overflow-hidden shadow my-3">
              <img src={String(promoPayload.imageUrl)} alt="" className="w-full h-48 object-cover" />
            </div>
          )}
          <div className="pt-2">
            <Link to={String(promoPayload.ctaLink || '/shop')}>
              <button className="px-7 py-2.5 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-xl shadow hover:bg-zinc-800 transition">
                {promoPayload.ctaTextAr
                  ? isArabic
                    ? String(promoPayload.ctaTextAr)
                    : String(promoPayload.ctaTextEn || promoPayload.ctaTextAr)
                  : isArabic
                    ? 'تسوق العرض الآن'
                    : 'Shop Offer Now'}
              </button>
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================
          6. ABOUT SECTION (If enabled in CMS)
      ======================================================== */}
      {aboutSection && (
        <section className="p-8 sm:p-12 rounded-3xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-start space-y-3">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
            {isArabic ? 'عن المتجر' : 'ABOUT'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 whitespace-pre-line">
            {getLocalized(aboutSection.titleAr, aboutSection.titleEn, isArabic)}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl whitespace-pre-line">
            {getLocalized(aboutSection.subtitleAr, aboutSection.subtitleEn, isArabic)}
          </p>
        </section>
      )}
    </div>
  );
};
