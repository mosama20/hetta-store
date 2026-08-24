import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product, Color, Size } from '../../types/index.js';
import { productsApi } from '../../api/index.js';
import { useCart } from '../../store/cartStore.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, getLocalized } from '../../utils/formatters.js';
import { Button } from '../../components/common/Button.js';
import { Badge } from '../../components/common/Badge.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { ProductCard } from '../../components/storefront/ProductCard.js';
import { SizeGuideModal } from '../../components/storefront/SizeGuideModal.js';
import { ShoppingBag, Check, ShieldCheck, Truck, RefreshCw, ChevronRight, Ruler } from 'lucide-react';
import { analyticsTracker } from '../../utils/analyticsTracker.js';

export const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isArabic } = useTheme();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdded, setIsAdded] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const loadProduct = () => {
    if (!slug) return;
    setIsLoading(true);
    productsApi
      .getBySlug(slug)
      .then((data) => {
        setProduct(data);
        analyticsTracker.trackViewProduct(data);
        if (data.images.length > 0) {
          const primary = data.images.find((img) => img.isPrimary) || data.images[0];
          setSelectedImage(primary.url);
        }
        // Auto-select first active variant options
        const activeVariants = data.variants.filter((v) => v.isActive);
        if (activeVariants.length > 0) {
          setSelectedColorId(activeVariants[0].colorId);
          setSelectedSizeId(activeVariants[0].sizeId);
        }
        setIsLoading(false);

        // Fetch related products from same category
        if (data.category?.slug || data.categoryId) {
          productsApi
            .getAll({ category: data.category?.slug || data.categoryId, limit: 5 })
            .then((res) => {
              setRelatedProducts(res.items.filter((p) => p.id !== data.id).slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <LoadingState
        message={isArabic ? 'جاري تحميل تفاصيل المنتج...' : 'Loading product details...'}
      />
    );
  }

  if (!product) {
    return (
      <EmptyState
        title={isArabic ? 'المنتج غير متوفر' : 'Product Not Found'}
        message={
          isArabic
            ? 'لم نتمكن من العثور على المنتج المطلوب.'
            : 'The requested product could not be found.'
        }
      />
    );
  }

  const title = getLocalized(product.nameAr, product.nameEn, isArabic);
  const description = getLocalized(product.descriptionAr, product.descriptionEn, isArabic);

  // Extract distinct colors and sizes
  const activeVariants = product.variants.filter((v) => v.isActive);
  const colorMap = new Map<string, Color>();
  const sizeMap = new Map<string, Size>();

  activeVariants.forEach((v) => {
    colorMap.set(v.color.id, v.color);
    sizeMap.set(v.size.id, v.size);
  });

  const availableColors = Array.from(colorMap.values());
  const availableSizes = Array.from(sizeMap.values());

  // Find currently matched variant
  const currentVariant = activeVariants.find(
    (v) => v.colorId === selectedColorId && v.sizeId === selectedSizeId,
  );

  const price = currentVariant ? Number(currentVariant.price) : Number(product.basePrice);
  const compareAt = currentVariant?.compareAtPrice;
  const stock = currentVariant ? currentVariant.stockQuantity : 0;
  const isOutOfStock = !currentVariant || stock <= 0;

  const handleAddToCart = () => {
    if (!currentVariant || isOutOfStock) return;
    const color = colorMap.get(selectedColorId)!;
    const size = sizeMap.get(selectedSizeId)!;
    addItem(product, currentVariant, color, size, quantity);
    analyticsTracker.trackAddToCart({
      variantId: currentVariant.id,
      product,
      variant: currentVariant,
      selectedColor: color,
      selectedSize: size,
      quantity,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="space-y-12 pb-20 text-start">
      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-zinc-500">
        <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          {isArabic ? 'الرئيسية' : 'Home'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        {product.category && (
          <>
            <Link
              to={`/category/${product.category.slug}`}
              className="hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {getLocalized(product.category.nameAr, product.category.nameEn, isArabic)}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </>
        )}
        <span className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[3/4] w-full rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg flex items-center justify-center">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={title}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-400 p-8 space-y-2">
                <ShoppingBag className="w-16 h-16 stroke-[1.5]" />
                <span className="text-sm font-bold text-zinc-500">{title}</span>
              </div>
            )}
          </div>

          {/* Thumbnail row */}
          {product.images.length > 1 && (
            <div className="flex space-x-3 rtl:space-x-reverse overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 transition ${
                    selectedImage === img.url
                      ? 'border-zinc-900 dark:border-zinc-100 scale-95 shadow-md'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Purchase Form */}
        <div className="space-y-6 flex flex-col justify-start">
          <div className="space-y-2">
            {product.category && (
              <span className="text-xs font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                {getLocalized(product.category.nameAr, product.category.nameEn, isArabic)}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
              {title}
            </h1>
          </div>

          {/* Pricing */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse py-2 border-y border-zinc-100 dark:border-zinc-800">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {formatPrice(price, 'EGP', isArabic)}
            </span>
            {compareAt && compareAt > price && (
              <span className="text-base text-zinc-400 line-through">
                {formatPrice(compareAt, 'EGP', isArabic)}
              </span>
            )}
            {compareAt && compareAt > price && (
              <Badge variant="danger">
                {Math.round(((compareAt - price) / compareAt) * 100)}% OFF
              </Badge>
            )}
          </div>

          {/* Color Selection */}
          {availableColors.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {isArabic ? 'اللون المختار' : 'Select Color'}
              </label>
              <div className="flex flex-wrap gap-3">
                {availableColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => {
                      setSelectedColorId(color.id);
                    }}
                    className={`flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                      selectedColorId === color.id
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900 shadow-md'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-inner"
                      style={{ backgroundColor: color.hexCode }}
                    />
                    <span>{getLocalized(color.nameAr, color.nameEn, isArabic)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection + Size Guide Modal Trigger */}
          {availableSizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {isArabic ? 'المقاس' : 'Select Size'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'دليل المقاسات' : 'Size Guide'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {availableSizes.map((size) => {
                  const sizeVariant = activeVariants.find(
                    (v) => v.colorId === selectedColorId && v.sizeId === size.id,
                  );
                  const isSizeAvailable = sizeVariant && sizeVariant.stockQuantity > 0;

                  return (
                    <button
                      key={size.id}
                      disabled={!isSizeAvailable}
                      onClick={() => setSelectedSizeId(size.id)}
                      className={`min-w-12 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedSizeId === size.id
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900 shadow-md'
                          : isSizeAvailable
                            ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                            : 'border-dashed border-zinc-300 dark:border-zinc-800 opacity-40 cursor-not-allowed line-through'
                      }`}
                    >
                      {size.nameEn}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock & SKU Info */}
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 py-1">
            <span>{currentVariant?.sku ? `SKU: ${currentVariant.sku}` : ''}</span>
            <span>
              {isOutOfStock ? (
                <span className="text-red-500 font-bold">
                  {isArabic ? 'غير متوفر بالمخزون' : 'Out of stock'}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isArabic ? `متوفر في المخزن (${stock} قطع)` : `In stock (${stock} available)`}
                </span>
              )}
            </span>
          </div>

          {/* Quantity and Add to Cart button */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse pt-2">
            <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
              <button
                disabled={quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3.5 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold disabled:opacity-40 transition"
              >
                -
              </button>
              <span className="px-4 py-3 font-extrabold text-sm min-w-10 text-center">
                {quantity}
              </span>
              <button
                disabled={quantity >= stock}
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                className="px-3.5 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold disabled:opacity-40 transition"
              >
                +
              </button>
            </div>

            <Button
              variant={isAdded ? 'secondary' : 'primary'}
              size="lg"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="flex-1 shadow-lg"
            >
              {isAdded ? (
                <span className="flex items-center space-x-2 rtl:space-x-reverse text-emerald-600 font-bold">
                  <Check className="w-5 h-5" />
                  <span>{isArabic ? 'تمت الإضافة للسلة!' : 'Added to Cart!'}</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2 rtl:space-x-reverse">
                  <ShoppingBag className="w-5 h-5" />
                  <span>
                    {isOutOfStock
                      ? isArabic
                        ? 'نفذت الكمية'
                        : 'Sold Out'
                      : isArabic
                        ? 'أضف إلى السلة'
                        : 'Add to Cart'}
                  </span>
                </span>
              )}
            </Button>
          </div>

          {/* Description */}
          {description && (
            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                {isArabic ? 'تفاصيل المنتج والخامة' : 'Product Details & Fabric'}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Confidence Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl space-y-1">
              <ShieldCheck className="w-5 h-5 text-amber-500 mx-auto" />
              <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                {isArabic ? 'قطن مصري 100%' : '100% Cotton'}
              </p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl space-y-1">
              <Truck className="w-5 h-5 text-amber-500 mx-auto" />
              <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                {isArabic ? 'توصيل سريع' : 'Fast Delivery'}
              </p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl space-y-1">
              <RefreshCw className="w-5 h-5 text-amber-500 mx-auto" />
              <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                {isArabic ? 'معاينة عند الاستلام' : 'Inspect on Delivery'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-10 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'منتجات قد تنال إعجابك' : 'You May Also Like'}
            </h2>
            <Link
              to="/shop"
              className="text-xs font-bold text-amber-600 hover:text-amber-500 transition"
            >
              {isArabic ? 'عرض المزيد' : 'View More'}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
