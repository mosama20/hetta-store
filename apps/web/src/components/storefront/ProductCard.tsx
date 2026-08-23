import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../../types/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, getLocalized } from '../../utils/formatters.js';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isArabic } = useTheme();
  const [isLiked, setIsLiked] = useState(false);

  const title = getLocalized(product.nameAr, product.nameEn, isArabic);
  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url;

  const price = Number(product.basePrice);
  const firstVariant = product.variants?.[0];
  const compareAt = firstVariant?.compareAtPrice ? Number(firstVariant.compareAtPrice) : undefined;
  const hasDiscount = compareAt !== undefined && compareAt > price;
  const discountPercent = hasDiscount ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  return (
    <div className="group relative flex flex-col text-center space-y-3">
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#f4f4f4] dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 transition duration-300 group-hover:shadow-md flex items-center justify-center">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 p-4 space-y-2">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              <span className="text-[11px] font-bold text-zinc-500">{title}</span>
            </div>
          )}
        </Link>

        {/* Discount Badge */}
        {hasDiscount && discountPercent > 0 && (
          <span className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-2 py-1 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black rounded-lg shadow-sm">
            -{discountPercent}%
          </span>
        )}

        {/* Wishlist Heart Icon */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`absolute top-3 right-3 rtl:right-auto rtl:left-3 p-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm transition ${
            isLiked ? 'text-red-500 scale-110' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
        </button>
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <Link to={`/product/${product.slug}`}>
          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:underline line-clamp-1">
            {title}
          </h3>
        </Link>

        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-xs sm:text-sm">
          <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
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
