import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category, Color, Size } from '../../types/index.js';
import { productsApi, categoriesApi, attributesApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { getLocalized } from '../../utils/formatters.js';
import { ProductCard } from '../../components/storefront/ProductCard.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { Pagination } from '../../components/common/Pagination.js';
import { Select } from '../../components/common/Select.js';
import { Input } from '../../components/common/Input.js';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const { isArabic } = useTheme();
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
  }, [currentPage, categoryFilter, colorFilter, sizeFilter, searchFilter, minPriceFilter, maxPriceFilter, inStockFilter, sortBy]);


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

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="py-8 border-b border-zinc-200 dark:border-zinc-800 text-start">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          {isArabic ? 'تشكيلة الأزياء الكاملة' : 'All Fashion Collections'}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {isArabic ? `عرض ${total} منتج` : `Showing ${total} products`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="space-y-6 lg:border-r rtl:lg:border-r-0 rtl:lg:border-l border-zinc-200 dark:border-zinc-800 lg:pr-6 rtl:lg:pr-0 rtl:lg:pl-6 text-start">
          <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <SlidersHorizontal className="w-4 h-4" />
              <span>{isArabic ? 'تصفية المنتجات' : 'Filter Products'}</span>
            </div>
            <button
              onClick={resetFilters}
              className="text-[11px] font-normal text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isArabic ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          </div>

          {/* Search Filter */}
          <div>
            <Input
              label={isArabic ? 'البحث بالاسم' : 'Search by Name'}
              placeholder={isArabic ? 'اكتب للبحث...' : 'Search...'}
              value={searchFilter}
              onChange={(e) => updateParam('search', e.target.value)}
            />
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              {isArabic ? 'نطاق السعر (ج.م)' : 'Price Range (EGP)'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder={isArabic ? 'من' : 'Min'}
                value={minPriceFilter}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none"
              />
              <input
                type="number"
                placeholder={isArabic ? 'إلى' : 'Max'}
                value={maxPriceFilter}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none"
              />
            </div>
          </div>

          {/* In Stock Only Checkbox */}
          <div className="pt-1">
            <label className="flex items-center space-x-2.5 rtl:space-x-reverse cursor-pointer text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={inStockFilter}
                onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded text-black focus:ring-black border-zinc-300 dark:border-zinc-700"
              />
              <span>{isArabic ? 'المتوفر في المخزن فقط' : 'In Stock Only'}</span>
            </label>
          </div>

          {/* Category Filter */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              {isArabic ? 'القسم' : 'Category'}
            </label>
            <div className="space-y-1">
              <button
                onClick={() => updateParam('category', '')}
                className={`w-full text-start text-xs px-3 py-2 rounded-lg transition ${
                  !categoryFilter
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {isArabic ? 'جميع الأقسام' : 'All Categories'}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateParam('category', c.slug)}
                  className={`w-full text-start text-xs px-3 py-2 rounded-lg transition ${
                    categoryFilter === c.slug
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {getLocalized(c.nameAr, c.nameEn, isArabic)}
                </button>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          {colors.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {isArabic ? 'اللون' : 'Color'}
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => updateParam('colorId', colorFilter === col.id ? '' : col.id)}
                    className={`flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-lg text-xs border transition ${
                      colorFilter === col.id
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: col.hexCode }}
                    />
                    <span>{getLocalized(col.nameAr, col.nameEn, isArabic)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Filter */}
          {sizes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {isArabic ? 'المقاس' : 'Size'}
              </label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateParam('sizeId', sizeFilter === s.id ? '' : s.id)}
                    className={`min-w-9 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      sizeFilter === s.id
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    {s.nameEn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Product Catalog Grid */}
        <main className="lg:col-span-3 space-y-6">
          {/* Sorting Bar */}
          <div className="flex items-center justify-end pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-56">
              <Select
                value={sortBy}
                onChange={(e) => updateParam('sortBy', e.target.value)}
                options={[
                  { value: 'newest', label: isArabic ? 'الأحدث أولاً' : 'Newest' },
                  { value: 'popular', label: isArabic ? 'الأكثر مبيعاً وشعبية' : 'Most Popular' },
                  {
                    value: 'price_asc',
                    label: isArabic ? 'السعر: من الأقل للأعلى' : 'Price: Low to High',
                  },
                  {
                    value: 'price_desc',
                    label: isArabic ? 'السعر: من الأعلى للأقل' : 'Price: High to Low',
                  },
                ]}
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingState message={isArabic ? 'جاري تحميل المنتجات...' : 'Fetching products...'} />
          ) : products.length === 0 ? (
            <EmptyState
              title={isArabic ? 'لا توجد منتجات مطابقة' : 'No products found'}
              message={
                isArabic
                  ? 'جرب تغيير معايير التصفية والبحث أو إعادة ضبط الفلاتر.'
                  : 'Try adjusting your filters or search term.'
              }
              actionLabel={isArabic ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              onAction={resetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => updateParam('page', String(page))}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};
