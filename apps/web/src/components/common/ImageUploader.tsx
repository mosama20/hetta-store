import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Loader2,
  Settings,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { uploadImageToSupabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { SupabaseConfigModal } from '../admin/SupabaseConfigModal.js';
import { useTheme } from '../../store/themeStore.js';
import { Button } from './Button.js';
import { Input } from './Input.js';

export interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  className?: string;
  compact?: boolean;
  placeholder?: string;
  aspectRatio?: 'video' | 'square' | 'banner' | 'auto';
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label,
  folder = 'general',
  className = '',
  compact = false,
  aspectRatio = 'auto',
  disabled = false,
}) => {
  const { isArabic } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const configured = isSupabaseConfigured();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (!configured) {
      setShowConfigModal(true);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);
      setErrorMessage(null);

      const result = await uploadImageToSupabase(file, folder, (progress) => {
        setUploadProgress(progress);
      });

      onChange(result.url);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'فشل رفع الصورة');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      } else {
        setErrorMessage(isArabic ? 'يرجى إسقاط ملف صورة صالح' : 'Please drop an image file');
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled || isUploading) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileSelect(file);
          break;
        }
      }
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'banner':
        return 'aspect-[21/9] min-h-[140px]';
      case 'video':
        return 'aspect-video min-h-[140px]';
      case 'square':
        return 'aspect-square min-h-[120px]';
      default:
        return compact ? 'min-h-[90px]' : 'min-h-[130px]';
    }
  };

  return (
    <div className={`space-y-2 ${className}`} onPaste={handlePaste}>
      {/* Label and Actions Bar */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <div className="flex items-center gap-1.5 ms-auto">
          {/* Supabase Status Indicator / Config Button */}
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
              configured
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 animate-pulse'
            }`}
            title={isArabic ? 'إعدادات Supabase Storage' : 'Supabase Storage Settings'}
          >
            <Settings className="w-2.5 h-2.5" />
            <span>{configured ? 'Supabase CDN' : (isArabic ? 'ربط سوبابيز' : 'Connect Supabase')}</span>
          </button>

          {/* Toggle URL input fallback */}
          <button
            type="button"
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={isArabic ? 'إدخال رابط صورة يدوياً' : 'Enter URL manually'}
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Manual URL Input Bar (When opened) */}
      {showManualUrl && (
        <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="text-xs h-8 flex-1"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 text-zinc-400 hover:text-red-500 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Hidden File Input for Native Camera / File Browser */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Main Dropzone / Preview Area */}
      {value ? (
        /* Image Preview Box */
        <div
          className={`relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center ${getAspectClass()}`}
        >
          <img
            src={value}
            alt="Uploaded Preview"
            className="w-full h-full object-cover rounded-2xl"
          />

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="text-xs shadow-md"
            >
              <Camera className="w-3.5 h-3.5 mr-1" />
              <span>{isArabic ? 'تغيير الصورة' : 'Replace Image'}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => onChange('')}
              disabled={disabled || isUploading}
              className="text-xs shadow-md p-2"
              title={isArabic ? 'حذف الصورة' : 'Remove image'}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Supabase Storage Verified Badge */}
          {value.includes('supabase.co') && (
            <div className="absolute bottom-2 end-2 bg-emerald-950/80 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 border border-emerald-500/30">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <span>Supabase</span>
            </div>
          )}
        </div>
      ) : (
        /* Upload Area */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!configured) {
              setShowConfigModal(true);
            } else {
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center ${getAspectClass()} ${
            isDragOver
              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
              : 'border-zinc-300 dark:border-zinc-700/80 hover:border-primary-400 dark:hover:border-primary-500 bg-zinc-50/70 dark:bg-zinc-900/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/70'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {isArabic ? 'جارٍ رفع الصورة إلى Supabase...' : 'Uploading to Supabase CDN...'}
                </p>
                <div className="w-36 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 max-w-[260px]">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-inner">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {isArabic ? 'اضغط لاختيار صورة من جهازك أو اسحبها هنا' : 'Click to upload or drag & drop'}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isArabic
                    ? 'يدعم الهاتف واللابتوب (JPG, PNG, WebP)'
                    : 'From phone camera, gallery or desktop (JPG, PNG, WebP)'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{errorMessage}</p>
            {!configured && (
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="text-[11px] font-bold underline mt-0.5 hover:text-red-700 block"
              >
                {isArabic ? 'اضغط هنا لضبط إعدادات Supabase الآن' : 'Click here to configure Supabase'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  );
};
