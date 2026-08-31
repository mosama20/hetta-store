import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Tag, ArrowRight, ArrowLeft, Flame, Truck, RefreshCw, X } from 'lucide-react';
import { useStoreSettings, STORE_SYNC_EVENT } from '../../store/settingsStore.js';
import { useTheme } from '../../store/themeStore.js';

export const AnnouncementBar: React.FC = () => {
  const { settings, reloadSettings } = useStoreSettings();
  const { isArabic } = useTheme();

  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  React.useEffect(() => {
    const handleSync = () => {
      reloadSettings();
    };
    window.addEventListener(STORE_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(STORE_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [reloadSettings]);

  // Check if enabled (default is true if not explicitly set to 'false')
  const isEnabled = String(settings.announcement_bar_enabled) !== 'false';

  // Default fallback messages if not set in DB
  const defaultMessagesAr = [
    { text: 'عروض الموسم: خصم يصل إلى 30% على تشكيلة الصيف الجديدة', icon: <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" /> },
    { text: 'شحن مجاني لكافة محافظات مصر على الطلبات فوق 1000 جنيه', icon: <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> },
    { text: 'استبدال وإرجاع فوري وسهل خلال 14 يوماً من الاستلام', icon: <RefreshCw className="w-3.5 h-3.5 text-sky-400 shrink-0" /> },
  ];

  const defaultMessagesEn = [
    { text: 'Season Sale: Up to 30% OFF on our New Summer Drop', icon: <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" /> },
    { text: 'Free Shipping across Egypt on orders above 1000 EGP', icon: <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> },
    { text: 'Easy & Free 14-day Exchanges and Returns', icon: <RefreshCw className="w-3.5 h-3.5 text-sky-400 shrink-0" /> },
  ];

  // Parse custom messages if entered by user in settings (supports '|' or newlines)
  const rawTextAr = settings.announcement_text_ar?.trim();
  const rawTextEn = settings.announcement_text_en?.trim();

  const icons = [
    <Flame key="1" className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
    <Truck key="2" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
    <RefreshCw key="3" className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
    <Tag key="4" className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
  ];

  const parsedMessagesAr = rawTextAr
    ? rawTextAr.split(/[\n|]/).map((m, idx) => ({
        text: m.trim(),
        icon: icons[idx % icons.length],
      })).filter((item) => item.text.length > 0)
    : defaultMessagesAr;

  const parsedMessagesEn = rawTextEn
    ? rawTextEn.split(/[\n|]/).map((m, idx) => ({
        text: m.trim(),
        icon: icons[idx % icons.length],
      })).filter((item) => item.text.length > 0)
    : defaultMessagesEn;

  const activeMessages = isArabic ? parsedMessagesAr : parsedMessagesEn;
  const targetLink = settings.announcement_link?.trim() || '/shop';
  const couponCode = settings.announcement_coupon?.trim() || '';

  if (!isEnabled || dismissed || activeMessages.length === 0) {
    return null;
  }

  // Duplicate items 4 times so the continuous marquee flows infinitely without jumping
  const continuousList = [...activeMessages, ...activeMessages, ...activeMessages, ...activeMessages];

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!couponCode) return;
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      className="relative z-50 w-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white border-b border-zinc-800 shadow-sm select-none overflow-hidden"
      aria-label="Breaking Offers and Announcements"
    >
      <div className="relative flex items-center h-8 sm:h-9">
        {/* Left Fixed Badge - Compact on Mobile, Full on Tablet/Desktop */}
        <div className="relative z-20 flex items-center h-full px-2 sm:px-3.5 bg-zinc-950 border-e border-zinc-800/80 shrink-0 shadow-sm">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] sm:text-[11px] font-black uppercase tracking-wider">
            <span className="hidden sm:inline">{isArabic ? 'عروض حصرية' : 'HOT OFFERS'}</span>
            <span className="sm:hidden">{isArabic ? 'عروض' : 'OFFERS'}</span>
          </span>
        </div>

        {/* Continuous Flowing News Ticker */}
        <div className="relative flex-1 overflow-hidden flex items-center h-full group">
          <div
            className={`flex items-center space-x-6 sm:space-x-8 rtl:space-x-reverse ${
              isArabic ? 'animate-marquee-rtl' : 'animate-marquee-ltr'
            }`}
            style={{ animationDuration: '28s' }}
          >
            {continuousList.map((item, index) => (
              <Link
                key={index}
                to={targetLink}
                className="inline-flex items-center space-x-2 rtl:space-x-reverse shrink-0 text-[11px] sm:text-xs md:text-[13px] font-semibold text-zinc-200 hover:text-white transition-colors py-0.5 group-hover:opacity-95"
              >
                {item.icon}
                <span className="whitespace-nowrap tracking-wide">{item.text}</span>
                <span className="text-zinc-600 font-bold px-1.5 sm:px-2">•</span>
              </Link>
            ))}
          </div>

          {/* Subtle Gradient Fade Edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-4 sm:w-6 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-4 sm:w-6 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
        </div>

        {/* Right Fixed Controls (Coupon & Dismiss) */}
        <div className="relative z-20 flex items-center h-full px-1.5 sm:px-2.5 bg-zinc-950 border-s border-zinc-800/80 shrink-0 gap-1 sm:gap-2">
          {/* Coupon Code Pill */}
          {couponCode && (
            <button
              type="button"
              onClick={handleCopyCoupon}
              className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-400 font-mono font-bold text-[9px] sm:text-[11px] transition shrink-0 hover:border-amber-400/60 shadow-sm"
              title={isArabic ? 'انقر لنسخ الكوبون' : 'Click to copy coupon code'}
            >
              <Tag className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span>{couponCode}</span>
              {copied ? (
                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
              ) : (
                <Copy className="w-2 h-2 sm:w-2.5 sm:h-2.5 opacity-70" />
              )}
            </button>
          )}

          {/* Shop CTA Link on Tablet / Desktop */}
          <Link
            to={targetLink}
            className="hidden md:inline-flex items-center text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
          >
            <span>{isArabic ? 'تسوق' : 'Shop'}</span>
            {isArabic ? (
              <ArrowLeft className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowRight className="w-3 h-3 ml-0.5" />
            )}
          </Link>

          {/* Dismiss Button */}
          <button
            onClick={() => setDismissed(true)}
            className="p-0.5 sm:p-1 text-zinc-400 hover:text-zinc-200 rounded-full hover:bg-zinc-800 transition"
            title={isArabic ? 'إغلاق الشريط' : 'Dismiss'}
            aria-label="Dismiss"
          >
            <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};
