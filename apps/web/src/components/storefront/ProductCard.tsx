import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, Sparkles } from 'lucide-react';
import { Product } from '../../types/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, getLocalized } from '../../utils/formatters.js';

export interface ProductCardProps {
  product: Product;
  badgeType?: 'bestseller' | 'new' | 'sale' | 'featured';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, badgeType }) => {
  const { isArabic } = useTheme();
  const [isLiked, setIsLiked] = useState(false);

  const title = getLocalized(product.nameAr, product.nameEn, isArabic);
  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url;
  const secondaryImage =
    product.images?.find((img) => !img.isPrimary && img.url !== primaryImage)?.url ||
    (product.images && product.images.length > 1 ? product.images[1].url : null);

  const price = Number(product.basePrice);
  const firstVariant = product.variants?.[0];
  const compareAt = firstVariant?.compareAtPrice ? Number(firstVariant.compareAtPrice) : undefined;
  const hasDiscount = compareAt !== undefined && compareAt > price;
  const discountPercent = hasDiscount ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  // Extract unique variant colors
  const uniqueColors = Array.from(
    new Map(
      product.variants
        ?.filter((v) => v.color && v.color.hexCode)
        .map((v) => [v.color.id, v.color]) || []
    ).values()
  );

  const isBestSeller = badgeType === 'bestseller' || product.isFeatured;

  return (
    <div className="group relative flex flex-col text-center space-y-3">
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#f4f4f4] dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/80 transition-all duration-300 group-hover:shadow-lg group-hover:border-zinc-300 dark:group-hover:border-zinc-700 flex items-center justify-center">
        <Link to={`/product/${product.slug}`} className="block w-full h-full relative">
          {primaryImage ? (
            <>
              {/* Primary Image */}
              <img
                src={primaryImage}
                alt={title}
                loading="lazy"
                className={`w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-105 ${
                  secondaryImage ? 'group-hover:opacity-0' : ''
                }`}
              />

              {/* Secondary Hover Image (Editorial Crossfade) */}
              {secondaryImage && (
                <img
                  src={secondaryImage}
                  alt={`${title} - view 2`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out group-hover:scale-105"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 p-4 space-y-2">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              <span className="text-[11px] font-bold text-zinc-500">{title}</span>
            </div>
          )}

          {/* Subtle Quick View Overlay on Desktop */}
          <div className="absolute inset-x-3 bottom-3 z-10 hidden sm:flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <span className="w-full py-2.5 px-4 rounded-xl bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 backdrop-blur-md text-xs font-bold shadow-lg border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center gap-1.5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
              <Eye className="w-3.5 h-3.5" />
              <span>{isArabic ? 'تفاصيل الموديل' : 'Quick View'}</span>
            </span>
          </div>
        </Link>

        {/* Top Badges (Best Seller & Discounts) */}
        <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 flex flex-col gap-1.5 pointer-events-none z-10">
          {isBestSeller && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-black text-[10px] font-black uppercase rounded-lg shadow-md tracking-wider">
              <Sparkles className="w-3 h-3 fill-black" />
              <span>{isArabic ? 'الأكثر طلباً' : 'HOT'}</span>
            </span>
          )}

          {hasDiscount && discountPercent > 0 && (
            <span className="px-2 py-1 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black rounded-lg shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Wishlist Heart Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsLiked(!isLiked);
          }}
          className={`absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 p-2 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md shadow-sm transition duration-200 z-10 ${
            isLiked
              ? 'text-red-500 scale-110'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:scale-105'
          }`}
          aria-label={isArabic ? 'إضافة للمفضلة' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500' : ''}`} />
        </button>
      </div>

      {/* Product Info */}
      <div className="space-y-1.5 px-0.5">
        {/* Colors Preview Dots */}
        {uniqueColors.length > 0 && (
          <div className="flex items-center justify-center gap-1 py-0.5">
            {uniqueColors.slice(0, 4).map((col) => (
              <span
                key={col.id}
                className="w-2.5 h-2.5 rounded-full border border-black/15 dark:border-white/20 shadow-xs"
                style={{ backgroundColor: col.hexCode }}
                title={getLocalized(col.nameAr, col.nameEn, isArabic)}
              />
            ))}
            {uniqueColors.length > 4 && (
              <span className="text-[9px] text-zinc-400 font-bold">
                +{uniqueColors.length - 4}
              </span>
            )}
          </div>
        )}

        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
            {title}
          </h3>
        </Link>

        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-xs sm:text-sm">
          <span className="font-black text-zinc-900 dark:text-zinc-100">
            {formatPrice(price, 'EGP', isArabic)}
          </span>
          {hasDiscount && compareAt && (
            <span className="text-zinc-400 line-through text-[11px]">
              {formatPrice(compareAt, 'EGP', isArabic)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
