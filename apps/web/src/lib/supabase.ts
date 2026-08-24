import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys
const STORAGE_KEYS = {
  URL: 'supabase_custom_url',
  ANON_KEY: 'supabase_custom_anon_key',
  BUCKET: 'supabase_custom_bucket',
};

// Get active configuration (priority: localStorage custom override -> Vite Env variables)
export const getSupabaseConfig = () => {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.URL) : null;
  const customAnonKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ANON_KEY) : null;
  const customBucket = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.BUCKET) : null;

  const url = customUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = customAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const bucket = customBucket || import.meta.env.VITE_SUPABASE_BUCKET || 'fashion-store';

  return { url, anonKey, bucket };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
};

let cachedClient: SupabaseClient | null = null;
let currentConfigHash = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  const hash = `${url}_${anonKey}`;
  if (!cachedClient || currentConfigHash !== hash) {
    cachedClient = createClient(url, anonKey);
    currentConfigHash = hash;
  }

  return cachedClient;
};

export const saveSupabaseConfig = (url: string, anonKey: string, bucket: string = 'fashion-store') => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.ANON_KEY, anonKey.trim());
    localStorage.setItem(STORAGE_KEYS.BUCKET, bucket.trim() || 'fashion-store');
    cachedClient = null;
  }
};

export const resetSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.URL);
    localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
    localStorage.removeItem(STORAGE_KEYS.BUCKET);
    cachedClient = null;
  }
};

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload a single image directly to Supabase Storage.
 * This runs completely on the client side (mobile/desktop)
 * and puts 0% load or bandwidth on the application backend server.
 */
export async function uploadImageToSupabase(
  file: File,
  folder: string = 'general',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const client = getSupabaseClient();
  const { bucket } = getSupabaseConfig();

  if (!client) {
    throw new Error(
      'لم يتم ضبط إعدادات Supabase بعد. يرجى إدخال Supabase URL و Anon Key في إعدادات التخزين أو ملف .env'
    );
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('الملف المرفوع يجب أن يكون صورة فقط (JPG, PNG, WebP, GIF, AVIF)');
  }

  // Max 10MB file size limit for sanity
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 10 ميجابايت.');
  }

  // Sanitize filename and create unique path
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = file.name
    .substring(0, file.name.lastIndexOf('.'))
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const randomStr = Math.random().toString(36).substring(2, 8);
  const filePath = `${folder}/${Date.now()}_${cleanName || 'img'}_${randomStr}.${ext}`;

  if (onProgress) onProgress(20);

  // Direct upload to Supabase Storage
  const { data, error } = await client.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    // Helpful guidance on common Supabase Storage errors
    if (error.message.includes('Bucket not found')) {
      throw new Error(`الـ Bucket باسم "${bucket}" غير موجود في حسابك في Supabase. يرجى إنشاؤه في لوحة تحكم Supabase > Storage وجعله Public.`);
    }
    if (error.message.includes('row-level security') || error.message.includes('policy')) {
      throw new Error(`لم يتم تفعيل صلاحيات الرفع على Bucket "${bucket}". يرجى التأكد من إضافة Storage Policy للـ INSERT و SELECT في Supabase.`);
    }
    throw new Error(`فشل رفع الصورة إلى Supabase: ${error.message}`);
  }

  if (onProgress) onProgress(80);

  // Get Public URL
  const { data: publicData } = client.storage.from(bucket).getPublicUrl(data.path);

  if (onProgress) onProgress(100);

  return {
    url: publicData.publicUrl,
    path: data.path,
  };
}
