import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone, Zap } from 'lucide-react';
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

  const storeName = isArabic
    ? settings.store_name_ar || 'CRAFT'
    : settings.store_name_en || 'CRAFT';

  // Store logo from settings with favicon fallback
  const storeLogo = settings.store_logo?.trim();
  const fallbackIcon = settings.favicon_url?.trim() || '/favicon.svg';

  useEffect(() => {
    // 1. Detect if running in standalone PWA / already installed
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);

    // 2. Listen for native Android/Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 3. Listen for manual trigger (from mobile menu or footer button)
    const handleManualTrigger = () => {
      setIsVisible(true);
    };
    window.addEventListener(OPEN_INSTALL_PROMPT_EVENT, handleManualTrigger);

    // 4. Automatic display on mobile for first-time / non-dismissed visitors
    if (!isStandaloneMode) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isMobileDevice =
        /iphone|ipad|ipod|android|mobile|touch/.test(userAgent) ||
        window.innerWidth <= 768;

      if (isMobileDevice) {
        const dismissedAt = localStorage.getItem('craft_install_prompt_dismissed_at');
        const now = Date.now();
        // Show if never dismissed or dismissed more than 3 days ago
        const shouldShow = !dismissedAt || now - parseInt(dismissedAt, 10) > 3 * 24 * 60 * 60 * 1000;

        if (shouldShow) {
          const timer = setTimeout(() => {
            setIsVisible(true);
          }, 1200);
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
    try {
      localStorage.setItem('craft_install_prompt_dismissed_at', Date.now().toString());
    } catch {}
  };

  const handleInstallClick = async () => {
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
      // Direct close if unsupported browser environment
      setIsVisible(false);
      setIsInstalling(false);
    }
  };

  // If already running inside installed standalone app, don't show prompt
  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <aside
      aria-label={isArabic ? 'تثبيت تطبيق المتجر' : 'Install Store App'}
      className="fixed bottom-2.5 sm:bottom-5 inset-x-2.5 sm:inset-x-auto sm:end-5 w-[calc(100%-1.25rem)] sm:w-[380px] max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto mx-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="relative overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-start transition-all">
        {/* Subtle top accent gradient */}
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
          {/* Logo container */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-1 flex items-center justify-center overflow-hidden shadow-sm">
              {storeLogo ? (
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = fallbackIcon;
                  }}
                />
              ) : (
                <img
                  src={fallbackIcon}
                  alt={storeName}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <span className="absolute -bottom-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-black ring-2 ring-white dark:ring-zinc-900 shadow-sm">
              <Sparkles className="w-2 h-2" />
            </span>
          </div>

          {/* Title and Badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-xs sm:text-sm text-zinc-950 dark:text-zinc-50 truncate">
                {isArabic ? `تطبيق ${storeName}` : `${storeName} App`}
              </h4>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20 shrink-0">
                {isArabic ? 'سريع' : 'Fast'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {isArabic
                ? 'أضف اختصار المتجر لشاشتك الرئيسية'
                : 'Add store shortcut to your screen'}
            </p>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex items-center gap-2 mt-2.5 text-[10px] sm:text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
          <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md">
            <Zap className="w-3 h-3 text-amber-500 shrink-0" />
            <span>{isArabic ? 'تصفح أسرع' : 'Fast'}</span>
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
            <Download className="w-3.5 h-3.5" />
            <span>
              {isInstalling
                ? (isArabic ? 'جاري التثبيت...' : 'Installing...')
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
  );
};
