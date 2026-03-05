'use client';

import { useMemo, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Filters, type SortOption } from '@/components/Filters';
import type { Product } from '@/lib/types';

interface ProductsClientProps {
  initialProducts: Product[];
  categories: string[];
  initialCategory: string;
  initialSort: SortOption;
  initialSearch: string;
}

export function ProductsClient({
  initialProducts,
  categories,
  initialCategory,
  initialSort,
  initialSearch,
}: ProductsClientProps) {
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [search, setSearch] = useState(initialSearch);

  const filtered = useMemo(() => {
    let list = initialProducts;
    if (category) {
      list = list.filter((p) => p.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'rating-desc':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    return sorted;
  }, [initialProducts, category, search, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Каталог</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Найдено товаров: {filtered.length}
      </p>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <div className="lg:w-64 shrink-0">
          <Filters
            categories={categories}
            selectedCategory={category}
            onCategoryChange={setCategory}
            sort={sort}
            onSortChange={setSort}
            search={search}
            onSearchChange={setSearch}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-slate-500 dark:text-slate-400">
              По вашему запросу ничего не найдено. Попробуйте изменить фильтры.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
