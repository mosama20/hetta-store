import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Product, Category, Color, Size } from '../../types/index.js';
import { productsApi, categoriesApi, attributesApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { useStoreSettings } from '../../store/settingsStore.js';
import { getLocalized } from '../../utils/formatters.js';
import { ProductCard } from '../../components/storefront/ProductCard.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { Pagination } from '../../components/common/Pagination.js';
import { Select } from '../../components/common/Select.js';
import { Input } from '../../components/common/Input.js';
import { Sparkles, SlidersHorizontal, RotateCcw, Flame, Check } from 'lucide-react';

export const NewArrivalsPage: React.FC = () => {
  const { isArabic } = useTheme();
  const { settings } = useStoreSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const currentPage = Number(searchParams.get('page')) || 1;
  const categoryFilter = searchParams.get('category') || '';
  const colorFilter = searchParams.get('colorId') || '';
  const sizeFilter = searchParams.get('sizeId') || '';
  const searchFilter = searchParams.get('search') || '';
  const minPriceFilter = searchParams.get('minPrice') || '';
  const maxPriceFilter = searchParams.get('maxPrice') || '';
  const inStockFilter = searchParams.get('inStock') === 'true';
  const onlyFeatured = searchParams.get('featured') === 'true';
  const sortBy =
    (searchParams.get('sortBy') as 'newest' | 'price_asc' | 'price_desc' | 'popular') || 'newest';

  const loadData = () => {
    setIsLoading(true);
    productsApi
      .getAll({
        page: currentPage,
        limit: 12,
        category: categoryFilter || undefined,
        colorId: colorFilter || undefined,
        sizeId: sizeFilter || undefined,
        search: searchFilter || undefined,
        minPrice: minPriceFilter ? Number(minPriceFilter) : undefined,
        maxPrice: maxPriceFilter ? Number(maxPriceFilter) : undefined,
        inStock: inStockFilter ? true : undefined,
        isFeatured: onlyFeatured ? true : undefined,
        sortBy,
      })
      .then((res) => {
        setProducts(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    Promise.all([categoriesApi.getAll(), attributesApi.getColors(), attributesApi.getSizes()])
      .then(([cats, cols, szs]) => {
        setCategories(cats);
        setColors(cols);
        setSizes(szs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [
    currentPage,
    categoryFilter,
    colorFilter,
    sizeFilter,
    searchFilter,
    minPriceFilter,
    maxPriceFilter,
    inStockFilter,
    onlyFeatured,
    sortBy,
  ]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const storeName = isArabic
    ? settings.store_name_ar || 'متجرنا'
    : settings.store_name_en || 'Our Store';

  return (
    <div className="space-y-8 pb-16 text-start">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-zinc-50 to-zinc-100 dark:from-amber-950/20 dark:via-zinc-900 dark:to-zinc-950 p-6 sm:p-10 border border-amber-500/20 dark:border-zinc-800">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 fill-amber-500" />
            <span>{isArabic ? 'وصل حديثاً' : 'JUST IN / NEW DROPS'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            {isArabic ? `جديدنا في ${storeName}` : `New Arrivals at ${storeName}`}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
            {isArabic
              ? 'اكتشف أحدث التصاميم والقطع الحصرية المضافة حديثاً بأعلى جودة وخامات فاخرة تواكب أرقى صيحات الموضة.'
              : 'Explore our latest fashion drops and exclusive pieces crafted with premium fabric standards.'}
          </p>

          <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-zinc-500">
            <span>{isArabic ? `المعروض حالياً: ${total} قطعة جديدة` : `Showing: ${total} new items`}</span>
          </div>
        </div>
      </div>

      {/* 2. Content & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="space-y-6 lg:border-r rtl:lg:border-r-0 rtl:lg:border-l border-zinc-200 dark:border-zinc-800 lg:pr-6 rtl:lg:pr-0 rtl:lg:pl-6 text-start">
          <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <SlidersHorizontal className="w-4 h-4" />
              <span>{isArabic ? 'تصفية جديدنا' : 'Filter New In'}</span>
            </div>
            {(categoryFilter ||
              colorFilter ||
              sizeFilter ||
              searchFilter ||
              minPriceFilter ||
              maxPriceFilter ||
              inStockFilter ||
              onlyFeatured) && (
              <button
                onClick={resetFilters}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1 rtl:space-x-reverse"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isArabic ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            )}
          </div>

          {/* Quick Tab: Featured Stars Only */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => updateParam('featured', onlyFeatured ? '' : 'true')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border transition text-xs font-bold ${
                onlyFeatured
                  ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 shadow-sm'
                  : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-amber-400'
              }`}
            >
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>{isArabic ? 'القطع الأكثر تميزاً فقط ⭐' : 'Featured Drops Only ⭐'}</span>
              </span>
              {onlyFeatured && <Check className="w-4 h-4 text-amber-500" />}
            </button>
          </div>

          {/* Search input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
              {isArabic ? 'بحث في جديدنا' : 'Search New In'}
            </label>
            <Input
              placeholder={isArabic ? 'اسم الموديل...' : 'Search item...'}
              value={searchFilter}
              onChange={(e) => updateParam('search', e.target.value)}
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                {isArabic ? 'الأقسام' : 'Categories'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => updateParam('category', '')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    !categoryFilter
                      ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {isArabic ? 'الكل' : 'All'}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParam('category', cat.slug)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      categoryFilter === cat.slug
                        ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {getLocalized(cat.nameAr, cat.nameEn, isArabic)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color filter */}
          {colors.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                {isArabic ? 'اللون' : 'Color'}
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => updateParam('colorId', colorFilter === c.id ? '' : c.id)}
                    className={`flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 rounded-xl text-xs font-medium border transition ${
                      colorFilter === c.id
                        ? 'border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: c.hexCode }}
                    />
                    <span>{getLocalized(c.nameAr, c.nameEn, isArabic)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Filter */}
          {sizes.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                {isArabic ? 'المقاس' : 'Size'}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateParam('sizeId', sizeFilter === s.id ? '' : s.id)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                      sizeFilter === s.id
                        ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {s.nameAr || s.nameEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
              {isArabic ? 'نطاق السعر (ج.م)' : 'Price Range (EGP)'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={isArabic ? 'من' : 'Min'}
                value={minPriceFilter}
                onChange={(e) => updateParam('minPrice', e.target.value)}
              />
              <Input
                type="number"
                placeholder={isArabic ? 'إلى' : 'Max'}
                value={maxPriceFilter}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
              />
            </div>
          </div>

          {/* In Stock Toggle */}
          <div className="pt-2">
            <label className="flex items-center space-x-2.5 rtl:space-x-reverse cursor-pointer">
              <input
                type="checkbox"
                checked={inStockFilter}
                onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded text-black accent-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {isArabic ? 'المتوفر في المخزون فقط' : 'In Stock Only'}
              </span>
            </label>
          </div>
        </aside>

        {/* Products Grid Section */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Sort & Count Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {isArabic ? `تم العثور على ${total} منتج` : `Showing ${total} items`}
            </div>

            <div className="flex items-center space-x-3 rtl:space-x-reverse self-end sm:self-auto">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {isArabic ? 'ترتيب حسب:' : 'Sort by:'}
              </span>
              <div className="w-44">
                <Select
                  value={sortBy}
                  onChange={(e) => updateParam('sortBy', e.target.value)}
                  options={[
                    { value: 'newest', label: isArabic ? 'الأحدث أولاً (افتراضي)' : 'Newest First' },
                    { value: 'popular', label: isArabic ? 'الأكثر طلباً' : 'Most Popular' },
                    { value: 'price_asc', label: isArabic ? 'السعر: من الأقل للأعلى' : 'Price: Low to High' },
                    { value: 'price_desc', label: isArabic ? 'السعر: من الأعلى للأقل' : 'Price: High to Low' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Grid or Empty / Loading States */}
          {isLoading ? (
            <LoadingState message={isArabic ? 'جاري تحميل أحدث المنتجات...' : 'Loading new arrivals...'} />
          ) : products.length === 0 ? (
            <EmptyState
              title={isArabic ? 'لا توجد منتجات جديدة تطابق الفلترة' : 'No new arrivals found'}
              message={
                isArabic
                  ? 'جرب تقليل أو تغيير الفلاتر المحددة لمشاهدة باقي المنتجات'
                  : 'Try clearing some filters to explore more items'
              }
              actionLabel={isArabic ? 'إعادة ضبط الفلاتر' : 'Clear Filters'}
              onAction={resetFilters}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => updateParam('page', page.toString())}
          />
        </div>
      </div>
    </div>
  );
};
