import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product, Category } from '../../types/index.js';
import { productsApi, categoriesApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { getLocalized } from '../../utils/formatters.js';
import { ProductCard } from '../../components/storefront/ProductCard.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { ChevronRight } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isArabic } = useTheme();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);

    Promise.all([categoriesApi.getBySlug(slug), productsApi.getAll({ category: slug, limit: 24 })])
      .then(([catData, prodData]) => {
        setCategory(catData);
        setProducts(prodData.items);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return <LoadingState message={isArabic ? 'جاري التحميل...' : 'Loading category...'} />;
  }

  if (!category) {
    return (
      <EmptyState
        title={isArabic ? 'القسم غير موجود' : 'Category Not Found'}
        message={
          isArabic ? 'لم نتمكن من العثور على هذا القسم.' : 'The requested category does not exist.'
        }
      />
    );
  }

  const title = getLocalized(category.nameAr, category.nameEn, isArabic);
  const desc = getLocalized(category.descriptionAr, category.descriptionEn, isArabic);

  return (
    <div className="space-y-8 pb-16 text-start">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-zinc-500">
        <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          {isArabic ? 'الرئيسية' : 'Home'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <Link to="/shop" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          {isArabic ? 'المنتجات' : 'Shop'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <span className="font-bold text-zinc-900 dark:text-zinc-100">{title}</span>
      </div>

      {/* Category Header */}
      <div className="p-8 sm:p-12 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        {desc && (
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
            {desc}
          </p>
        )}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <EmptyState
          title={
            isArabic ? 'لا توجد منتجات في هذا القسم حالياً' : 'No products in this category yet'
          }
          message={
            isArabic
              ? 'ترقبوا تشكيلاتنا الجديدة قريباً!'
              : 'Stay tuned for new arrivals coming soon!'
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
};
