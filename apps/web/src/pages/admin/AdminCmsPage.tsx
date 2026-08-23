import React, { useEffect, useState } from 'react';
import { CMSSection } from '../../types/index.js';
import { cmsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { triggerStoreSync } from '../../store/settingsStore.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import {
  Save,
  CheckCircle2,
  Sparkles,
  LayoutTemplate,
  Sliders,
  Image as ImageIcon,
  Flame,
  Grid,
  ShieldCheck,
  Tag,
  BookOpen,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AdminCmsPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [sections, setSections] = useState<CMSSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const loadSections = () => {
    setIsLoading(true);
    cmsApi.getAllSections().then((data) => {
      setSections(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadSections();
  }, []);

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
        sections.map((section) =>
          cmsApi.updateSection(section.key, {
            titleAr: section.titleAr,
            titleEn: section.titleEn,
            subtitleAr: section.subtitleAr,
            subtitleEn: section.subtitleEn,
            isActive: section.isActive,
            payload: section.payload,
            displayOrder: section.displayOrder,
          }),
        ),
      );
      triggerStoreSync();
      setSaveSuccessMsg(
        isArabic
          ? 'تم حفظ وتطبيق كافة تعديلات الصفحة الرئيسية بنجاح!'
          : 'All homepage sections updated and published successfully!',
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
    field: 'titleAr' | 'titleEn' | 'subtitleAr' | 'subtitleEn' | 'isActive',
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


  const getSectionLabel = (key: string) => {
    switch (key) {
      case 'hero_banner':
        return {
          titleAr: 'سكشن الهيرو الرئيسي (Hero Banner & Photo)',
          titleEn: 'Main Hero Banner & Image',
          icon: <LayoutTemplate className="w-5 h-5 text-amber-500" />,
          descAr: 'التحكم في الصورة، العنوان، النص التعريفي، والأزرار بالبانر الرئيسي أعلى الموقع',
          descEn: 'Customize hero photo, main headline, description, badge, and CTA buttons',
        };
      case 'new_arrivals':
        return {
          titleAr: 'سكشن "جديدنا" / أحدث المنتجات (New Arrivals)',
          titleEn: 'New Arrivals / "جديدنا" Section',
          icon: <Flame className="w-5 h-5 text-red-500" />,
          descAr: 'إظهار أو إخفاء سكشن جديدنا بالصفحة الرئيسية وتعديل عناوينه وعدد المنتجات المعروضة',
          descEn: 'Toggle on/off New Arrivals section on the homepage and configure its titles & product count',
        };
      case 'categories_section':
        return {
          titleAr: 'سكشن تصفح الأقسام (Categories Showcase)',
          titleEn: 'Categories Showcase Section',
          icon: <Grid className="w-5 h-5 text-blue-500" />,
          descAr: 'إظهار أو إخفاء سكشن التصنيفات الدائرية وتعديل العنوان',
          descEn: 'Toggle categories showcase and configure titles',
        };
      case 'marquee_ticker':
        return {
          titleAr: 'شريط الكلمات والشعارات المتحرك (Marquee Ticker)',
          titleEn: 'Animated Marquee Ticker',
          icon: <Sliders className="w-5 h-5 text-purple-500" />,
          descAr: 'تفعيل أو إخفاء الشريط النصي المتحرك السريع',
          descEn: 'Toggle animated continuous marquee banner',
        };
      case 'trust_bar':
        return {
          titleAr: 'شريط مميزات المتجر والضمانات (Trust / Guarantees)',
          titleEn: 'Store Guarantees & Trust Bar',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
          descAr: 'تفعيل أو إخفاء شريط الضمانات (شحن سريع، إرجاع 14 يوم، جودة، دفع عند الاستلام)',
          descEn: 'Toggle trust bar displaying fast shipping, 14-day exchange, and cash on delivery',
        };
      case 'promo_banner':
        return {
          titleAr: 'البانر الترويجي والعروض الخاصة (Special Promo Banner)',
          titleEn: 'Promotional Offer Banner',
          icon: <Tag className="w-5 h-5 text-amber-500" />,
          descAr: 'تفعيل أو إخفاء البانر الإعلاني للعروض والتخفيضات وتحديد الرابط وزر الشراء',
          descEn: 'Toggle special promotional banner with discount link and CTA',
        };
      case 'about_section':
        return {
          titleAr: 'سكشن قصة المتجر ونبذة عنا (About Brand Story)',
          titleEn: 'About Brand Story Section',
          icon: <BookOpen className="w-5 h-5 text-sky-500" />,
          descAr: 'تفعيل أو إخفاء نبذة عن المتجر وأهدافه بالصفحة الرئيسية',
          descEn: 'Toggle about the brand story card on homepage',
        };
      default:
        return {
          titleAr: `سكشن (${key})`,
          titleEn: `Section (${key})`,
          icon: <Sparkles className="w-5 h-5 text-zinc-500" />,
          descAr: 'تخصيص محتوى هذا القسم',
          descEn: 'Customize this homepage section',
        };
    }
  };

  if (isLoading) {
    return <LoadingState message={isArabic ? 'جاري تحميل أقسام الواجهة...' : 'Loading CMS sections...'} />;
  }

  return (
    <div className="space-y-6 text-start max-w-4xl mx-auto pb-24">
      <AdminPageHeader
        title={isArabic ? 'التحكم في أقسام ومحتوى الصفحة الرئيسية (CMS)' : 'Homepage Sections & CMS Control'}
        description={
          isArabic
            ? 'التحكم الكامل في إظهار وإخفاء كل سيكشن (الهيرو، جديدنا، الأقسام، العروض) وتعديل الصور والنصوص'
            : 'Toggle on/off and fully configure every homepage section (Hero, New Arrivals, Categories, Promos)'
        }
        action={
          <Button variant="gold" size="sm" isLoading={isSaving} onClick={handleSaveAll}>
            <Save className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            <span>{isArabic ? 'حفظ كافة الأقسام' : 'Save & Publish All'}</span>
          </Button>
        }
      />

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {sections.map((section) => {
          const meta = getSectionLabel(section.key);
          const payload = (section.payload || {}) as Record<string, any>;
          const isHero = section.key === 'hero_banner' || section.type === 'HERO';
          const isNewArrivals = section.key === 'new_arrivals' || section.type === 'NEW_ARRIVALS';
          const isPromo = section.key === 'promo_banner' || section.type === 'PROMO_BANNER';

          return (
            <Card
              key={section.id || section.key}
              className={`p-6 space-y-5 transition-all ${section.isActive
                ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm'
                : 'border-dashed border-zinc-300 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 opacity-85'
                }`}
            >
              {/* Section Header with Active Switch */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0">
                    {meta.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
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

                {/* Big Toggle Switch */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition">
                    <input
                      type="checkbox"
                      checked={section.isActive}
                      onChange={(e) => updateSectionField(section.key, 'isActive', e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-xs font-bold flex items-center gap-1">
                      {section.isActive ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {isArabic ? 'ظاهر ومفعل' : 'Active (Visible)'}
                          </span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-zinc-500">
                            {isArabic ? 'مخفي / معطل' : 'Hidden'}
                          </span>
                        </>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* HERO BANNER SPECIAL FIELDS */}
              {isHero && (
                <div className="space-y-4 pt-1">
                  {/* Hero Photo / Image Control */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-500" />
                      <span>{isArabic ? 'صورة الهيرو (Hero Banner Image URL)' : 'Hero Banner Image URL'}</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        placeholder="https://images.unsplash.com/... or /images/hero.jpg"
                        value={String(payload.imageUrl || '')}
                        onChange={(e) => updatePayloadField(section.key, 'imageUrl', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    {payload.imageUrl ? (
                      <div className="flex items-center gap-3 pt-1">
                        <img
                          src={String(payload.imageUrl)}
                          alt="Hero preview"
                          className="w-20 h-14 object-cover rounded-lg border border-zinc-300 dark:border-zinc-700 shadow-sm"
                        />
                        <div className="text-[11px] text-zinc-500">
                          <span className="text-emerald-600 font-bold">✓ {isArabic ? 'تم تعيين الصورة وتظهر بالهيرو' : 'Image configured'}</span>
                          <p>{isArabic ? 'ستظهر هذه الصورة في الجانب الآخر من الهيرو تلقائياً.' : 'Will display beside the hero text.'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400">
                        {isArabic
                          ? '💡 نصيحة: إذا تركت حقل الصورة فارغاً، سيتمدد النص ليملأ الهيرو بتصميم بطاقة عريض وأنيق.'
                          : '💡 Tip: If left empty, hero text will expand in a clean, full-width layout.'}
                      </p>
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
                      value={String(payload.ctaTextAr || '')}
                      onChange={(e) => updatePayloadField(section.key, 'ctaTextAr', e.target.value)}
                    />


                    <Input
                      label={isArabic ? 'نص زر الطلب بالإنجليزية' : 'CTA Button Text (English)'}
                      placeholder="Shop Now"
                      value={String(payload.ctaTextEn || '')}
                      onChange={(e) => updatePayloadField(section.key, 'ctaTextEn', e.target.value)}
                    />
                    <Input
                      label={isArabic ? 'رابط التوجيه لزر الطلب' : 'CTA Link URL'}
                      placeholder="/shop"
                      value={String(payload.ctaLink || '')}
                      onChange={(e) => updatePayloadField(section.key, 'ctaLink', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* NEW ARRIVALS ("جديدنا") SPECIAL FIELDS */}
              {isNewArrivals && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4" />
                      <span>{isArabic ? 'خيارات عرض منتجات جديدنا' : 'New Arrivals Configuration'}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={isArabic ? 'عنوان السكشن الصغير (Badge)' : 'Section Subtitle / Badge'}
                      placeholder="المعروضات / EXPLORE"
                      value={section.subtitleAr || ''}
                      onChange={(e) => updateSectionField(section.key, 'subtitleAr', e.target.value)}
                    />
                    <div>
                      <label className="block text-xs font-semibold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5">
                        {isArabic ? 'أقصى عدد منتجات يظهر بالرئيسية' : 'Max Products on Homepage'}
                      </label>
                      <select
                        value={Number(payload.limit) || 12}
                        onChange={(e) => updatePayloadField(section.key, 'limit', Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none"
                      >
                        <option value={4}>4 {isArabic ? 'منتجات' : 'Products'}</option>
                        <option value={8}>8 {isArabic ? 'منتجات' : 'Products'}</option>
                        <option value={12}>12 {isArabic ? 'منتج (الافتراضي)' : 'Products (Default)'}</option>
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
                    />
                    <Input
                      label={isArabic ? 'صورة العرض (اختياري)' : 'Promo Image URL (Optional)'}
                      value={String(payload.imageUrl || '')}
                      onChange={(e) => updatePayloadField(section.key, 'imageUrl', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={isArabic ? 'نص الزر بالعربية' : 'Button Text (Arabic)'}
                      value={String(payload.ctaTextAr || '')}
                      onChange={(e) => updatePayloadField(section.key, 'ctaTextAr', e.target.value)}
                    />
                    <Input
                      label={isArabic ? 'رابط التوجيه' : 'Target URL'}
                      value={String(payload.ctaLink || '')}
                      onChange={(e) => updatePayloadField(section.key, 'ctaLink', e.target.value)}
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

              {!isNewArrivals && (
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
              )}

              {/* Save Section Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  onClick={() => handleUpdate(section)}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                  <span>{isArabic ? 'حفظ هذا القسم' : 'Save Section'}</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
