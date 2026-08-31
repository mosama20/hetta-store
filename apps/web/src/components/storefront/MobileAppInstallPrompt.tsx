import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Smartphone,
  Zap,
  Share2,
  PlusSquare,
  CheckCircle,
  ArrowDown,
} from 'lucide-react';
import { useStoreSettings } from '../../store/settingsStore.js';
import { useTheme } from '../../store/themeStore.js';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const OPEN_INSTALL_PROMPT_EVENT = 'open_craft_app_install';

export function triggerAppInstallPrompt() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_INSTALL_PROMPT_EVENT));
  }
}

export const MobileAppInstallPrompt: React.FC = () => {
  const { settings } = useStoreSettings();
  const { isArabic } = useTheme();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const storeName = isArabic
    ? settings.store_name_ar || 'HETTA'
    : settings.store_name_en || 'HETTA';

  // Store logo from settings with favicon fallback
  const storeLogo = settings.store_logo?.trim();
  const fallbackIcon = settings.favicon_url?.trim() || '/favicon.svg';

  useEffect(() => {
    // 1. Detect if running in standalone PWA / already installed
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);

    // 2. Detect iOS Device (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectedIOS =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.maxTouchPoints > 1 && /macintosh/.test(userAgent));

    setIsIOS(detectedIOS);

    // 3. Listen for native Android/Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. Listen for manual trigger (from header/footer)
    const handleManualTrigger = () => {
      if (detectedIOS) {
        setShowIOSGuide(true);
      } else {
        setIsVisible(true);
      }
    };
    window.addEventListener(OPEN_INSTALL_PROMPT_EVENT, handleManualTrigger);

    // 5. Automatic display on mobile for first-time / non-dismissed visitors
    if (!isStandaloneMode) {
      const isMobileDevice = detectedIOS || /android|mobile|touch/.test(userAgent) || window.innerWidth <= 768;

      if (isMobileDevice) {
        const dismissedAt = localStorage.getItem('craft_install_prompt_dismissed_at');
        const now = Date.now();
        // Show if never dismissed or dismissed more than 3 days ago
        const shouldShow = !dismissedAt || now - parseInt(dismissedAt, 10) > 3 * 24 * 60 * 60 * 1000;

        if (shouldShow) {
          const timer = setTimeout(() => {
            setIsVisible(true);
          }, 1500);
          return () => clearTimeout(timer);
        }
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener(OPEN_INSTALL_PROMPT_EVENT, handleManualTrigger);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSGuide(false);
    try {
      localStorage.setItem('craft_install_prompt_dismissed_at', Date.now().toString());
    } catch {}
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      // On iOS Safari, show the interactive step-by-step installation guide
      setShowIOSGuide(true);
      return;
    }

    setIsInstalling(true);

    if (deferredPrompt) {
      // Native 1-Click Install Dialog (Android, Chrome, Edge)
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsVisible(false);
          setDeferredPrompt(null);
          try {
            localStorage.setItem('craft_install_prompt_dismissed_at', (Date.now() + 365 * 24 * 60 * 60 * 1000).toString());
          } catch {}
        }
      } catch (err) {
        console.error('Install prompt error:', err);
        setIsVisible(false);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Fallback for browsers without direct prompt
      setShowIOSGuide(true);
      setIsInstalling(false);
    }
  };

  // If already running inside installed standalone app, don't show prompt
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* 1. Interactive iOS Safari Installation Guide Modal / Bottom Sheet */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-start transition-all max-h-[92vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowIOSGuide(false)}
              aria-label={isArabic ? 'إغلاق' : 'Close'}
              className="absolute top-4 end-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5 pe-8">
              <div className="w-14 h-14 rounded-2xl bg-zinc-950 dark:bg-black border border-amber-500/30 p-1.5 flex items-center justify-center overflow-hidden shadow-md shrink-0">
                <img
                  src={storeLogo || fallbackIcon}
                  alt={storeName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = fallbackIcon;
                  }}
                />
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20 mb-1">
                  {isArabic ? 'تثبيت على iPhone و iPad' : 'Install on iPhone & iPad'}
                </span>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                  {isArabic ? `تثبيت تطبيق ${storeName}` : `Install ${storeName} App`}
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
              {isArabic
                ? 'لإضافة المتجر كتطبيق سريع على شاشتك الرئيسية بدون متجر التطبيقات، اتبع هذه الخطوات البسيطة في متصفح Safari:'
                : 'To add the store as a fast app on your home screen without App Store, follow these simple steps in Safari:'}
            </p>

            {/* Step-by-step Guide */}
            <div className="space-y-3 mb-6">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-zinc-900 dark:text-white mb-0.5">
                    {isArabic ? '1. اضغط على زر المشاركة (Share)' : '1. Tap the Share button'}
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                    {isArabic
                      ? 'ستجد أيقونة المشاركة (مربع بسهم للأعلى) في أسفل شاشة Safari.'
                      : 'Find the Share icon (square with arrow up) at the bottom bar of Safari.'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <PlusSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-zinc-900 dark:text-white mb-0.5">
                    {isArabic
                      ? '2. اختر "إضافة إلى الصفحة الرئيسية"'
                      : '2. Select "Add to Home Screen"'}
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                    {isArabic
                      ? 'مرر قائمة الخيارات للأسفل واضغط على Add to Home Screen (+).'
                      : 'Scroll down the menu list and tap "Add to Home Screen" (+).'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-zinc-900 dark:text-white mb-0.5">
                    {isArabic ? '3. اضغط على "إضافة" (Add)' : '3. Tap "Add" at the top'}
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                    {isArabic
                      ? 'اضغط على زر إضافة في الزاوية العلوية لتأكيد ظهور التطبيق فوراً.'
                      : 'Tap Add in the top corner to complete adding it to your screen.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Pointer Animation for Safari */}
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 animate-bounce mb-4">
              <ArrowDown className="w-4 h-4" />
              <span>
                {isArabic
                  ? 'زر المشاركة يظهر في شريط Safari بالأسفل'
                  : 'Share button is located at the bottom of Safari'}
              </span>
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => {
                setShowIOSGuide(false);
                setIsVisible(false);
                try {
                  localStorage.setItem('craft_install_prompt_dismissed_at', Date.now().toString());
                } catch {}
              }}
              className="w-full py-3 px-4 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black font-bold text-xs shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition active:scale-[0.98]"
            >
              {isArabic ? 'حسناً، فهمت الخطوات' : 'Got it!'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Bottom Install Prompt Banner */}
      {isVisible && !showIOSGuide && (
        <aside
          aria-label={isArabic ? 'تثبيت تطبيق المتجر' : 'Install Store App'}
          className="fixed bottom-2.5 sm:bottom-5 inset-x-2.5 sm:inset-x-auto sm:end-5 w-[calc(100%-1.25rem)] sm:w-[380px] max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto mx-auto"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="relative overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-start transition-all">
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 opacity-90" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              aria-label={isArabic ? 'إغلاق' : 'Close'}
              className="absolute top-2.5 end-2.5 p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with Store Logo */}
            <div className="flex items-center gap-3 pe-6">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-1 flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={storeLogo || fallbackIcon}
                    alt={storeName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = fallbackIcon;
                    }}
                  />
                </div>
              </div>

              {/* Title and Badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-zinc-950 dark:text-zinc-50 truncate">
                    {isArabic ? `تطبيق ${storeName}` : `${storeName} App`}
                  </h4>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20 shrink-0">
                    {isIOS ? (isArabic ? 'آيفون' : 'iOS') : isArabic ? 'سريع' : 'Fast'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  {isArabic
                    ? 'أضف المتجر لشاشتك الرئيسية لتصفح أسرع'
                    : 'Add store shortcut to your screen'}
                </p>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex items-center gap-2 mt-2.5 text-[10px] sm:text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md">
                <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{isArabic ? 'تصفح أسرع' : 'Ultra Fast'}</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md">
                <Smartphone className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{isArabic ? 'بدون مساحة' : 'No storage'}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition disabled:opacity-75"
              >
                {isIOS ? <Share2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>
                  {isInstalling
                    ? (isArabic ? 'جاري التثبيت...' : 'Installing...')
                    : isIOS
                    ? (isArabic ? 'طريقة الإضافة للشاشة' : 'Add to Home Screen')
                    : (isArabic ? 'تثبيت التطبيق' : 'Install App')}
                </span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition shrink-0"
              >
                {isArabic ? 'ليس الآن' : 'Not now'}
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};

