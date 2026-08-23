import React from 'react';
import { Link } from 'react-router-dom';
import { CMSSection } from '../../types/index.js';
import { useTheme } from '../../store/themeStore.js';
import { getLocalized } from '../../utils/formatters.js';
import { Truck, MessageCircle } from 'lucide-react';

export const CmsPromoBanner: React.FC<{ section: CMSSection }> = ({ section }) => {
  const { isArabic } = useTheme();

  const title = getLocalized(section.titleAr, section.titleEn, isArabic);
  const subtitle = getLocalized(section.subtitleAr, section.subtitleEn, isArabic);
  const actionUrl = (section.payload?.actionUrl as string) || '/shop';

  return (
    <div className="w-full my-10 p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white border border-zinc-700/50 shadow-xl relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Truck className="w-7 h-7" />
          </div>
          <div className="space-y-1 text-start">
            <h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
            <p className="text-sm text-zinc-300">{subtitle}</p>
          </div>
        </div>

        <Link
          to={actionUrl}
          className="inline-flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg transition"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{isArabic ? 'اطلب الآن عبر واتساب' : 'Order Now on WhatsApp'}</span>
        </Link>
      </div>
    </div>
  );
};
