import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  RotateCcw,
  Award,
  Truck,
  ArrowRight,
  ArrowLeft,
  Flame,
  ShoppingBag,
} from 'lucide-react';
import { Product, Category, CMSSection } from '../../types/index.js';
import { categoriesApi, cmsApi, productsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { useStoreSettings } from '../../store/settingsStore.js';
import { getLocalized } from '../../utils/formatters.js';
import { MarqueeBanner } from '../../components/storefront/MarqueeBanner.js';
import { ProductCard } from '../../components/storefront/ProductCard.js';
import { LoadingState } from '../../components/common/LoadingState.js';

const HOME_CACHE_KEY = 'craft_home_data_cache_v5';

function getCachedHomeData(): {
  products: Product[];
  categories: Category[];
  cmsSections: CMSSection[];
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(HOME_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

export const HomePage: React.FC = () => {
  const { isArabic } = useTheme();
  const { settings } = useStoreSettings();

  const cachedData = getCachedHomeData();
  const [categories, setCategories] = useState<Category[]>(cachedData?.categories || []);
  const [cmsSections, setCmsSections] = useState<CMSSection[]>(cachedData?.cmsSections || []);
  const [products, setProducts] = useState<Product[]>(cachedData?.products || []);
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [activeProductTab, setActiveProductTab] = useState<'bestseller' | 'latest' | 'sale'>('bestseller');

  const loadData = () => {
    Promise.all([
      categoriesApi.getAll().catch(() => []),
      cmsApi.getActiveSections().catch(() => []),
      productsApi
        .getAll({ limit: 16, sortBy: 'popular' })
        .then((res) => res.items || [])
        .catch(() => []),
    ])
      .then(([catRes, cmsRes, prodRes]) => {
        const sortedCats = [...(catRes || [])].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
        );
        const fetchedCms = Array.isArray(cmsRes) ? cmsRes : [];
        const fetchedProds = Array.isArray(prodRes) ? prodRes : [];

        setCategories(sortedCats);
        setCmsSections(fetchedCms);
        setProducts(fetchedProds);
        setIsLoading(false);

        // Cache for instant loads
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              HOME_CACHE_KEY,
              JSON.stringify({
                categories: sortedCats,
                cmsSections: fetchedCms,
                products: fetchedProds,
              }),
            );
          } catch {}
        }
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();

    if (typeof window !== 'undefined') {
      const handleSync = () => {
        try {
          localStorage.removeItem(HOME_CACHE_KEY);
        } catch {}
        loadData();
      };
      window.addEventListener('craft_store_sync', handleSync);
      return () => window.removeEventListener('craft_store_sync', handleSync);
    }
  }, []);

  if (isLoading) {
    return <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading...'} />;
  }

  const storeName = isArabic ? settings.store_name_ar || 'متجرنا' : settings.store_name_en || 'Our Store';

  // Helper matchers
  const isHeroSection = (s: CMSSection) =>
    s.key === 'hero_banner' || s.key === 'home_hero_slider' || s.key === 'hero_section' || s.type === 'HERO' || s.type === 'HERO_SLIDER';
  const isMarqueeSection = (s: CMSSection) => s.key === 'marquee_ticker' || s.type === 'MARQUEE';
  const isProductSection = (s: CMSSection) =>
    s.key === 'new_arrivals' || s.key === 'featured_products' || s.key === 'best_sellers' || s.type === 'NEW_ARRIVALS' || s.type === 'FEATURED_GRID';
  const isCategoriesSection = (s: CMSSection) => s.key === 'categories_section' || s.type === 'CATEGORIES' || s.type === 'CATEGORY_CAROUSEL';
  const isTrustSection = (s: CMSSection) => s.key === 'trust_bar' || s.type === 'TRUST_BAR';
  const isPromoSection = (s: CMSSection) =>
    s.key === 'promo_banner' || s.key === 'promo_summer' || s.key === 'home_promo_summer' || s.type === 'PROMO_BANNER';
  const isAboutSection = (s: CMSSection) => s.key === 'about_section' || s.key === 'about_craft' || s.type === 'ABOUT';

  // Default fallback sections ONLY when cmsSections has no data from DB at all
  const defaultSections: CMSSection[] = [
    { id: 'hero_banner', key: 'hero_banner', displayOrder: 0, type: 'HERO_SLIDER' as any, titleAr: 'البانر الرئيسي', titleEn: 'Main Hero', isActive: true, payload: {} },
    { id: 'marquee_ticker', key: 'marquee_ticker', displayOrder: 1, type: 'CUSTOM_HTML' as any, titleAr: 'الشريط المتحرك', titleEn: 'Marquee Ticker', isActive: true, payload: {} },
    { id: 'new_arrivals', key: 'new_arrivals', displayOrder: 2, type: 'FEATURED_GRID' as any, titleAr: 'الأكثر مبيعاً ومختارات الموسم', titleEn: 'Best Sellers & Curated Drops', isActive: true, payload: {} },
    { id: 'categories_section', key: 'categories_section', displayOrder: 3, type: 'CATEGORY_CAROUSEL' as any, titleAr: 'تصفح الأقسام', titleEn: 'Browse Categories', isActive: true, payload: {} },
    { id: 'trust_bar', key: 'trust_bar', displayOrder: 4, type: 'CUSTOM_HTML' as any, titleAr: 'مميزات المتجر والضمانات', titleEn: 'Guarantees', isActive: true, payload: {} },
    { id: 'promo_banner', key: 'promo_banner', displayOrder: 5, type: 'PROMO_BANNER' as any, titleAr: 'العرض الترويجي', titleEn: 'Promo Banner', isActive: true, payload: {} },
    { id: 'about_section', key: 'about_section', displayOrder: 6, type: 'CUSTOM_HTML' as any, titleAr: 'عن المتجر', titleEn: 'About Brand', isActive: true, payload: {} },
  ];

  // If CMS sections were returned from server, respect EXACTLY what's active in CMS!
  const sectionsSource = cmsSections.length > 0 ? cmsSections : defaultSections;
  const sortedSections = [...sectionsSource].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  // Deduplicate sections
  let heroRendered = false;
  let marqueeRendered = false;
  let productSectionRendered = false;
  let trustRendered = false;
  let promoRendered = false;
  let aboutRendered = false;

  const sectionsToRender: CMSSection[] = [];

  for (const s of sortedSections) {
    if (s.isActive === false) continue;

    if (isHeroSection(s)) {
      if (!heroRendered) {
        sectionsToRender.push(s);
        heroRendered = true;
      }
    } else if (isMarqueeSection(s)) {
      if (!marqueeRendered) {
        sectionsToRender.push(s);
        marqueeRendered = true;
      }
    } else if (isProductSection(s)) {
      if (!productSectionRendered) {
        sectionsToRender.push(s);
        productSectionRendered = true;
      }
    } else if (isTrustSection(s)) {
      if (!trustRendered) {
        sectionsToRender.push(s);
        trustRendered = true;
      }
    } else if (isPromoSection(s)) {
      if (!promoRendered) {
        sectionsToRender.push(s);
        promoRendered = true;
      }
    } else if (isAboutSection(s)) {
      if (!aboutRendered) {
        sectionsToRender.push(s);
        aboutRendered = true;
      }
    } else if (isCategoriesSection(s)) {
      sectionsToRender.push(s);
    }
  }

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

    const overlayClass =
      overlayDarkness === 'light'
        ? 'bg-black/25 dark:bg-black/40'
        : overlayDarkness === 'dark'
          ? 'bg-black/65 dark:bg-black/75'
          : 'bg-black/45 dark:bg-black/60';

    // Exact height classes for each layout style
    let coverHeightClass = 'min-h-[400px] sm:min-h-[480px] lg:min-h-[540px]';
    let cardImageHeightClass = 'h-64 sm:h-80 lg:h-96';
    let splitImageHeightClass = 'h-64 sm:h-80 md:h-[420px] lg:h-[480px] max-h-[500px]';

    if (heightSize === 'compact') {
      coverHeightClass = 'min-h-[300px] sm:min-h-[360px] lg:min-h-[400px]';
      cardImageHeightClass = 'h-48 sm:h-60 lg:h-72';
      splitImageHeightClass = 'h-56 sm:h-64 md:h-[320px] lg:h-[360px] max-h-[380px]';
    } else if (heightSize === 'tall') {
      coverHeightClass = 'min-h-[520px] sm:min-h-[620px] lg:min-h-[700px]';
      cardImageHeightClass = 'h-80 sm:h-96 lg:h-[480px]';
      splitImageHeightClass = 'h-80 sm:h-96 md:h-[540px] lg:h-[620px] max-h-[660px]';
    }

    // Style 1: Full Background Cover Hero
    if (heroImage && heroLayout === 'cover') {
      return (
        <section
          key={section.key}
          className={`relative overflow-hidden rounded-3xl ${coverHeightClass} flex items-center justify-center p-6 sm:p-12 text-center text-white shadow-2xl`}
        >
          <img
            src={heroImage}
            alt={heroTitle}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${positionClass}`}
          />
          <div className={`absolute inset-0 ${overlayClass} backdrop-blur-[1px]`} />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-sm">
              <span>{heroBadge}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight drop-shadow-md">
              {heroTitle}
            </h1>
            <p className="text-xs sm:text-base text-zinc-100 max-w-lg mx-auto leading-relaxed drop-shadow">
              {heroSubtitle}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link to={heroCtaLink}>
                <button className="px-7 py-3 bg-white text-black hover:bg-amber-400 hover:text-black font-bold text-xs rounded-xl shadow-xl transition-all flex items-center gap-2">
                  <span>{heroCtaText}</span>
                  {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </Link>
              <Link to="/new-arrivals">
                <button className="px-6 py-3 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/30 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5">
                  <span>{isArabic ? 'تصفح جديدنا' : 'Explore New In'}</span>
                </button>
              </Link>
            </div>
          </div>
        </section>
      );
    }

    // Style 2: Floating Card Hero
    if (heroImage && heroLayout === 'card') {
      return (
        <section
          key={section.key}
          className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white shadow-2xl p-6 sm:p-10 lg:p-14"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-start">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                <span>{heroBadge}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                {heroTitle}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-lg leading-relaxed">
                {heroSubtitle}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link to={heroCtaLink}>
                  <button className="px-7 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2">
                    <span>{heroCtaText}</span>
                    {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </Link>
                <Link to="/new-arrivals">
                  <button className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5">
                    <span>{isArabic ? 'جديدنا' : 'New In'}</span>
                  </button>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 group">
                <img
                  src={heroImage}
                  alt={heroTitle}
                  className={`w-full ${cardImageHeightClass} object-cover group-hover:scale-105 transition-transform duration-700 ${positionClass}`}
                />
              </div>
            </div>
          </div>
        </section>
      );
    }

    // Default Style: Split Hero (Light / Dark Background with Photo)
    return (
      <section
        key={section.key}
        className="relative overflow-hidden rounded-3xl bg-[#f6f5f1] dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm"
      >
        <div className={`grid items-center w-full h-full ${heroImage ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          <div className="p-6 sm:p-10 lg:p-14 space-y-4 sm:space-y-6 text-start">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <span>{heroBadge}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 leading-tight tracking-tight">
              {heroTitle}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
              {heroSubtitle}
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link to={heroCtaLink}>
                <button className="px-7 py-3 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-xl shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2">
                  <span>{heroCtaText}</span>
                  {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </Link>
              <Link to="/new-arrivals">
                <button className="px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm">
                  <span>{isArabic ? 'جديدنا' : 'New In'}</span>
                </button>
              </Link>
            </div>
          </div>

          {heroImage && (
            <div className={`relative w-full ${splitImageHeightClass} overflow-hidden`}>
              <img
                src={heroImage}
                alt={heroTitle}
                className={`w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${positionClass}`}
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
  const renderMarquee = (section: CMSSection) => {
    const payload = (section.payload || {}) as Record<string, any>;
    const defaultText = isArabic
      ? 'خامات قطنية 100% • شحن سريع لجميع المحافظات • دفع عند الاستلام • إرجاع واستبدال خلال 14 يوم • خياطة متقونة وتصاميم عصرية حصرية'
      : '100% Premium Cotton • Fast Shipping Across Egypt • Cash on Delivery • 14-Day Free Exchange • Modern Silhouettes';

    const text = isArabic
      ? payload.textAr || section.titleAr || defaultText
      : payload.textEn || section.titleEn || defaultText;

    const speed = (payload.speed as 'slow' | 'normal' | 'fast') || 'normal';

    return <MarqueeBanner key={section.key} text={text} speed={speed} />;
  };

  // ========================================================
  // 3. RENDER BEST SELLERS & PRODUCT SHOWCASE
  // ========================================================
  const renderProductShowcase = (section: CMSSection) => {
    const payload = (section.payload || {}) as Record<string, any>;
    const title = getLocalized(section.titleAr, section.titleEn, isArabic) ||
      (isArabic ? 'الأكثر مبيعاً ومختارات الموسم' : 'Best Sellers & Curated Drops');
    const subtitle = getLocalized(section.subtitleAr, section.subtitleEn, isArabic) ||
      (isArabic
        ? 'تشكيلة مختارة بعناية من أفضل الموديلات والأكثر طلباً لتتألق بإطلالة استثنائية.'
        : 'Curated premium fashion pieces loved by our community.');

    const limit = Number(payload.limit) || 12;

    // Filter displayed products by active tab
    let filtered = [...products];
    if (activeProductTab === 'bestseller') {
      const featured = products.filter((p) => p.isFeatured);
      filtered = featured.length > 0 ? featured : products;
    } else if (activeProductTab === 'latest') {
      filtered = [...products].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (activeProductTab === 'sale') {
      const saleItems = products.filter((p) => {
        const firstVar = p.variants?.[0];
        return firstVar?.compareAtPrice && Number(firstVar.compareAtPrice) > Number(p.basePrice);
      });
      filtered = saleItems.length > 0 ? saleItems : products;
    }

    const displayItems = filtered.slice(0, limit);

    return (
      <section key={section.key} className="space-y-6 text-start">
        {/* Header with Title & Quick Tabs & View All */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{isArabic ? 'اختيارات الموسم • الأكثر طلباً' : 'HOT PICKS • BEST SELLERS'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
              {subtitle}
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-400 group transition shrink-0"
          >
            <span>{isArabic ? 'عرض كل التشكيلة' : 'View All Products'}</span>
            {isArabic ? (
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </Link>
        </div>

        {/* Tab Filter Switchers */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'bestseller', labelAr: 'الأكثر طلباً', labelEn: 'Best Sellers' },
            { id: 'latest', labelAr: 'أحدث الإطلاقات', labelEn: 'New Arrivals' },
            { id: 'sale', labelAr: 'عروض وتخفيضات', labelEn: 'Special Offers' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveProductTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                activeProductTab === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm'
                  : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
              }`}
            >
              {isArabic ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {displayItems.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
            <ShoppingBag className="w-10 h-10 mx-auto text-zinc-400 stroke-[1.5]" />
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
              {isArabic ? 'جاري تجهيز تشكيلة جديدة قريباً' : 'New collection dropping soon'}
            </p>
            <Link to="/shop">
              <button className="px-5 py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-xl transition">
                {isArabic ? 'تصفح المتجر' : 'Browse Store'}
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {displayItems.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                badgeType={activeProductTab === 'bestseller' ? 'bestseller' : activeProductTab === 'latest' ? 'new' : undefined}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA to explore more */}
        <div className="pt-2 text-center">
          <Link to="/shop">
            <button className="px-8 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-xs rounded-2xl border border-zinc-200 dark:border-zinc-700 transition inline-flex items-center gap-2 shadow-xs">
              <span>{isArabic ? 'استكشف المزيد من الموديلات والألوان' : 'Explore More Styles & Colors'}</span>
              {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </Link>
        </div>
      </section>
    );
  };

  // ========================================================
  // 4. RENDER CATEGORIES SHOWCASE
  // ========================================================
  const renderCategories = (section: CMSSection) => {
    if (categories.length === 0) return null;

    const title = getLocalized(section.titleAr, section.titleEn, isArabic) || (isArabic ? 'تصفح الأقسام' : 'Browse Categories');

    return (
      <section key={section.key} className="space-y-4 text-start">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          <Link
            to="/shop"
            className="text-xs font-bold text-zinc-500 hover:text-black dark:hover:text-white transition"
          >
            {isArabic ? 'جميع الأقسام ↗' : 'All Categories ↗'}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all text-center space-y-2 hover:shadow-md"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-110 transition-transform">
                {cat.nameAr?.charAt(0) || cat.nameEn?.charAt(0) || '•'}
              </div>
              <div>
                <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:underline">
                  {getLocalized(cat.nameAr, cat.nameEn, isArabic)}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{cat.slug}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  // ========================================================
  // 5. RENDER TRUST / GUARANTEES BAR
  // ========================================================
  const renderTrust = (section: CMSSection) => (
    <section key={section.key} className="p-5 sm:p-7 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-start">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'شحن سريع' : 'Fast Shipping'}
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-500">
              {isArabic ? 'توصيل لجميع المحافظات' : 'All Egypt Governorates'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'إرجاع واستبدال' : 'Easy Exchange'}
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-500">
              {isArabic ? 'خلال 14 يوم بسهولة' : 'Within 14 Days'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'جودة مضمونة' : 'Top Quality'}
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-500">
              {isArabic ? 'أقمشة وخامات ممتازة' : 'Premium Materials'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
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
            <img src={String(promoPayload.imageUrl)} alt="" loading="lazy" width={448} height={192} className="w-full h-48 object-cover" />
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

  return (
    <div className="space-y-10 sm:space-y-16 lg:space-y-20 pb-16">
      {sectionsToRender.map((section) => {
        if (isHeroSection(section)) return renderHero(section);
        if (isMarqueeSection(section)) return renderMarquee(section);
        if (isProductSection(section)) return renderProductShowcase(section);
        if (isCategoriesSection(section)) return renderCategories(section);
        if (isTrustSection(section)) return renderTrust(section);
        if (isPromoSection(section)) return renderPromo(section);
        if (isAboutSection(section)) return renderAbout(section);
        return null;
      })}

      {/* SHEIN Concierge Feature Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-900 dark:bg-zinc-900/90 border border-zinc-800 p-6 sm:p-10 shadow-xl text-white">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-right rtl:md:text-right ltr:md:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold">
              <span>{isArabic ? 'خدمة وسيط شي إن' : 'SHEIN Concierge Service'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isArabic ? (
                <>
                  عجبك أي طقم على <span className="underline decoration-zinc-500 underline-offset-8">SHEIN</span>؟
                </>
              ) : (
                <>
                  Liked an Outfit on <span className="underline decoration-zinc-500 underline-offset-8">SHEIN</span>?
                </>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {isArabic
                ? 'انسخ الرابط وسنقوم بشرائه وشحنه وتوصيله لباب بيتك بالجنيه المصري وبأفضل سعر خدمة!'
                : 'Just copy the link and we will purchase, import, and deliver it directly to your doorstep in EGP!'}
            </p>
          </div>

          <Link
            to="/shein-order"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-black text-sm text-zinc-900 bg-white hover:bg-zinc-200 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all shadow-md active:scale-95 shrink-0 group"
          >
            <span>{isArabic ? 'اطلب منتجك الآن' : 'Order Your Piece Now'}</span>
            {isArabic ? (
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </Link>
        </div>
      </section>
    </div>
  );
};
