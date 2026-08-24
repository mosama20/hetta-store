import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  resetSupabaseConfig,
  isSupabaseConfigured,
} from '../../lib/supabase.js';
import { useTheme } from '../../store/themeStore.js';
import { Database, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const { isArabic } = useTheme();
  const current = getSupabaseConfig();
  const [url, setUrl] = useState(current.url);
  const [anonKey, setAnonKey] = useState(current.anonKey);
  const [bucket, setBucket] = useState(current.bucket || 'fashion-store');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const configured = isSupabaseConfigured();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey, bucket);
    setSavedSuccess(true);
    if (onConfigSaved) onConfigSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm(isArabic ? 'هل تريد استعادة الإعدادات الافتراضية؟' : 'Reset to default env settings?')) {
      resetSupabaseConfig();
      const def = getSupabaseConfig();
      setUrl(def.url);
      setAnonKey(def.anonKey);
      setBucket(def.bucket);
      if (onConfigSaved) onConfigSaved();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isArabic ? 'إعدادات ربط سوبابيز (Supabase Storage)' : 'Supabase Storage Configuration'}
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
          <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <p className="font-bold">
              {isArabic
                ? 'رفع مباشر وسريع بدون أي ضغط على السيرفر'
                : 'Direct Client Uploads — Zero Server Bandwidth'}
            </p>
            <p className="text-[11px] leading-relaxed text-emerald-800/80 dark:text-emerald-300/80">
              {isArabic
                ? 'يتم رفع الصور مباشرة من متصفح الهاتف أو الكمبيوتر إلى Supabase Storage CDN، مما يوفر سرعة فائقة ولا يستهلك أي مساحة أو معالجة من السيرفر المجاني.'
                : 'Images are uploaded directly from user device to Supabase CDN, bypassing your web server completely.'}
            </p>
          </div>
        </div>

        {configured ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-900">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isArabic ? 'سوبابيز متصل وجاهز لرفع الصور فوراً' : 'Supabase is configured & ready for uploads'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-900">
            <AlertTriangle className="w-4 h-4" />
            <span>{isArabic ? 'يرجى إدخال بيانات مشروع Supabase لتفعيل رفع الصور' : 'Please provide Supabase credentials to enable image upload'}</span>
          </div>
        )}

        <div className="space-y-3">
          <Input
            label={isArabic ? 'رابط مشروع سوبابيز (Project URL)' : 'Project URL'}
            placeholder="https://xyzcompany.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />

          <Input
            label={isArabic ? 'المفتاح العام (anon public key)' : 'Anon Public API Key'}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            type="password"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            required
          />

          <Input
            label={isArabic ? 'اسم الـ Storage Bucket في سوبابيز' : 'Storage Bucket Name'}
            placeholder="fashion-store"
            value={bucket}
            onChange={(e) => setBucket(e.target.value)}
            required
          />
        </div>

        {/* Quick Instructions */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5">
          <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
            <span>{isArabic ? 'خطوات سريعة لإنشاء الـ Bucket في Supabase:' : 'Quick Supabase Setup Guide:'}</span>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline text-[10px]"
            >
              <span>{isArabic ? 'فتح لوحة سوبابيز' : 'Open Supabase'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="list-decimal list-inside space-y-0.5 text-zinc-500">
            <li>{isArabic ? 'ادخل على لوحة تحكم Supabase وافتح قسم Storage.' : 'Open your Supabase Project > Storage.'}</li>
            <li>{isArabic ? `اضغط New Bucket وسمّه "${bucket || 'fashion-store'}" وفعّل خيار Public Bucket.` : `Create a new bucket named "${bucket || 'fashion-store'}" and toggle Public Bucket ON.`}</li>
            <li>{isArabic ? 'انسخ الـ Project URL و anon key من Project Settings > API وضعهما هنا.' : 'Copy Project URL & anon key from Settings > API into this form.'}</li>
          </ol>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-zinc-400 hover:text-zinc-600 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>{isArabic ? 'استعادة الافتراضي' : 'Reset'}</span>
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={savedSuccess}>
              {savedSuccess
                ? (isArabic ? 'تم الحفظ بنجاح ✓' : 'Saved ✓')
                : (isArabic ? 'حفظ الإعدادات' : 'Save Config')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
