import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CMSSection } from '../../types/index.js';
import { cmsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { triggerStoreSync } from '../../store/settingsStore.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { ImageUploader } from '../../components/common/ImageUploader.js';
import { SupabaseConfigModal } from '../../components/admin/SupabaseConfigModal.js';
import {
  Save,
  CheckCircle2,
  LayoutTemplate,
  Flame,
  ShieldCheck,
  Tag,
  BookOpen,
  Eye,
  EyeOff,
  Database,
  Image as ImageIcon,
  Layers,
  Maximize2,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Monitor,
  ShoppingBag,
  Sun,
  Moon,
} from 'lucide-react';

export const AdminCmsPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [sections, setSections] = useState<CMSSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [collapsedKeys, setCollapsedKeys] = useState<Record<string, boolean>>({});

  // Live Preview States
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  const loadSections = () => {
    setIsLoading(true);
    cmsApi
      .getAllSections()
      .then((data) => {
        if (Array.isArray(data)) {
          // Sort by displayOrder
          const sorted = [...data].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          setSections(sorted);
        } else {
          setSections([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load CMS sections:', err);
        setSections([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadSections();
  }, []);

  const toggleCollapse = (key: string) => {
    setCollapsedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const purgeHomeCache = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('craft_home_data_cache_v2');
        localStorage.removeItem('craft_home_data_cache_v3');
        localStorage.removeItem('craft_home_data_cache_v4');
        localStorage.removeItem('craft_home_data_cache_v5');
      } catch { }
    }
  };

  const handleUpdate = async (section: CMSSection) => {
    setIsSaving(true);
    try {
      await cmsApi.updateSection(section.key, {
        titleAr: section.titleAr,
        titleEn: section.titleEn,
        subtitleAr: section.subtitleAr,
        subtitleEn: section.subtitleEn,
        isActive: section.isActive,
        payload: section.payload,
        displayOrder: section.displayOrder,
      });
      purgeHomeCache();
      triggerStoreSync();
      setSaveSuccessMsg(
        isArabic
          ? `تم حفظ وتحديث سكشن "${getSectionLabel(section.key).titleAr}" بنجاح!`
          : `Section "${getSectionLabel(section.key).titleEn}" saved successfully!`,
      );
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch {
      // update error
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        sections.map((section, idx) =>
          cmsApi.updateSection(section.key, {
            titleAr: section.titleAr,
            titleEn: section.titleEn,
            subtitleAr: section.subtitleAr,
            subtitleEn: section.subtitleEn,
            isActive: section.isActive,
            payload: section.payload,
            displayOrder: idx,
          }),
        ),
      );
      purgeHomeCache();
      triggerStoreSync();
      setSaveSuccessMsg(
        isArabic
          ? 'تم حفظ وتطبيق كافة تعديلات وترتيب الصفحة الرئيسية بنجاح!'
          : 'All homepage sections and order updated successfully!',
      );
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    } catch {
      // save all error
    } finally {
      setIsSaving(false);
    }
  };

  const updateSectionField = (
    key: string,
    field: 'titleAr' | 'titleEn' | 'subtitleAr' | 'subtitleEn' | 'isActive' | 'displayOrder',
    val: any,
  ) => {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, [field]: val } : s)),
    );
  };

  const updatePayloadField = (key: string, payloadField: string, val: any) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.key === key) {
          return {
            ...s,
            payload: {
              ...(s.payload || {}),
              [payloadField]: val,
            },
          };
        }
        return s;
      }),
    );
  };

  // Reorder Sections: Move Up
  const moveSectionUp = async (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const current = newSections[index];
    const prev = newSections[index - 1];

    newSections[index] = prev;
    newSections[index - 1] = current;

    // Recalculate displayOrders
    const updated = newSections.map((s, idx) => ({
      ...s,
      displayOrder: idx,
    }));

    setSections(updated);

    // Auto save reordering
    try {
      await Promise.all(
        updated.map((s) =>
          cmsApi.updateSection(s.key, {
            displayOrder: s.displayOrder,
            isActive: s.isActive,
          }),
        ),
      );
      triggerStoreSync();
      setSaveSuccessMsg(isArabic ? 'تم تحديث ترتيب الأقسام فورياً في الصفحة الرئيسية!' : 'Homepage sections reordered!');
      setTimeout(() => setSaveSuccessMsg(''), 2500);
    } catch {
      loadSections();
    }
  };

  // Reorder Sections: Move Down
  const moveSectionDown = async (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    const current = newSections[index];
    const next = newSections[index + 1];

    newSections[index] = next;
    newSections[index + 1] = current;

    // Recalculate displayOrders
    const updated = newSections.map((s, idx) => ({
      ...s,
      displayOrder: idx,
    }));

    setSections(updated);

    // Auto save reordering
    try {
      await Promise.all(
        updated.map((s) =>
          cmsApi.updateSection(s.key, {
            displayOrder: s.displayOrder,
            isActive: s.isActive,
          }),
        ),
      );
      triggerStoreSync();
      setSaveSuccessMsg(isArabic ? 'تم تحديث ترتيب الأقسام فورياً في الصفحة الرئيسية!' : 'Homepage sections reordered!');
      setTimeout(() => setSaveSuccessMsg(''), 2500);
    } catch {
      loadSections();
    }
  };

  const getSectionLabel = (key: string) => {
    switch (key) {
      case 'hero_banner':
      case 'home_hero_slider':
      case 'hero_section':
        return {
          titleAr: 'سكشن الهيرو الرئيسي (Hero Banner & Photo)',
          titleEn: 'Main Hero Banner & Image',
          icon: <LayoutTemplate className="w-5 h-5 text-amber-500" />,
          descAr: 'التحكم في الصورة، الارتفاع، العنوان، النص التعريفي، والأزرار بالبانر الرئيسي أعلى الموقع',
          descEn: 'Customize hero photo, height, headline, description, badge, and CTA buttons',
        };
      case 'new_arrivals':
      case 'featured_products':
      case 'best_sellers':
        return {
          titleAr: 'سكشن الأكثر مبيعاً وعرض المنتجات (Best Sellers & Showcase)',
          titleEn: 'Best Sellers & Products Showcase',
          icon: <Flame className="w-5 h-5 text-amber-500" />,
          descAr: 'التحكم في سكشن المنتجات بالصفحة الرئيسية وتعديل العنوان والوصف وعدد الموديلات المعروضة',
          descEn: 'Toggle Best Sellers / Products showcase on the homepage, edit titles and max count',
        };
      case 'categories_section':
      case 'home_products_grid':
        return {
          titleAr: 'شبكة المنتجات بالرئيسية (Home Products Grid)',
          titleEn: 'Homepage Products Grid',
          icon: <ShoppingBag className="w-5 h-5 text-purple-500" />,
          descAr: 'عرض المنتجات الأكثر طلباً، الأحدث، وعروض التخفيضات',
          descEn: 'Best sellers, new drops, and discount filter switcher',
        };
      case 'trust_badges':
      case 'guarantees_bar':
        return {
          titleAr: 'شريط الضمانات والمزايا (Trust & Guarantees)',
          titleEn: 'Trust Badges & Guarantees',
          icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
          descAr: 'أيقونات الشحن السريع، الاستبدال خلال 14 يوم، وجودة الخامات',
          descEn: 'Fast shipping, 14-day exchange, and quality guarantees',
        };
      case 'promo_banner':
      case 'secondary_banner':
        return {
          titleAr: 'بانر العروض الفرعي (Promo Banner)',
          titleEn: 'Secondary Promo Banner',
          icon: <Tag className="w-5 h-5 text-rose-500" />,
          descAr: 'بانر عريض مخصص لخصم محدد أو حملة إعلانية مؤقتة',
          descEn: 'Special promo banner for seasonal sale campaigns',
        };
      case 'about_story':
        return {
          titleAr: 'قصة البراند ونبذة عنّا (About Brand Story)',
          titleEn: 'Brand Story / About Us',
          icon: <BookOpen className="w-5 h-5 text-sky-500" />,
          descAr: 'تفعيل أو إخفاء نبذة عن المتجر وأهدافه بالصفحة الرئيسية',
          descEn: 'Toggle about the brand story card on homepage',
        };
      default:
        return {
          titleAr: `سكشن (${key})`,
          titleEn: `Section (${key})`,
          icon: <LayoutTemplate className="w-5 h-5 text-zinc-500" />,
          descAr: 'تخصيص محتوى هذا القسم',
          descEn: 'Customize this homepage section',
        };
    }
  };

  // Derive Hero preview data
  const heroSection = sections.find(
    (s) =>
      s.key === 'hero_banner' ||
      s.key === 'home_hero_slider' ||
      s.key === 'hero_section' ||
      s.type === 'HERO' ||
      s.type === 'HERO_SLIDER',
  );
  const heroPayload = (heroSection?.payload || {}) as Record<string, any>;
  const heroImage = heroPayload.imageUrl || heroPayload.image || '';
  const heroLayout = (heroPayload.layoutStyle || 'split') as 'split' | 'cover' | 'card';
  const heroHeight = (heroPayload.heightSize || 'normal') as 'compact' | 'normal' | 'tall';
  const heroBadge =
    (isArabic ? heroPayload.badgeAr : heroPayload.badgeEn) ||
    heroPayload.badgeAr ||
    heroPayload.badgeEn ||
    (isArabic ? 'تشكيلة حصرية' : 'EXCLUSIVE DROP');
  const heroTitle =
    (isArabic ? heroSection?.titleAr : heroSection?.titleEn) ||
    heroSection?.titleAr ||
    heroSection?.titleEn ||
    (isArabic ? 'أناقة لا مثيل لها' : 'Unmatched Style');
  const heroSubtitle =
    (isArabic ? heroSection?.subtitleAr : heroSection?.subtitleEn) ||
    heroSection?.subtitleAr ||
    heroSection?.subtitleEn ||
    (isArabic ? 'اكتشف أحدث التصاميم المصنوعة بأعلى جودة لتناسب ذوقك الرفيع' : 'Discover the latest premium fashion collections curated for you');
  const heroCtaText =
    (isArabic ? (heroPayload.ctaTextAr || heroPayload.buttonTextAr) : (heroPayload.ctaTextEn || heroPayload.buttonTextEn)) ||
    (isArabic ? 'تسوق الآن' : 'Shop Now');

  const positionClass =
    heroPayload.imagePosition === 'top'
      ? 'object-top'
      : heroPayload.imagePosition === 'bottom'
        ? 'object-bottom'
        : 'object-center';

  const overlayClass =
    heroPayload.overlayDarkness === 'dark'
      ? 'bg-black/70'
      : heroPayload.overlayDarkness === 'light'
        ? 'bg-black/25'
        : 'bg-black/50';

  return (
    <div className="space-y-6 text-start max-w-5xl mx-auto pb-28">
      <AdminPageHeader
        title={isArabic ? 'التحكم في أقسام وترتيب الصفحة الرئيسية (CMS)' : 'Homepage Sections & CMS Order'}
        description={
          isArabic
            ? 'التحكم الكامل في ترتيب أقسام الصفحة الرئيسية، إظهارها وإخفائها، وتعديل كافة النصوص والصور مع المعاينة المباشرة'
            : 'Live real-time preview, reorder sections, customize images, heights, and content'
        }
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="gap-1.5 text-xs font-bold"
            >
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>{showLivePreview ? (isArabic ? 'إخفاء المعاينة' : 'Hide Preview') : (isArabic ? 'المعاينة الحية' : 'Live Preview')}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowSupabaseModal(true)}
              className="gap-1.5 text-xs font-bold"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isArabic ? 'إعدادات Supabase' : 'Supabase Storage'}</span>
            </Button>
            <Button variant="gold" size="sm" isLoading={isSaving} onClick={handleSaveAll} className="shadow-md font-bold">
              <Save className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              <span>{isArabic ? 'حفظ ونشر التعديلات' : 'Save & Publish All'}</span>
            </Button>
          </div>
        }
      />

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {isLoading && sections.length === 0 ? (
        <LoadingState message={isArabic ? 'جاري تحميل أقسام الصفحة الرئيسية...' : 'Loading homepage CMS sections...'} />
      ) : (
        <>
          {/* ========================================================
              REAL-TIME LIVE INTERACTIVE PREVIEW ENGINE
          ======================================================== */}
          {showLivePreview && (
            <Card className="p-4 sm:p-6 border-2 border-amber-500/40 bg-zinc-950 text-white space-y-4 shadow-2xl rounded-3xl overflow-hidden animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                  <div>
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>{isArabic ? 'معاينة حية ومباشرة (Real-Time Live Preview)' : 'Real-Time Storefront Live Preview'}</span>
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {isArabic
                        ? 'تعكس التعديلات الحالية فوراً أثناء الكتابة واختيار الارتفاع وتغيير الصور'
                        : 'Reflects changes in real-time as you type, select heights, or pick photos'}
                    </p>
                  </div>
                </div>

                {/* Device & Theme Switchers */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${previewDevice === 'desktop'
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                        }`}
                      title={isArabic ? 'شاشة كمبيوتر' : 'Desktop view'}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'ديسكتوب' : 'Desktop'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${previewDevice === 'mobile'
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                        }`}
                      title={isArabic ? 'شاشة هاتف' : 'Mobile view'}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'موبايل' : 'Mobile'}</span>
                    </button>
                  </div>

                  <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 transition"
                      title={isArabic ? 'تبديل الوضع الليلي / النهاري للمعاينة' : 'Toggle dark/light preview'}
                    >
                      {previewTheme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Render Canvas */}
              <div className="flex justify-center bg-zinc-900/80 p-3 sm:p-5 rounded-2xl border border-zinc-800 overflow-x-auto">
                <div
                  className={`transition-all duration-300 ${previewDevice === 'mobile'
                      ? 'w-[375px] max-w-full rounded-3xl border-4 border-zinc-700 shadow-2xl p-3'
                      : 'w-full rounded-2xl p-4'
                    } ${previewTheme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
                    } space-y-6 text-start`}
                >
                  {/* 1. Hero Preview */}
                  {heroPayload.showImage !== false && heroImage && heroLayout === 'cover' ? (
                    <div
                      className={`relative overflow-hidden rounded-2xl ${heroHeight === 'compact'
                          ? 'min-h-[260px] sm:min-h-[320px]'
                          : heroHeight === 'tall'
                            ? 'min-h-[460px] sm:min-h-[540px]'
                            : 'min-h-[340px] sm:min-h-[420px]'
                        } flex items-center justify-center p-6 text-center text-white shadow-lg`}
                    >
                      <img
                        src={String(heroImage)}
                        alt=""
                        className={`absolute inset-0 w-full h-full object-cover ${positionClass}`}
                      />
                      <div className={`absolute inset-0 ${overlayClass}`} />
                      <div className="relative z-10 space-y-3 max-w-md mx-auto">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase">
                          <span>{heroBadge}</span>
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black">{heroTitle}</h2>
                        <p className="text-[11px] sm:text-xs text-zinc-200">{heroSubtitle}</p>
                        <button className="px-5 py-2 bg-white text-black font-bold text-[11px] rounded-xl shadow">
                          {heroCtaText}
                        </button>
                      </div>
                    </div>
                  ) : heroPayload.showImage !== false && heroImage && heroLayout === 'card' ? (
                    <div className="p-4 sm:p-6 rounded-2xl bg-zinc-900 text-white space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div className="space-y-2.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black">
                            <span>{heroBadge}</span>
                          </span>
                          <h2 className="text-xl font-black">{heroTitle}</h2>
                          <p className="text-[11px] text-zinc-300">{heroSubtitle}</p>
                          <button className="px-5 py-2 bg-amber-500 text-black font-bold text-[11px] rounded-xl shadow">
                            {heroCtaText}
                          </button>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-zinc-800">
                          <img
                            src={String(heroImage)}
                            alt=""
                            className={`w-full ${heroHeight === 'compact'
                                ? 'h-40 sm:h-48'
                                : heroHeight === 'tall'
                                  ? 'h-64 sm:h-80'
                                  : 'h-48 sm:h-60'
                              } object-cover ${positionClass}`}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Default Split Hero Preview */
                    <div
                      className={`grid items-center rounded-2xl border ${previewTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-[#f6f5f1] border-zinc-200'
                        } ${heroImage ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} overflow-hidden shadow-xs`}
                    >
                      <div className="p-4 sm:p-6 space-y-2.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-black uppercase">
                          <span>{heroBadge}</span>
                        </span>
                        <h2 className="text-lg sm:text-xl font-black leading-tight">{heroTitle}</h2>
                        <p className="text-[11px] opacity-75 leading-relaxed">{heroSubtitle}</p>
                        <div className="pt-1 flex gap-2">
                          <button className="px-5 py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-[11px] rounded-xl shadow">
                            {heroCtaText}
                          </button>
                        </div>
                      </div>
                      {heroImage && (
                        <div
                          className={`relative w-full ${heroHeight === 'compact'
                              ? 'h-44 sm:h-52 md:h-60'
                              : heroHeight === 'tall'
                                ? 'h-64 sm:h-80 md:h-96'
                                : 'h-52 sm:h-64 md:h-72'
                            } overflow-hidden`}
                        >
                          <img
                            src={String(heroImage)}
                            alt=""
                            className={`w-full h-full object-cover ${positionClass}`}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Best Sellers & Product Showcase Preview */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400">
                          <Flame className="w-3 h-3" />
                          <span>{isArabic ? 'الأكثر طلباً ومختارات الموسم' : 'BEST SELLERS & DROPS'}</span>
                        </div>
                        <h3 className="text-sm font-black">
                          {isArabic ? 'الأكثر مبيعاً والموديلات الحصرية' : 'Best Sellers Showcase'}
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500">
                        {isArabic ? 'عرض الكل ↗' : 'View All ↗'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { title: 'تيشيرت أوفر سايز بيسك', price: '450 ج.م', old: '600 ج.م' },
                        { title: 'سويت شيرت هودي قطن', price: '750 ج.م', old: '950 ج.م' },
                        { title: 'بنطلون كارجو سليم', price: '620 ج.م' },
                        { title: 'قميص كتان كاجوال', price: '580 ج.م' },
                      ].map((p, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5 text-center"
                        >
                          <div className="aspect-[3/4] rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <ShoppingBag className="w-5 h-5 opacity-40" />
                          </div>
                          <p className="text-[10px] font-bold truncate">{p.title}</p>
                          <p className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                            {p.price}{' '}
                            {p.old && <span className="line-through text-zinc-400 text-[9px]">{p.old}</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ========================================================
          HOMEPAGE FLOW & SEQUENCE OVERVIEW BAR
      ======================================================== */}
          <Card className="p-4 bg-gradient-to-r from-amber-500/10 via-zinc-100 dark:via-zinc-900 to-amber-500/5 border border-amber-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                {isArabic ? 'تسلسل وترتيب ظهور الأقسام في الصفحة الرئيسية حالياً:' : 'Current Homepage Display Sequence:'}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {sections.filter((s) => s.isActive !== false).length} {isArabic ? 'أقسام مفعلة' : 'active sections'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {sections.map((s, idx) => {
                const meta = getSectionLabel(s.key);
                const active = s.isActive !== false;
                return (
                  <div
                    key={s.key}
                    className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 shrink-0 border transition ${active
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-400 border-zinc-200 dark:border-zinc-800 line-through'
                      }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] truncate max-w-[130px]">
                      {isArabic ? meta.titleAr.split('(')[0] : meta.titleEn.split('(')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ========================================================
          CMS SECTIONS LIST
      ======================================================== */}
          <div className="space-y-6">
            {sections.map((section, index) => {
              const meta = getSectionLabel(section.key);
              const payload = (section.payload || {}) as Record<string, any>;
              const isHero =
                section.key === 'hero_banner' ||
                section.key === 'home_hero_slider' ||
                section.key === 'hero_section' ||
                section.type === 'HERO' ||
                section.type === 'HERO_SLIDER';
              const isNewArrivals =
                section.key === 'new_arrivals' ||
                section.key === 'featured_products' ||
                section.key === 'best_sellers' ||
                section.type === 'NEW_ARRIVALS' ||
                section.type === 'FEATURED_GRID';
              const isPromo =
                section.key === 'promo_banner' ||
                section.key === 'home_promo_summer' ||
                section.key === 'promo_summer' ||
                section.type === 'PROMO_BANNER';
              const isCollapsed = Boolean(collapsedKeys[section.key]);

              return (
                <Card
                  key={section.id || section.key}
                  className={`p-5 sm:p-6 space-y-5 transition-all border ${section.isActive !== false
                      ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm'
                      : 'border-dashed border-zinc-300 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 opacity-80'
                    }`}
                >
                  {/* Section Header with Reorder Arrows & Active Switch */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {/* Order Index Badge & Reorder Controls */}
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        <span className="w-6 h-6 rounded-lg bg-amber-500 text-black font-mono text-xs font-black flex items-center justify-center shadow-sm">
                          #{index + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveSectionUp(index)}
                            disabled={index === 0}
                            className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 transition ${index === 0 ? 'opacity-20 cursor-not-allowed' : ''
                              }`}
                            title={isArabic ? 'تحريك للأعلى' : 'Move Up'}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSectionDown(index)}
                            disabled={index === sections.length - 1}
                            className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 transition ${index === sections.length - 1 ? 'opacity-20 cursor-not-allowed' : ''
                              }`}
                            title={isArabic ? 'تحريك للأسفل' : 'Move Down'}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0">
                        {meta.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                            {isArabic ? meta.titleAr : meta.titleEn}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            {section.key}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {isArabic ? meta.descAr : meta.descEn}
                        </p>
                      </div>
                    </div>

                    {/* Right controls: Visibility Switch & Collapse */}
                    <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                      <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition">
                        <input
                          type="checkbox"
                          checked={section.isActive !== false}
                          onChange={(e) => updateSectionField(section.key, 'isActive', e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                        />
                        <span className="text-xs font-bold flex items-center gap-1">
                          {section.isActive !== false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {isArabic ? 'مفعل' : 'Active'}
                              </span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                              <span className="text-zinc-500">
                                {isArabic ? 'مخفي' : 'Hidden'}
                              </span>
                            </>
                          )}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => toggleCollapse(section.key)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title={isCollapsed ? (isArabic ? 'توسيع' : 'Expand') : (isArabic ? 'طي' : 'Collapse')}
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Section Body (When not collapsed) */}
                  {!isCollapsed && (
                    <div className="space-y-5">
                      {/* HERO BANNER SPECIAL FIELDS */}
                      {isHero && (
                        <div className="space-y-5 pt-1">
                          {/* Hero Photo / Image Control Box */}
                          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                                  {isArabic ? 'التحكم في صورة وارتفاع الهيرو' : 'Hero Image & Height Controls'}
                                </span>
                              </div>

                              {/* Toggle Show/Hide Image */}
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={payload.showImage !== false}
                                  onChange={(e) => updatePayloadField(section.key, 'showImage', e.target.checked)}
                                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                                />
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                  {isArabic ? 'إظهار صورة الهيرو' : 'Show Hero Image'}
                                </span>
                              </label>
                            </div>

                            {payload.showImage !== false && (
                              <>
                                <ImageUploader
                                  label={isArabic ? 'صورة الهيرو الرئيسية (Hero Banner Image)' : 'Hero Banner Image'}
                                  value={String(payload.imageUrl || payload.image || '')}
                                  onChange={(url) => {
                                    setSections((prev) =>
                                      prev.map((s) => {
                                        if (s.key === section.key) {
                                          return {
                                            ...s,
                                            payload: {
                                              ...(s.payload || {}),
                                              imageUrl: url,
                                              image: url,
                                            },
                                          };
                                        }
                                        return s;
                                      }),
                                    );
                                  }}
                                  folder="banners"
                                  aspectRatio="video"
                                />

                                {/* Layout Style Picker */}
                                <div className="space-y-2 pt-2">
                                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{isArabic ? 'نمط عرض وتخطيط الهيرو (Hero Layout)' : 'Hero Layout Style'}</span>
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {[
                                      {
                                        id: 'split',
                                        labelAr: 'جانبي متوازن (Split)',
                                        labelEn: 'Split Side-by-Side',
                                        descAr: 'نص في جانب والصورة في الجانب الآخر',
                                        descEn: 'Text on one side, image on the other',
                                      },
                                      {
                                        id: 'cover',
                                        labelAr: 'خلفية كاملة (Full Cover)',
                                        labelEn: 'Full Cover Background',
                                        descAr: 'الصورة تملأ كامل البانر مع تظليل داكن فخم',
                                        descEn: 'Image fills entire banner with dark overlay',
                                      },
                                      {
                                        id: 'card',
                                        labelAr: 'بطاقة عائمة (Framed Card)',
                                        labelEn: 'Framed Floating Card',
                                        descAr: 'الصورة داخل إطار بطاقة محدد وأنيق',
                                        descEn: 'Image inside a stylish rounded card frame',
                                      },
                                    ].map((style) => {
                                      const isSelected = (payload.layoutStyle || 'split') === style.id;
                                      return (
                                        <button
                                          key={style.id}
                                          type="button"
                                          onClick={() => updatePayloadField(section.key, 'layoutStyle', style.id)}
                                          className={`p-3 rounded-xl border text-start transition flex flex-col justify-between ${isSelected
                                              ? 'border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500'
                                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                                            }`}
                                        >
                                          <span className="text-xs font-bold">{isArabic ? style.labelAr : style.labelEn}</span>
                                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                                            {isArabic ? style.descAr : style.descEn}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* HEIGHT SELECTOR CARDS (FIXED & EFFECTIVE) */}
                                <div className="space-y-2 pt-2">
                                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{isArabic ? 'ارتفاع الصورة وحجم البانر (فعال على كافة الأنماط)' : 'Banner & Image Height'}</span>
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {[
                                      {
                                        id: 'compact',
                                        labelAr: 'مدمج وناعم (Compact)',
                                        labelEn: 'Compact (320px - 380px)',
                                        descAr: 'ارتفاع خفيف ومناسب لتقليل المساحة وإبراز المنتجات تحته مباشرة',
                                        descEn: 'Saves vertical space and brings products closer',
                                      },
                                      {
                                        id: 'normal',
                                        labelAr: 'متوازن قياسي (Standard)',
                                        labelEn: 'Standard (420px - 480px)',
                                        descAr: 'الارتفاع القياسي المتناسق لمعظم الصور والمتاجر',
                                        descEn: 'Balanced proportions for general fashion banners',
                                      },
                                      {
                                        id: 'tall',
                                        labelAr: 'كبير وفاخر (Tall)',
                                        labelEn: 'Tall (560px - 640px)',
                                        descAr: 'ارتفاع ممتد للصور الطولية الفخمة وجلسات التصوير',
                                        descEn: 'Extended height for high-end editorial model photography',
                                      },
                                    ].map((h) => {
                                      const isSelected = (payload.heightSize || 'normal') === h.id;
                                      return (
                                        <button
                                          key={h.id}
                                          type="button"
                                          onClick={() => updatePayloadField(section.key, 'heightSize', h.id)}
                                          className={`p-3 rounded-xl border text-start transition flex flex-col justify-between ${isSelected
                                              ? 'border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500'
                                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                                            }`}
                                        >
                                          <span className="text-xs font-bold">{isArabic ? h.labelAr : h.labelEn}</span>
                                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                                            {isArabic ? h.descAr : h.descEn}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Additional tuning options (Darkness & Focal Position) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                  {/* Overlay Darkness (Special for cover mode) */}
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                      <SlidersHorizontal className="w-3 h-3 text-amber-500" />
                                      <span>{isArabic ? 'درجة تعتيم الخلفية (لنمط Cover)' : 'Overlay Darkness'}</span>
                                    </label>
                                    <select
                                      value={String(payload.overlayDarkness || 'medium')}
                                      onChange={(e) => updatePayloadField(section.key, 'overlayDarkness', e.target.value)}
                                      className="w-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    >
                                      <option value="light">{isArabic ? 'خفيف (25%)' : 'Light (25%)'}</option>
                                      <option value="medium">{isArabic ? 'متوازن (50%)' : 'Medium (50%)'}</option>
                                      <option value="dark">{isArabic ? 'داكن وواضح (70%)' : 'Dark & High Contrast (70%)'}</option>
                                    </select>
                                  </div>

                                  {/* Image Focal Point */}
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3 text-amber-500" />
                                      <span>{isArabic ? 'موضع تركيز الصورة (Focal Point)' : 'Image Focal Point'}</span>
                                    </label>
                                    <select
                                      value={String(payload.imagePosition || 'center')}
                                      onChange={(e) => updatePayloadField(section.key, 'imagePosition', e.target.value)}
                                      className="w-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    >
                                      <option value="center">{isArabic ? 'منتصف (Center)' : 'Center'}</option>
                                      <option value="top">{isArabic ? 'أعلى (Top - لتركيز الرأس/الموديل)' : 'Top'}</option>
                                      <option value="bottom">{isArabic ? 'أسفل (Bottom)' : 'Bottom'}</option>
                                    </select>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Hero Badge & Buttons */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label={isArabic ? 'نص البادج بالعربية' : 'Badge Text (Arabic)'}
                              placeholder="تشكيلة جديدة"
                              value={String(payload.badgeAr || '')}
                              onChange={(e) => updatePayloadField(section.key, 'badgeAr', e.target.value)}
                            />
                            <Input
                              label={isArabic ? 'نص البادج بالإنجليزية' : 'Badge Text (English)'}
                              placeholder="NEW ARRIVALS"
                              value={String(payload.badgeEn || '')}
                              onChange={(e) => updatePayloadField(section.key, 'badgeEn', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Input
                              label={isArabic ? 'نص زر الطلب بالعربية' : 'CTA Button Text (Arabic)'}
                              placeholder="تسوق الآن"
                              value={String(payload.ctaTextAr || payload.buttonTextAr || '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSections((prev) =>
                                  prev.map((s) => {
                                    if (s.key === section.key) {
                                      return {
                                        ...s,
                                        payload: {
                                          ...(s.payload || {}),
                                          ctaTextAr: val,
                                          buttonTextAr: val,
                                        },
                                      };
                                    }
                                    return s;
                                  }),
                                );
                              }}
                            />

                            <Input
                              label={isArabic ? 'نص زر الطلب بالإنجليزية' : 'CTA Button Text (English)'}
                              placeholder="Shop Now"
                              value={String(payload.ctaTextEn || payload.buttonTextEn || '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSections((prev) =>
                                  prev.map((s) => {
                                    if (s.key === section.key) {
                                      return {
                                        ...s,
                                        payload: {
                                          ...(s.payload || {}),
                                          ctaTextEn: val,
                                          buttonTextEn: val,
                                        },
                                      };
                                    }
                                    return s;
                                  }),
                                );
                              }}
                            />
                            <Input
                              label={isArabic ? 'رابط التوجيه لزر الطلب' : 'CTA Link URL'}
                              placeholder="/shop"
                              value={String(payload.ctaLink || payload.buttonUrl || '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSections((prev) =>
                                  prev.map((s) => {
                                    if (s.key === section.key) {
                                      return {
                                        ...s,
                                        payload: {
                                          ...(s.payload || {}),
                                          ctaLink: val,
                                          buttonUrl: val,
                                        },
                                      };
                                    }
                                    return s;
                                  }),
                                );
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* NEW ARRIVALS / BEST SELLERS SPECIAL FIELDS */}
                      {isNewArrivals && (
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                              <Flame className="w-4 h-4" />
                              <span>{isArabic ? 'إعدادات سكشن الأكثر مبيعاً وعرض المنتجات' : 'Best Sellers & Products Showcase'}</span>
                            </span>
                            <Link
                              to="/darsh50/products"
                              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                            >
                              <span>{isArabic ? 'إدارة المنتجات المميزة ↗' : 'Manage Products ↗'}</span>
                            </Link>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5">
                                {isArabic ? 'مصدر وطريقة فرز المنتجات' : 'Products Source'}
                              </label>
                              <select
                                value={String(payload.sourceMode || 'popular')}
                                onChange={(e) => updatePayloadField(section.key, 'sourceMode', e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none"
                              >
                                <option value="popular">
                                  {isArabic ? 'الأكثر طلباً والمميزة أولاً (Best Sellers)' : 'Popular & Featured First'}
                                </option>
                                <option value="latest">
                                  {isArabic ? 'أحدث الإطلاقات تلقائياً (Latest)' : 'Latest Products'}
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5">
                                {isArabic ? 'أقصى عدد منتجات بالرئيسية' : 'Max Products on Homepage'}
                              </label>
                              <select
                                value={Number(payload.limit) || 12}
                                onChange={(e) => updatePayloadField(section.key, 'limit', Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none"
                              >
                                <option value={4}>4 {isArabic ? 'منتجات' : 'Products'}</option>
                                <option value={8}>8 {isArabic ? 'منتجات' : 'Products'}</option>
                                <option value={12}>12 {isArabic ? 'منتج (الافتراضي)' : 'Products (Default)'}</option>
                                <option value={16}>16 {isArabic ? 'منتج' : 'Products'}</option>
                                <option value={24}>24 {isArabic ? 'منتج' : 'Products'}</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PROMO BANNER SPECIAL FIELDS */}
                      {isPromo && (
                        <div className="space-y-4 pt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label={isArabic ? 'نص البادج بالعربية' : 'Badge Text (Arabic)'}
                              value={String(payload.badgeAr || '')}
                              onChange={(e) => updatePayloadField(section.key, 'badgeAr', e.target.value)}
                              placeholder="عرض خاص"
                            />
                            <ImageUploader
                              label={isArabic ? 'صورة البانر الترويجي (اختياري)' : 'Promo Banner Image (Optional)'}
                              value={String(payload.imageUrl || '')}
                              onChange={(url) => updatePayloadField(section.key, 'imageUrl', url)}
                              folder="banners"
                              compact
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label={isArabic ? 'نص الزر بالعربية' : 'Button Text (Arabic)'}
                              value={String(payload.ctaTextAr || '')}
                              onChange={(e) => updatePayloadField(section.key, 'ctaTextAr', e.target.value)}
                              placeholder="تسوق العرض الآن"
                            />
                            <Input
                              label={isArabic ? 'رابط التوجيه' : 'Target URL'}
                              value={String(payload.ctaLink || '')}
                              onChange={(e) => updatePayloadField(section.key, 'ctaLink', e.target.value)}
                              placeholder="/shop"
                            />
                          </div>
                        </div>
                      )}

                      {/* GENERAL TITLES & SUBTITLES */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label={isArabic ? 'العنوان الرئيسي (بالعربية)' : 'Main Title (Arabic)'}
                          value={section.titleAr || ''}
                          onChange={(e) => updateSectionField(section.key, 'titleAr', e.target.value)}
                        />
                        <Input
                          label={isArabic ? 'العنوان الرئيسي (بالإنجليزية)' : 'Main Title (English)'}
                          value={section.titleEn || ''}
                          onChange={(e) => updateSectionField(section.key, 'titleEn', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label={isArabic ? 'الوصف أو النص الفرعي (بالعربية)' : 'Subtitle / Description (Arabic)'}
                          value={section.subtitleAr || ''}
                          onChange={(e) => updateSectionField(section.key, 'subtitleAr', e.target.value)}
                        />
                        <Input
                          label={isArabic ? 'الوصف أو النص الفرعي (بالإنجليزية)' : 'Subtitle / Description (English)'}
                          value={section.subtitleEn || ''}
                          onChange={(e) => updateSectionField(section.key, 'subtitleEn', e.target.value)}
                        />
                      </div>

                      {/* Save Section Button */}
                      <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <Button
                          type="button"
                          variant="gold"
                          size="sm"
                          isLoading={isSaving}
                          onClick={() => handleUpdate(section)}
                        >
                          <Save className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                          <span>{isArabic ? 'حفظ هذا القسم' : 'Save Section'}</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <SupabaseConfigModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />
    </div>
  );
};
