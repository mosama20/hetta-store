import React from 'react';
import { Link } from 'react-router-dom';
import { CMSSection } from '../../types/index.js';
import { useTheme } from '../../store/themeStore.js';
import { getLocalized } from '../../utils/formatters.js';
import { Button } from '../common/Button.js';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CmsHeroSlider: React.FC<{ section: CMSSection }> = ({ section }) => {
  const { isArabic } = useTheme();

  const title = getLocalized(section.titleAr, section.titleEn, isArabic);
  const subtitle = getLocalized(section.subtitleAr, section.subtitleEn, isArabic);
  const slides =
    (section.payload?.slides as Array<{
      image?: string;
      ctaTextAr?: string;
      ctaTextEn?: string;
      ctaLink?: string;
      badgeAr?: string;
      badgeEn?: string;
    }>) || [];
  const activeSlide = slides[0];

  const bgImage =
    activeSlide?.image ||
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85';
  const ctaText =
    getLocalized(activeSlide?.ctaTextAr, activeSlide?.ctaTextEn, isArabic) ||
    (isArabic ? 'تسوق المجموعة' : 'Explore Collection');
  const badge =
    getLocalized(activeSlide?.badgeAr, activeSlide?.badgeEn, isArabic) ||
    (isArabic ? 'تشكيلة 2026 الحصرية' : '2026 Exclusive Drop');

  return (
    <section className="relative w-full h-[520px] sm:h-[600px] lg:h-[680px] overflow-hidden rounded-3xl my-6 bg-zinc-950 flex items-center shadow-2xl">
      {/* Background Image with Gradient Overlay */}
      <img
        src={bgImage}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-60 scale-100 hover:scale-105 transition-transform duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 w-full text-start">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            {title}
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 font-normal leading-relaxed">
            {subtitle}
          </p>

          <div className="pt-2">
            <Link to={activeSlide?.ctaLink || '/shop'}>
              <Button variant="gold" size="lg" className="shadow-xl">
                <span>{ctaText}</span>
                <ArrowRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
