import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Star,
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

export interface ProductImageItem {
  url: string;
  altTextAr?: string;
  altTextEn?: string;
  isPrimary?: boolean;
}

interface MultiImageUploaderProps {
  images: ProductImageItem[];
  onChange: (images: ProductImageItem[]) => void;
  folder?: string;
  label?: string;
  description?: string;
  maxFiles?: number;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  images,
  onChange,
  folder = 'products',
  label,
  description,
  maxFiles = 10,
}) => {
  const { isArabic } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');
  const [showManualUrl, setShowManualUrl] = useState(false);

  const configured = isSupabaseConfigured();

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    if (!configured) {
      setShowConfigModal(true);
      return;
    }

    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      setErrorMessage(isArabic ? 'يرجى اختيار ملفات صور فقط' : 'Please select image files only');
      return;
    }

    if (images.length + fileArray.length > maxFiles) {
      setErrorMessage(
        isArabic
          ? `الحد الأقصى لعدد الصور هو ${maxFiles} صورة`
          : `Maximum allowed is ${maxFiles} images`
      );
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const newUploadedItems: ProductImageItem[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress((prev) => ({ ...prev, [file.name]: 20 }));

        const result = await uploadImageToSupabase(file, folder, (percent) => {
          setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
        });

        newUploadedItems.push({
          url: result.url,
          isPrimary: images.length === 0 && newUploadedItems.length === 0,
        });
      }

      onChange([...images, ...newUploadedItems]);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'فشل رفع إحدى الصور');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    // If the removed image was primary and other images remain, make the first one primary
    if (images[index]?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    onChange(updated);
  };

  const handleAddManualUrl = () => {
    if (!manualUrlInput.trim()) return;
    onChange([
      ...images,
      {
        url: manualUrlInput.trim(),
        isPrimary: images.length === 0,
      },
    ]);
    setManualUrlInput('');
    setShowManualUrl(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Supabase Indicator */}
      <div className="flex items-center justify-between">
        <div>
          {label && (
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{label}</span>
              <span className="text-xs font-normal text-zinc-400">
                ({images.length}/{maxFiles})
              </span>
            </h4>
          )}
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Supabase Status Button */}
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              configured
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 animate-pulse'
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>{configured ? 'Supabase Storage' : (isArabic ? 'ضبط سوبابيز' : 'Setup Supabase')}</span>
          </button>

          {/* Add Manual URL toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="text-xs h-7 gap-1"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{isArabic ? 'رابط مباشر' : 'Add URL'}</span>
          </Button>
        </div>
      </div>

      {/* Manual URL Input Bar */}
      {showManualUrl && (
        <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-fadeIn">
          <Input
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            placeholder="https://images.unsplash.com/... or https://..."
            className="text-xs flex-1"
          />
          <Button type="button" size="sm" onClick={handleAddManualUrl} disabled={!manualUrlInput.trim()}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{isArabic ? 'إضافة' : 'Add'}</span>
          </Button>
        </div>
      )}

      {/* Hidden Multi-file input for Phone & Laptop */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesUpload(e.target.files);
          }
        }}
        className="hidden"
        disabled={isUploading}
      />

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Upload Action Card */}
        {images.length < maxFiles && (
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
            className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/30 scale-[1.02]'
                : 'border-zinc-300 dark:border-zinc-700/80 hover:border-primary-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 bg-zinc-50/50 dark:bg-zinc-900/30'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
                <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  {isArabic ? 'جارٍ الرفع إلى Supabase...' : 'Uploading to Supabase...'}
                </p>
                {Object.values(uploadProgress).length > 0 && (
                  <span className="text-[10px] font-mono text-primary-600 dark:text-primary-400">
                    {Math.max(...Object.values(uploadProgress))}%
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {isArabic ? 'رفع صور جديدة' : 'Upload Images'}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {isArabic ? 'من الكاميرا أو المعرض' : 'From camera or files'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Existing Images Thumbnails */}
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`relative group aspect-square rounded-2xl overflow-hidden border bg-zinc-100 dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md ${
              img.isPrimary
                ? 'border-amber-500 ring-2 ring-amber-500/20'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <img
              src={img.url}
              alt={`Product ${idx + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Top Primary Badge */}
            {img.isPrimary && (
              <div className="absolute top-2 start-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-2.5 h-2.5 fill-current" />
                <span>{isArabic ? 'الرئيسية' : 'Cover'}</span>
              </div>
            )}

            {/* Supabase Indicator */}
            {img.url.includes('supabase.co') && (
              <div className="absolute bottom-2 start-2 bg-emerald-950/80 text-emerald-300 text-[9px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-sm flex items-center gap-0.5 border border-emerald-500/30">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                <span>Supabase</span>
              </div>
            )}

            {/* Action overlay on Hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-700 transition-colors shadow-sm"
                  title={isArabic ? 'حذف الصورة' : 'Delete image'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {!img.isPrimary && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(idx)}
                  className="w-full py-1 px-2 rounded-lg bg-amber-500/90 hover:bg-amber-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm"
                >
                  <Star className="w-3 h-3" />
                  <span>{isArabic ? 'تعيين كرئيسية' : 'Set as Cover'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{errorMessage}</p>
            {!configured && (
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="text-[11px] font-bold underline mt-1 hover:text-red-700 block"
              >
                {isArabic ? 'اضغط هنا لضبط إعدادات Supabase Storage الآن' : 'Click here to configure Supabase'}
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
