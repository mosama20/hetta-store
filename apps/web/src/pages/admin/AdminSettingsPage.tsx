import React, { useEffect, useState, useRef } from 'react';
import { settingsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { triggerStoreSync } from '../../store/settingsStore.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { ImageUploader } from '../../components/common/ImageUploader.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import {
  Save,
  Download,
  Upload,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Globe,
  Sparkles,
  Share2,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { isArabic } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Branding & Identity
  const [storeNameAr, setStoreNameAr] = useState('');
  const [storeNameEn, setStoreNameEn] = useState('');
  const [storeTitleAr, setStoreTitleAr] = useState('');
  const [storeTitleEn, setStoreTitleEn] = useState('');
  const [storeLogo, setStoreLogo] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');

  const [currency, setCurrency] = useState('EGP');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappTemplate, setWhatsappTemplate] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

  // Announcement Bar Settings
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [announcementTextAr, setAnnouncementTextAr] = useState('');
  const [announcementTextEn, setAnnouncementTextEn] = useState('');
  const [announcementLink, setAnnouncementLink] = useState('/shop');
  const [announcementCoupon, setAnnouncementCoupon] = useState('');

  // Social Media Links Settings with show/hide control
  const [socialLinks, setSocialLinks] = useState<{
    instagram: { enabled: boolean; url: string };
    tiktok: { enabled: boolean; url: string };
    facebook: { enabled: boolean; url: string };
    whatsapp: { enabled: boolean; url: string };
    twitter: { enabled: boolean; url: string };
    snapchat: { enabled: boolean; url: string };
    youtube: { enabled: boolean; url: string };
    telegram: { enabled: boolean; url: string };
  }>({
    instagram: { enabled: true, url: 'https://instagram.com/craft.wear' },
    tiktok: { enabled: true, url: 'https://tiktok.com/@craftwear' },
    facebook: { enabled: true, url: 'https://facebook.com/craftwear' },
    whatsapp: { enabled: true, url: '+201234567890' },
    twitter: { enabled: false, url: '' },
    snapchat: { enabled: false, url: '' },
    youtube: { enabled: false, url: '' },
    telegram: { enabled: false, url: '' },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Backup & Restore State
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fetchSettings = () => {
    setIsLoading(true);
    settingsApi.getAll().then((data) => {
      data.forEach((s) => {
        if (s.key === 'store_name_ar') setStoreNameAr(s.value);
        if (s.key === 'store_name_en') setStoreNameEn(s.value);
        if (s.key === 'store_title_ar') setStoreTitleAr(s.value);
        if (s.key === 'store_title_en') setStoreTitleEn(s.value);
        if (s.key === 'store_logo') setStoreLogo(s.value);
        if (s.key === 'favicon_url') setFaviconUrl(s.value);
        if (s.key === 'currency') setCurrency(s.value);
        if (s.key === 'whatsapp_number') setWhatsappNumber(s.value);
        if (s.key === 'whatsapp_order_template_ar') setWhatsappTemplate(s.value);
        if (s.key === 'support_email') setSupportEmail(s.value);
        if (s.key === 'announcement_bar_enabled') setAnnouncementEnabled(s.value !== 'false');
        if (s.key === 'announcement_text_ar') setAnnouncementTextAr(s.value);
        if (s.key === 'announcement_text_en') setAnnouncementTextEn(s.value);
        if (s.key === 'announcement_link') setAnnouncementLink(s.value);
        if (s.key === 'announcement_coupon') setAnnouncementCoupon(s.value);
        if (s.key === 'social_links') {
          try {
            const parsed = JSON.parse(s.value);
            if (parsed && typeof parsed === 'object') {
              setSocialLinks((prev) => {
                const next = { ...prev };
                (['instagram', 'tiktok', 'facebook', 'whatsapp', 'twitter', 'snapchat', 'youtube', 'telegram'] as const).forEach((k) => {
                  if (parsed[k] !== undefined) {
                    if (typeof parsed[k] === 'string') {
                      next[k] = { enabled: parsed[k].trim().length > 0, url: parsed[k] };
                    } else if (typeof parsed[k] === 'object' && parsed[k] !== null) {
                      next[k] = {
                        enabled: parsed[k].enabled !== false,
                        url: parsed[k].url || '',
                      };
                    }
                  }
                });
                return next;
              });
            }
          } catch {}
        }
      });
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await Promise.all([
      settingsApi.update('store_name_ar', storeNameAr, 'BRANDING'),
      settingsApi.update('store_name_en', storeNameEn, 'BRANDING'),
      settingsApi.update('store_title_ar', storeTitleAr, 'BRANDING'),
      settingsApi.update('store_title_en', storeTitleEn, 'BRANDING'),
      settingsApi.update('store_logo', storeLogo, 'BRANDING'),
      settingsApi.update('favicon_url', faviconUrl, 'BRANDING'),
      settingsApi.update('currency', currency, 'GENERAL'),
      settingsApi.update('whatsapp_number', whatsappNumber, 'WHATSAPP'),
      settingsApi.update('whatsapp_order_template_ar', whatsappTemplate, 'WHATSAPP'),
      settingsApi.update('support_email', supportEmail, 'GENERAL'),
      settingsApi.update('announcement_bar_enabled', announcementEnabled ? 'true' : 'false', 'GENERAL'),
      settingsApi.update('announcement_text_ar', announcementTextAr, 'GENERAL'),
      settingsApi.update('announcement_text_en', announcementTextEn, 'GENERAL'),
      settingsApi.update('announcement_link', announcementLink, 'GENERAL'),
      settingsApi.update('announcement_coupon', announcementCoupon, 'GENERAL'),
      settingsApi.update('social_links', JSON.stringify(socialLinks), 'SOCIAL'),
    ]);
    triggerStoreSync();
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // 1. Export Backup to JSON file
  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const backupData = await settingsApi.exportBackup();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `craft-store-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setBackupMsg({
        type: 'success',
        text: isArabic
          ? 'تم تصدير وتحميل النسخة الاحتياطية للمتجر بنجاح!'
          : 'Store backup downloaded successfully!',
      });
      setIsExporting(false);
    } catch {
      setBackupMsg({
        type: 'error',
        text: isArabic ? 'فشل تصدير النسخة الاحتياطية' : 'Failed to export backup',
      });
      setIsExporting(false);
    }
  };

  // 2. Import Backup from JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        const confirmMsg = isArabic
          ? '⚠️ هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال كافة بيانات الموقع والمنتجات والأقسام والطلبات الحالية بالبيانات الموجودة في الملف.'
          : 'Are you sure you want to restore this backup? Current products, categories, orders, and settings will be replaced.';

        if (!window.confirm(confirmMsg)) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setIsImporting(true);
        const res = await settingsApi.importBackup(parsed);
        triggerStoreSync();
        fetchSettings();

        setBackupMsg({
          type: 'success',
          text: isArabic
            ? `تمت استعادة النسخة الاحتياطية بنجاح! (${res.stats?.products || 0} منتج، ${res.stats?.categories || 0} قسم، ${res.stats?.orders || 0} طلب)`
            : `Backup restored successfully! (${res.stats?.products || 0} products restored)`,
        });
        setIsImporting(false);
      } catch (err: unknown) {
        setBackupMsg({
          type: 'error',
          text: isArabic
            ? 'ملف النسخة الاحتياطية غير صالح: ' + (err as Error).message
            : 'Invalid backup file structure: ' + (err as Error).message,
        });
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  // 3. Reset to Factory Defaults
  const handleResetDefaults = async () => {
    const confirmMsg = isArabic
      ? '🚨 تحذير: هل أنت متأكد من إعادة ضبط المصنع للمتجر؟ سيتم استرجاع البيانات والمنتجات الافتراضية الأولية.'
      : 'WARNING: Reset database to factory defaults? All current changes will be replaced with initial default seed data.';

    if (!window.confirm(confirmMsg)) return;

    setIsImporting(true);
    await settingsApi.resetBackup();
    triggerStoreSync();
    fetchSettings();
    setBackupMsg({
      type: 'success',
      text: isArabic
        ? 'تمت إعادة ضبط المتجر إلى الإعدادات والبيانات الافتراضية بنجاح!'
        : 'Store reset to default seed data successfully!',
    });
    setIsImporting(false);
  };

  if (isLoading) {
    return <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading settings...'} />;
  }

  return (
    <div className="space-y-8 text-start max-w-4xl mx-auto pb-20">
      <AdminPageHeader
        title={isArabic ? 'إعدادات المتجر والهوية والنسخ الاحتياطي' : 'Store Settings & Backup'}
        description={
          isArabic
            ? 'تخصيص الهوية، شريط الإعلانات، الواتساب، وتصدير واستيراد النسخ الاحتياطية الكاملة للمتجر'
            : 'Configure branding, announcement bar, WhatsApp, and full store backup/restore'
        }
      />

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{isArabic ? 'تم حفظ وتطبيق الإعدادات بنجاح!' : 'Settings saved and applied successfully!'}</span>
        </div>
      )}

      {backupMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
            backupMsg.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
          }`}
        >
          {backupMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{backupMsg.text}</span>
        </div>
      )}

      {/* ========================================================
          1. BACKUP & RESTORE SECTION (النسخ الاحتياطي والاستيراد)
      ======================================================== */}
      <Card className="p-6 space-y-5 border-2 border-amber-500/20 bg-gradient-to-br from-white via-zinc-50/50 to-amber-50/20 dark:from-zinc-950 dark:via-zinc-900 dark:to-amber-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                {isArabic ? 'النسخ الاحتياطي واستعادة بيانات الموقع (Backup & Restore)' : 'Full Site Backup & Data Restore'}
              </h3>
              <p className="text-[11px] text-zinc-500">
                {isArabic
                  ? 'حفظ نسخة من جميع المنتجات، الأقسام، الطلبات، الإعدادات، ومحتوى الـ CMS أو استيرادها'
                  : 'Export or restore all products, categories, orders, settings, and CMS content in JSON format'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Export / Download Button */}
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isExporting}
            className="p-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow flex flex-col items-center justify-center space-y-2 text-center"
          >
            <Download className="w-5 h-5 text-amber-400 dark:text-amber-600" />
            <span>{isArabic ? 'تصدير وتحميل نسخة كاملة (JSON)' : 'Export & Download Backup'}</span>
            <span className="text-[10px] font-normal opacity-75">
              {isArabic ? 'تحميل ملف يحتوي على كامل بيانات المتجر' : 'Download complete database file'}
            </span>
          </button>

          {/* Import / Restore Button */}
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full h-full p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex flex-col items-center justify-center space-y-2 text-center"
            >
              <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{isArabic ? 'استيراد واستعادة نسخة (JSON)' : 'Import & Restore Backup'}</span>
              <span className="text-[10px] font-normal text-zinc-500">
                {isArabic ? 'رفع ملف نسخة احتياطية سابقة' : 'Upload a previously exported backup'}
              </span>
            </button>
          </div>

          {/* Factory Reset Button */}
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isImporting}
            className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/40 transition flex flex-col items-center justify-center space-y-2 text-center"
          >
            <RotateCcw className="w-5 h-5 text-red-500" />
            <span>{isArabic ? 'إعادة ضبط المصنع' : 'Reset to Defaults'}</span>
            <span className="text-[10px] font-normal opacity-75">
              {isArabic ? 'استعادة البيانات الأولية الافتراضية' : 'Restore initial seed data'}
            </span>
          </button>
        </div>
      </Card>

      {/* ========================================================
          2. STORE BRANDING & SETTINGS FORM
      ======================================================== */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================
            BRANDING, LOGO, FAVICON & BROWSER TITLE SECTION
        ======================================================== */}
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  {isArabic ? 'هوية المتجر، اللوجو، وعنوان المتصفح (Branding & Identity)' : 'Store Branding, Logo & Browser Identity'}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {isArabic
                    ? 'تخصيص لوجو البراند، أيقونة المتصفح (Favicon)، وعنوان الموقع المكتوب في التبويب'
                    : 'Customize brand logo, browser favicon, and browser tab title'}
                </p>
              </div>
            </div>

            <Button type="submit" variant="gold" size="sm" isLoading={isSaving} className="shadow-md">
              <Save className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              <span>{isArabic ? 'حفظ الإعدادات' : 'Save Settings'}</span>
            </Button>
          </div>

          {/* Logo & Favicon Uploaders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Brand Logo Uploader */}
            <div className="space-y-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {isArabic ? 'لوجو المتجر (Brand Logo)' : 'Brand Logo'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400">
                  {isArabic ? 'يظهر في الهيدر والفوتر' : 'Header & Footer'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                {isArabic
                  ? 'يُفضل صورة بخلفية شفافة PNG أو WebP أو SVG (أبعاد مقترحة 400x120)'
                  : 'Recommended transparent PNG/WebP/SVG (around 400x120px)'}
              </p>
              <ImageUploader
                value={storeLogo}
                onChange={(url) => setStoreLogo(url)}
                folder="branding"
                aspectRatio="banner"
                compact
              />
            </div>

            {/* 2. Favicon Uploader */}
            <div className="space-y-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {isArabic ? 'أيقونة التبويب (Favicon)' : 'Browser Favicon'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400">
                  {isArabic ? 'أيقونة المتصفح بجانب التايتل' : 'Browser tab icon'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                {isArabic
                  ? 'الأيقونة الصغيرة التي تظهر في شريط المتصفح والمفضلة (مربعة 32x32 أو 64x64 أو SVG)'
                  : 'Small icon shown in browser tab and bookmarks (square PNG/ICO/SVG)'}
              </p>
              <ImageUploader
                value={faviconUrl}
                onChange={(url) => setFaviconUrl(url)}
                folder="branding"
                aspectRatio="square"
                compact
              />
            </div>
          </div>

          {/* Titles & Names Inputs */}
          <div className="space-y-4 pt-2">
            {/* Store Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isArabic ? 'اسم المتجر (بالعربية)' : 'Store Name (Arabic)'}
                value={storeNameAr}
                onChange={(e) => setStoreNameAr(e.target.value)}
                placeholder="كرافت"
                required
              />
              <Input
                label={isArabic ? 'اسم المتجر (بالإنجليزية)' : 'Store Name (English)'}
                value={storeNameEn}
                onChange={(e) => setStoreNameEn(e.target.value)}
                placeholder="CRAFT"
                required
              />
            </div>

            {/* Browser Tab Titles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isArabic ? 'عنوان المتجر في تبويب المتصفح (بالعربية - Browser Title)' : 'Browser Tab Title (Arabic)'}
                value={storeTitleAr}
                onChange={(e) => setStoreTitleAr(e.target.value)}
                placeholder="كرافت | براند الأزياء والملابس العصرية"
              />
              <Input
                label={isArabic ? 'عنوان المتجر في تبويب المتصفح (بالإنجليزية - Browser Title)' : 'Browser Tab Title (English)'}
                value={storeTitleEn}
                onChange={(e) => setStoreTitleEn(e.target.value)}
                placeholder="CRAFT | Premium Streetwear & Modern Apparel"
              />
            </div>
          </div>

          {/* ========================================================
              LIVE REAL-TIME PREVIEW (محاكاة شكل التبويب والهيدر)
          ======================================================== */}
          <div className="mt-4 p-4 rounded-2xl bg-zinc-900 text-white border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {isArabic ? 'معاينة حية ومباشرة (Live Preview)' : 'Live Real-time Preview'}
              </span>
              <span className="text-[10px]">
                {isArabic ? 'كيف سيظهر للمستخدم في المتصفح' : 'How it appears to users'}
              </span>
            </div>

            {/* 1. Simulated Browser Tab */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block text-start">
                {isArabic ? '1. شكل التبويب في شريط المتصفح (Browser Tab)' : '1. Browser Tab Appearance'}
              </span>
              <div className="max-w-md bg-zinc-800/90 rounded-t-xl px-3.5 py-2 flex items-center space-x-2 rtl:space-x-reverse border border-zinc-700 shadow-inner">
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt="Favicon"
                    className="w-4 h-4 rounded object-contain shrink-0"
                  />
                ) : (
                  <div className="w-4 h-4 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-black shrink-0">
                    C
                  </div>
                )}
                <span className="text-xs font-semibold text-zinc-200 truncate flex-1 text-start">
                  {isArabic
                    ? storeTitleAr || `${storeNameAr || 'CRAFT'} | متجر الأزياء`
                    : storeTitleEn || `${storeNameEn || 'CRAFT'} | Modern Fashion`}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">✕</span>
              </div>
            </div>

            {/* 2. Simulated Storefront Header */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block text-start">
                {isArabic ? '2. شكل لوجو الهيدر في الموقع (Storefront Header)' : '2. Storefront Header Logo'}
              </span>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {storeLogo ? (
                    <img
                      src={storeLogo}
                      alt={storeNameAr || 'Logo'}
                      className="h-8 max-w-[140px] object-contain rounded"
                    />
                  ) : (
                    <span className="text-lg font-black tracking-widest text-white uppercase">
                      {isArabic ? storeNameAr || 'CRAFT' : storeNameEn || 'CRAFT'}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-zinc-400 font-medium">
                  <span>{isArabic ? 'الرئيسية' : 'Home'}</span>
                  <span>{isArabic ? 'المنتجات' : 'Products'}</span>
                  <span>{isArabic ? 'عن المتجر' : 'About'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ========================================================
            SOCIAL MEDIA LINKS & VISIBILITY CONTROL
        ======================================================== */}
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  {isArabic ? 'روابط مواقع التواصل الاجتماعي وأيقونات العرض' : 'Social Media Links & Visibility Control'}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {isArabic
                    ? 'التحكم في ظهور أو إخفاء أيقونات المنصات وتحديد روابط صفحات المتجر'
                    : 'Toggle icon visibility and configure store profile links for each platform'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-500">
                {isArabic
                  ? `الأيقونات المفعلة: ${Object.values(socialLinks).filter((s) => s.enabled && s.url.trim()).length}`
                  : `Active: ${Object.values(socialLinks).filter((s) => s.enabled && s.url.trim()).length}`}
              </span>
            </div>
          </div>

          {/* Social Platforms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                {
                  key: 'instagram',
                  nameAr: 'انستجرام (Instagram)',
                  nameEn: 'Instagram',
                  placeholder: 'https://instagram.com/yourbrand',
                  color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
                  badge: 'IG',
                },
                {
                  key: 'tiktok',
                  nameAr: 'تيك توك (TikTok)',
                  nameEn: 'TikTok',
                  placeholder: 'https://tiktok.com/@yourbrand',
                  color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
                  badge: 'TT',
                },
                {
                  key: 'facebook',
                  nameAr: 'فيسبوك (Facebook)',
                  nameEn: 'Facebook',
                  placeholder: 'https://facebook.com/yourpage',
                  color: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
                  badge: 'FB',
                },
                {
                  key: 'whatsapp',
                  nameAr: 'واتساب مباشر (WhatsApp)',
                  nameEn: 'WhatsApp',
                  placeholder: '+201234567890 أو https://wa.me/201234567890',
                  color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
                  badge: 'WA',
                },
                {
                  key: 'twitter',
                  nameAr: 'منصة إكس / تويتر (X / Twitter)',
                  nameEn: 'X / Twitter',
                  placeholder: 'https://x.com/yourhandle',
                  color: 'text-zinc-900 dark:text-zinc-100 bg-zinc-500/10 border-zinc-500/20',
                  badge: 'X',
                },
                {
                  key: 'snapchat',
                  nameAr: 'سناب شات (Snapchat)',
                  nameEn: 'Snapchat',
                  placeholder: 'https://snapchat.com/add/yourname',
                  color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                  badge: 'SC',
                },
                {
                  key: 'youtube',
                  nameAr: 'يوتيوب (YouTube)',
                  nameEn: 'YouTube',
                  placeholder: 'https://youtube.com/@yourchannel',
                  color: 'text-red-500 bg-red-500/10 border-red-500/20',
                  badge: 'YT',
                },
                {
                  key: 'telegram',
                  nameAr: 'تليجرام (Telegram)',
                  nameEn: 'Telegram',
                  placeholder: 'https://t.me/yourchannel',
                  color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
                  badge: 'TG',
                },
              ] as const
            ).map((item) => {
              const current = socialLinks[item.key];
              const isEnabled = current?.enabled ?? false;

              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-2xl border transition-all ${
                    isEnabled
                      ? 'bg-zinc-50/80 dark:bg-zinc-900/60 border-zinc-300 dark:border-zinc-700 shadow-sm'
                      : 'bg-zinc-100/40 dark:bg-zinc-950/40 border-zinc-200/50 dark:border-zinc-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-black shrink-0 ${item.color}`}>
                        {item.badge}
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {isArabic ? item.nameAr : item.nameEn}
                      </span>
                    </div>

                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSocialLinks((prev) => ({
                            ...prev,
                            [item.key]: {
                              ...prev[item.key],
                              enabled: checked,
                            },
                          }));
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-amber-500"></div>
                      <span className="ms-2 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 select-none">
                        {isEnabled ? (isArabic ? 'ظاهر' : 'Shown') : (isArabic ? 'مخفي' : 'Hidden')}
                      </span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="url"
                      disabled={!isEnabled}
                      value={current?.url || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSocialLinks((prev) => ({
                          ...prev,
                          [item.key]: {
                            ...prev[item.key],
                            url: val,
                          },
                        }));
                      }}
                      placeholder={item.placeholder}
                      className="w-full text-xs px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 font-mono text-[11px]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real-time Preview of Active Social Bar */}
          <div className="p-4 rounded-2xl bg-zinc-900 text-white border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-2">
              <span className="font-bold text-pink-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {isArabic ? 'معاينة شكل أيقونات التواصل في الفوتر والموقع' : 'Footer Social Icons Real-time Preview'}
              </span>
              <span className="text-[10px]">
                {isArabic ? 'الأيقونات التي ستظهر للزوار' : 'Visible to visitors'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {Object.entries(socialLinks).filter(([, v]) => v.enabled && v.url.trim()).length > 0 ? (
                Object.entries(socialLinks)
                  .filter(([, v]) => v.enabled && v.url.trim())
                  .map(([k, v]) => (
                    <span
                      key={k}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 shadow-sm"
                      title={v.url}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="capitalize">{k}</span>
                    </span>
                  ))
              ) : (
                <span className="text-xs text-zinc-500 italic">
                  {isArabic ? '⚠️ لم يتم تفعيل أي أيقونة (لن تظهر أي أيقونات تواصل في الفوتر)' : 'No active social links selected'}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* WhatsApp & Orders Communication */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            {isArabic ? 'إعدادات الواتساب والاتصال' : 'WhatsApp Orders & Communication'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isArabic ? 'رقم هاتف واتساب للطلبات' : 'WhatsApp Order Number'}
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
            <Input
              label={isArabic ? 'العملة الأساسية' : 'Currency'}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {isArabic ? 'قالب رسالة تأكيد الطلب على واتساب (WhatsApp Template)' : 'WhatsApp Order Message Template'}
              </label>
              <span className="text-[10px] text-zinc-400">
                {isArabic ? 'يدعم كافة بيانات الطلب والعميل' : 'Supports all order & customer variables'}
              </span>
            </div>
            <textarea
              rows={8}
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              placeholder="🛍️ تأكيد طلب جديد من متجر {storeName}..."
              className="w-full font-mono text-xs px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition leading-relaxed"
            />
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-1.5 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 block">
                {isArabic ? '💡 المتغيرات التلقائية المتاحة:' : 'Available Dynamic Variables:'}
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                {['{storeName}', '{orderNumber}', '{orderDate}', '{customerName}', '{customerPhone}', '{city}', '{customerAddress}', '{notesSection}', '{itemsSummary}', '{subtotal}', '{couponSection}', '{shippingFee}', '{total}', '{currency}'].map((token) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => setWhatsappTemplate((prev) => prev + ` ${token} `)}
                    className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-amber-500 hover:text-black transition"
                    title={isArabic ? 'انقر للإضافة' : 'Click to insert'}
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Input
            label={isArabic ? 'بريد الدعم الفني' : 'Support Email'}
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />
        </Card>

        {/* Announcement Bar & Promotional Ticker Settings */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isArabic ? 'الشريط الإعلاني والعروض المتحركة' : 'Announcement Bar & Offers Ticker'}
              </h3>
              <p className="text-[11px] text-zinc-500">
                {isArabic
                  ? 'التحكم في شريط العروض والخصومات وأكواد الكوبونات أعلى المتجر'
                  : 'Manage top promotional announcements, discounts, and coupon codes'}
              </p>
            </div>

            <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {isArabic ? 'تفعيل الشريط' : 'Enable Bar'}
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {isArabic ? 'نصوص العروض بالعربية (يمكن كتابة أكثر من عرض مفصولين بـ | أو في سطور جديدة)' : 'Offers Text (Arabic - separate multiple with | or new lines)'}
              </label>
              <textarea
                rows={3}
                value={announcementTextAr}
                onChange={(e) => setAnnouncementTextAr(e.target.value)}
                placeholder="🔥 خصم 30% على تشكيلة الصيف | 🚚 شحن مجاني للطلبات فوق 1000 جنيه | ⚡ استبدال مجاني وسهل خلال 14 يوم"
                className="w-full text-xs px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {isArabic ? 'نصوص العروض بالإنجليزية' : 'Offers Text (English)'}
              </label>
              <textarea
                rows={3}
                value={announcementTextEn}
                onChange={(e) => setAnnouncementTextEn(e.target.value)}
                placeholder="🔥 Season Sale: Up to 30% OFF | 🚚 Free Shipping on orders over 1000 EGP | ⚡ Easy 14-day returns"
                className="w-full text-xs px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isArabic ? 'كود الكوبون للنسخ السريع (اختياري)' : 'Coupon Code for Quick Copy (Optional)'}
                value={announcementCoupon}
                onChange={(e) => setAnnouncementCoupon(e.target.value)}
                placeholder="CRAFT30"
              />
              <Input
                label={isArabic ? 'رابط التوجيه عند النقر' : 'Action Link URL'}
                value={announcementLink}
                onChange={(e) => setAnnouncementLink(e.target.value)}
                placeholder="/shop"
              />
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};
