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
      productsApi.getAll({ limit: 24 }).catch(() => ({
        items: [],
        total: 0,
        page: 1,
        limit: 24,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      })),
      categoriesApi.getAll().catch(() => []),
      cmsApi.getActiveSections().catch(() => []),
    ])
      .then(([prodRes, catRes, cmsRes]) => {
        setProducts(prodRes?.items || []);
        // Sort categories by displayOrder
        const sortedCats = [...(catRes || [])].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
        );
        setCategories(sortedCats);
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

  const storeName = isArabic ? settings.store_name_ar || 'متجرنا' : settings.store_name_en || 'Our Store';

  // Default Sections Sequence Fallback if CMS returns empty or initial setup
  const defaultSections: { key: string; displayOrder: number }[] = [
    { key: 'hero_banner', displayOrder: 0 },
    { key: 'marquee_ticker', displayOrder: 1 },
    { key: 'categories_section', displayOrder: 2 },
    { key: 'trust_bar', displayOrder: 3 },
    { key: 'new_arrivals', displayOrder: 4 },
    { key: 'promo_banner', displayOrder: 5 },
    { key: 'about_section', displayOrder: 6 },
  ];

  // Merge CMS sections or fallback to default sections sorted by displayOrder
  const sectionsToRender = cmsSections.length > 0
    ? [...cmsSections].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    : defaultSections.map((d) => ({
        id: d.key,
        key: d.key,
        type: 'CUSTOM',
        displayOrder: d.displayOrder,
        isActive: true,
        payload: {},
      }));

  // ========================================================
  // 1. RENDER HERO BANNER
  // ========================================================
  const renderHero = (section: CMSSection) => {
    const heroPayload = (section.payload || {}) as Record<string, any>;
    const heroTitle = section.titleAr || section.titleEn
      ? getLocalized(section.titleAr, section.titleEn, isArabic)
      : isArabic
        ? `أهلاً بكم في ${storeName}`
        : `Welcome to ${storeName}`;

    const heroSubtitle = section.subtitleAr || section.subtitleEn
      ? getLocalized(section.subtitleAr, section.subtitleEn, isArabic)
      : isArabic
        ? 'اكتشف أحدث التشكيلات العصرية بأعلى معايير الجودة والتصميم.'
        : 'Discover our latest premium collection crafted with top quality standards.';

    const heroBadge = heroPayload.badgeAr || heroPayload.badgeEn
      ? isArabic
        ? String(heroPayload.badgeAr || heroPayload.badgeEn)
        : String(heroPayload.badgeEn || heroPayload.badgeAr)
      : isArabic
        ? 'تشكيلة جديدة'
        : 'NEW DROP';

    const heroCtaText = heroPayload.ctaTextAr || heroPayload.ctaTextEn || heroPayload.buttonTextAr || heroPayload.buttonTextEn
      ? isArabic
        ? String(heroPayload.ctaTextAr || heroPayload.buttonTextAr || heroPayload.ctaTextEn)
        : String(heroPayload.ctaTextEn || heroPayload.buttonTextEn || heroPayload.ctaTextAr)
      : isArabic
        ? 'تسوق الآن'
        : 'Shop Now';

    const heroCtaLink = heroPayload.ctaLink || heroPayload.buttonUrl ? String(heroPayload.ctaLink || heroPayload.buttonUrl) : '/shop';
    const rawImageUrl = heroPayload.imageUrl || heroPayload.image || '';
    const heroImage = rawImageUrl && heroPayload.showImage !== false ? String(rawImageUrl) : '';
    const heroLayout = (heroPayload.layoutStyle as 'split' | 'cover' | 'card') || 'split';
    const overlayDarkness = (heroPayload.overlayDarkness as 'light' | 'medium' | 'dark') || 'medium';
    const imagePosition = (heroPayload.imagePosition as 'center' | 'top' | 'bottom') || 'center';
    const heightSize = (heroPayload.heightSize as 'compact' | 'normal' | 'tall') || 'normal';

    const positionClass =
      imagePosition === 'top'
        ? 'object-top'
        : imagePosition === 'bottom'
          ? 'object-bottom'
          : 'object-center';

    const heightClass =
      heightSize === 'compact'
        ? 'min-h-[360px] sm:min-h-[420px]'
        : heightSize === 'tall'
          ? 'min-h-[540px] sm:min-h-[640px]'
          : 'min-h-[440px] sm:min-h-[520px]';

    const coverOverlayClass =
      overlayDarkness === 'light'
        ? 'from-black/70 via-black/40 to-black/20'
        : overlayDarkness === 'dark'
          ? 'from-black/90 via-black/75 to-black/60'
          : 'from-black/85 via-black/55 to-black/35';

    if (heroImage && heroLayout === 'cover') {
      return (
        <section
          key={section.key}
          className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800 shadow-xl flex items-center ${heightClass}`}
        >
          <img
            src={heroImage}
            alt={heroTitle}
            className={`absolute inset-0 w-full h-full object-cover ${positionClass} scale-100 hover:scale-105 transition-transform duration-1000`}
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${coverOverlayClass}`} />
          <div className="relative z-10 p-8 sm:p-12 lg:p-16 text-start max-w-2xl space-y-4 sm:space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{heroBadge}</span>
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tight whitespace-pre-line drop-shadow-md">
              {heroTitle}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-zinc-200 font-medium max-w-lg leading-relaxed whitespace-pre-line drop-shadow">
              {heroSubtitle}
            </p>
            <div className="pt-2 sm:pt-4 flex flex-wrap gap-3">
              <Link to={heroCtaLink}>
                <button className="px-7 py-3 sm:px-9 sm:py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm rounded-xl shadow-xl transition flex items-center gap-2">
                  <span>{heroCtaText}</span>
                  {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </Link>
              <Link to="/about">
                <button className="px-6 py-3 sm:px-7 sm:py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-xs sm:text-sm rounded-xl transition">
                  {isArabic ? 'عن المتجر' : 'About Us'}
                </button>
              </Link>
            </div>
          </div>
        </section>
      );
    }

    if (heroImage && heroLayout === 'card') {
      return (
        <section
          key={section.key}
          className={`relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#f6f4f0] via-[#ece7de] to-[#dfd7ca] dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-6 sm:p-10 lg:p-12 ${heightClass} flex items-center`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
            <div className="space-y-4 sm:space-y-6 text-start flex flex-col justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200 w-fit">
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
            <div className="relative group">
              <div className="p-2 sm:p-3 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/60 dark:border-zinc-700/60 shadow-xl overflow-hidden aspect-[4/3] sm:aspect-[16/11]">
                <img
                  src={heroImage}
                  alt={heroTitle}
                  className={`w-full h-full object-cover ${positionClass} rounded-xl sm:rounded-2xl group-hover:scale-105 transition-transform duration-700`}
                />
              </div>
            </div>
          </div>
        </section>
      );
    }

    // Default Split side-by-side
    return (
      <section
        key={section.key}
        className={`relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#f6f4f0] via-[#ece7de] to-[#dfd7ca] dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-sm ${heightClass} flex items-center`}
      >
        <div className={`grid items-center w-full h-full ${heroImage ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
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

          {heroImage && (
            <div className="h-64 sm:h-80 md:h-full min-h-[280px] sm:min-h-[380px] relative">
              <img
                src={heroImage}
                alt={heroTitle}
                className={`w-full h-full object-cover ${positionClass}`}
              />
            </div>
          )}
        </div>
      </section>
    );
  };

  // ========================================================
  // 2. RENDER MARQUEE TICKER
  // ========================================================
  const renderMarquee = (section: CMSSection) => (
    <section key={section.key} className="rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
      <MarqueeBanner variant="dark" />
    </section>
  );

  // ========================================================
  // 3. RENDER CATEGORIES SHOWCASE
  // ========================================================
  const renderCategories = (section: CMSSection) => {
    if (categories.length === 0) return null;
    const categoriesTitle = section.titleAr || section.titleEn
      ? getLocalized(section.titleAr, section.titleEn, isArabic)
      : isArabic
        ? 'تصفح حسب القسم'
        : 'Shop by Category';

    return (
      <section key={section.key} className="space-y-4 sm:space-y-6">
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
    );
  };

  // ========================================================
  // 4. RENDER TRUST & GUARANTEES BAR
  // ========================================================
  const renderTrust = (section: CMSSection) => (
    <section key={section.key} className="py-5 px-4 sm:px-8 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
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
  );

  // ========================================================
  // 5. RENDER NEW ARRIVALS / PRODUCTS GRID
  // ========================================================
  const renderNewArrivals = (section: CMSSection) => {
    const newArrivalsPayload = (section.payload || {}) as Record<string, any>;
    const newArrivalsTitle = section.titleAr || section.titleEn
      ? getLocalized(section.titleAr, section.titleEn, isArabic)
      : isArabic
        ? 'أحدث المنتجات'
        : 'New Arrivals';

    const newArrivalsSubtitle = section.subtitleAr || section.subtitleEn
      ? getLocalized(section.subtitleAr, section.subtitleEn, isArabic)
      : isArabic
        ? 'المعروضات'
        : 'EXPLORE';

    const limit = Number(newArrivalsPayload.limit) || 12;
    const displayedProducts = products.slice(0, limit);

    return (
      <section key={section.key} className="space-y-6">
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
                  ? 'نقوم حالياً بتجهيز وإضافة أحدث المنتجات إلى المتجر.'
                  : 'We are currently curating and uploading new products.'}
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
    );
  };

  // ========================================================
  // 6. RENDER PROMO / SPECIAL OFFER BANNER
  // ========================================================
  const renderPromo = (section: CMSSection) => {
    const promoPayload = (section.payload || {}) as Record<string, any>;
    const badge = promoPayload.badgeAr || promoPayload.badgeEn
      ? isArabic
        ? String(promoPayload.badgeAr || promoPayload.badgeEn)
        : String(promoPayload.badgeEn || promoPayload.badgeAr)
      : isArabic
        ? 'عرض خاص'
        : 'SPECIAL PROMOTION';

    const title = getLocalized(section.titleAr, section.titleEn, isArabic);
    const subtitle = getLocalized(section.subtitleAr, section.subtitleEn, isArabic);
    const ctaText = promoPayload.ctaTextAr
      ? isArabic
        ? String(promoPayload.ctaTextAr)
        : String(promoPayload.ctaTextEn || promoPayload.ctaTextAr)
      : isArabic
        ? 'تسوق العرض الآن'
        : 'Shop Offer Now';

    return (
      <section key={section.key} className="p-8 sm:p-12 rounded-3xl bg-[#f6f5f1] dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          {badge}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 whitespace-pre-line">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed whitespace-pre-line">
            {subtitle}
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
              {ctaText}
            </button>
          </Link>
        </div>
      </section>
    );
  };

  // ========================================================
  // 7. RENDER ABOUT BRAND STORY
  // ========================================================
  const renderAbout = (section: CMSSection) => {
    const title = getLocalized(section.titleAr, section.titleEn, isArabic) || (isArabic ? `عن ${storeName}` : `About ${storeName}`);
    const subtitle = getLocalized(section.subtitleAr, section.subtitleEn, isArabic);

    return (
      <section key={section.key} className="p-8 sm:p-12 rounded-3xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-start space-y-3">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
          {isArabic ? 'عن المتجر' : 'ABOUT'}
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 whitespace-pre-line">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl whitespace-pre-line">
            {subtitle}
          </p>
        )}
      </section>
    );
  };

  // Helper matcher
  const isHeroSection = (s: CMSSection) =>
    s.key === 'hero_banner' || s.key === 'home_hero_slider' || s.key === 'hero_section' || s.type === 'HERO' || s.type === 'HERO_SLIDER';
  const isMarqueeSection = (s: CMSSection) => s.key === 'marquee_ticker' || s.type === 'MARQUEE';
  const isCategoriesSection = (s: CMSSection) => s.key === 'categories_section' || s.type === 'CATEGORIES';
  const isTrustSection = (s: CMSSection) => s.key === 'trust_bar' || s.type === 'TRUST_BAR';
  const isNewArrivalsSection = (s: CMSSection) => s.key === 'new_arrivals' || s.type === 'NEW_ARRIVALS';
  const isPromoSection = (s: CMSSection) =>
    s.key === 'promo_banner' || s.key === 'promo_summer' || s.key === 'home_promo_summer' || s.type === 'PROMO_BANNER';
  const isAboutSection = (s: CMSSection) => s.key === 'about_section' || s.key === 'about_craft' || s.type === 'ABOUT';

  return (
    <div className="space-y-10 sm:space-y-16 lg:space-y-20 pb-16">
      {sectionsToRender.map((section) => {
        if (section.isActive === false) return null;

        if (isHeroSection(section)) return renderHero(section);
        if (isMarqueeSection(section)) return renderMarquee(section);
        if (isCategoriesSection(section)) return renderCategories(section);
        if (isTrustSection(section)) return renderTrust(section);
        if (isNewArrivalsSection(section)) return renderNewArrivals(section);
        if (isPromoSection(section)) return renderPromo(section);
        if (isAboutSection(section)) return renderAbout(section);

        return null;
      })}
    </div>
  );
};
