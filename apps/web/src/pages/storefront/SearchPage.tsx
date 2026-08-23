import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../../types/index.js';
import { productsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { ProductCard } from '../../components/storefront/ProductCard.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { EmptyState } from '../../components/common/EmptyState.js';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { isArabic } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    productsApi
      .getAll({ search: query, limit: 30 })
      .then((res) => {
        setProducts(res.items);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [query]);

  return (
    <div className="space-y-8 pb-16 text-start">
      <div className="py-6 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
          {isArabic ? `نتائج البحث عن: "${query}"` : `Search Results for: "${query}"`}
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          {isArabic
            ? `تم العثور على ${products.length} منتج`
            : `Found ${products.length} matching products`}
        </p>
      </div>

      {isLoading ? (
        <LoadingState message={isArabic ? 'جاري البحث في المنتجات...' : 'Searching...'} />
      ) : products.length === 0 ? (
        <EmptyState
          title={isArabic ? 'لم يتم العثور على نتائج' : 'No matches found'}
          message={
            isArabic
              ? 'جرب البحث بكلمات أخرى أو تصفح الأقسام مباشرة.'
              : 'Try searching for something else or explore our shop.'
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
