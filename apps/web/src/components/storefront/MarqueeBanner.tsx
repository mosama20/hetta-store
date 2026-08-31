import React from 'react';
import { Flame, Zap, ShieldCheck, Check } from 'lucide-react';
import { useTheme } from '../../store/themeStore.js';

interface MarqueeBannerProps {
  variant?: 'dark' | 'sand' | 'outline';
  text?: string;
  speed?: 'slow' | 'normal' | 'fast';
}

export const MarqueeBanner: React.FC<MarqueeBannerProps> = ({ variant = 'dark', text }) => {
  const { isArabic } = useTheme();

  const itemsAr = [
    { text: text || 'كولكشن الصيف الجديد متوفر الآن', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
    { text: 'قطن مصري 100% عالي الجودة', icon: <Check className="w-3.5 h-3.5 text-amber-400" /> },
    { text: 'شحن مجاني للطلبات فوق 1000 ج', icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
    { text: 'استبدال مجاني خلال 14 يوم', icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> },
    { text: 'تصاميم بسيطة لكن مختلفة', icon: <Check className="w-3.5 h-3.5 text-amber-400" /> },
  ];

  const itemsEn = [
    { text: text || 'NEW SUMMER COLLECTION DROP', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
    { text: '100% COMBED PREMIUM COTTON', icon: <Check className="w-3.5 h-3.5 text-amber-400" /> },
    { text: 'FREE SHIPPING ON ORDERS OVER 1000 EGP', icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
    { text: 'HASSLE-FREE 14-DAY RETURNS', icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> },
    { text: 'MINIMAL SILHOUETTES • MAXIMAL CRAFT', icon: <Check className="w-3.5 h-3.5 text-amber-400" /> },
  ];

  const activeItems = isArabic ? itemsAr : itemsEn;

  // Duplicate items array to make the continuous loop infinite without blanks
  const loopItems = [...activeItems, ...activeItems, ...activeItems];

  const bgClasses =
    variant === 'sand'
      ? 'bg-[#eae5dd] text-zinc-900 border-y border-zinc-300'
      : variant === 'outline'
      ? 'bg-transparent text-zinc-900 dark:text-zinc-100 border-y border-zinc-200 dark:border-zinc-800'
      : 'bg-zinc-950 text-zinc-100 border-y border-zinc-800';

  return (
    <div className={`w-full overflow-hidden py-3.5 select-none transition-colors ${bgClasses}`}>
      <div className={isArabic ? 'animate-marquee-rtl' : 'animate-marquee-ltr'}>
        {loopItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center space-x-4 rtl:space-x-reverse px-6 shrink-0"
          >
            <span className="text-xs sm:text-sm font-black tracking-widest uppercase flex items-center gap-2.5">
              {item.icon}
              <span>{item.text}</span>
            </span>
            <span className="text-zinc-500 font-bold opacity-60">•</span>
          </div>
        ))}
      </div>
    </div>
  );
};
