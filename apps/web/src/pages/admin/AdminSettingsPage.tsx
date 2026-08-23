import React, { useEffect, useState, useRef } from 'react';
import { settingsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { triggerStoreSync } from '../../store/settingsStore.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { Card } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import {
  Save,
  Download,
  Upload,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { isArabic } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storeNameAr, setStoreNameAr] = useState('');
  const [storeNameEn, setStoreNameEn] = useState('');
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
        if (s.key === 'currency') setCurrency(s.value);
        if (s.key === 'whatsapp_number') setWhatsappNumber(s.value);
        if (s.key === 'whatsapp_order_template_ar') setWhatsappTemplate(s.value);
        if (s.key === 'support_email') setSupportEmail(s.value);
        if (s.key === 'announcement_bar_enabled') setAnnouncementEnabled(s.value !== 'false');
        if (s.key === 'announcement_text_ar') setAnnouncementTextAr(s.value);
        if (s.key === 'announcement_text_en') setAnnouncementTextEn(s.value);
        if (s.key === 'announcement_link') setAnnouncementLink(s.value);
        if (s.key === 'announcement_coupon') setAnnouncementCoupon(s.value);
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
      settingsApi.update('currency', currency, 'GENERAL'),
      settingsApi.update('whatsapp_number', whatsappNumber, 'WHATSAPP'),
      settingsApi.update('whatsapp_order_template_ar', whatsappTemplate, 'WHATSAPP'),
      settingsApi.update('support_email', supportEmail, 'GENERAL'),
      settingsApi.update('announcement_bar_enabled', announcementEnabled ? 'true' : 'false', 'GENERAL'),
      settingsApi.update('announcement_text_ar', announcementTextAr, 'GENERAL'),
      settingsApi.update('announcement_text_en', announcementTextEn, 'GENERAL'),
      settingsApi.update('announcement_link', announcementLink, 'GENERAL'),
      settingsApi.update('announcement_coupon', announcementCoupon, 'GENERAL'),
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
        {/* Branding & Name */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'اسم وهوية المتجر' : 'Store Branding'}
            </h3>
            <Button type="submit" variant="gold" size="sm" isLoading={isSaving}>
              <Save className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              <span>{isArabic ? 'حفظ الإعدادات' : 'Save Settings'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isArabic ? 'اسم المتجر (بالعربية)' : 'Store Name (Arabic)'}
              value={storeNameAr}
              onChange={(e) => setStoreNameAr(e.target.value)}
              required
            />
            <Input
              label={isArabic ? 'اسم المتجر (بالإنجليزية)' : 'Store Name (English)'}
              value={storeNameEn}
              onChange={(e) => setStoreNameEn(e.target.value)}
              required
            />
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
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              {isArabic ? 'قالب رسالة تأكيد الطلب على واتساب' : 'WhatsApp Order Message Template'}
            </label>
            <textarea
              rows={5}
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              placeholder={
                isArabic
                  ? 'مرحباً، أود تأكيد طلبي من المتجر:\nالطلب رقم: {orderNumber}\nالاسم: {customerName}\nالعنوان: {customerAddress}\n\nالمنتجات:\n{itemsSummary}\n\nالإجمالي: {total} {currency}'
                  : 'Hello, I want to confirm my order:\nOrder: {orderNumber}\nName: {customerName}\nAddress: {customerAddress}\n\nItems:\n{itemsSummary}\n\nTotal: {total} {currency}'
              }
              className="w-full font-mono text-xs px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition"
            />
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
