'use client';

import { clsx } from 'clsx';
import { Search, ChevronDown, SlidersHorizontal } from 'lucide-react';

export type SortOption = 'price-asc' | 'price-desc' | 'rating-desc' | 'name';

interface FiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'price-asc', label: 'Цена: по возрастанию' },
  { value: 'price-desc', label: 'Цена: по убыванию' },
  { value: 'rating-desc', label: 'По рейтингу' },
  { value: 'name', label: 'По названию' },
];

export function Filters({
  categories,
  selectedCategory,
  onCategoryChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
}: FiltersProps) {
  const hasActiveFilters = selectedCategory !== '' || search.trim() !== '';

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-700/60 dark:bg-slate-800/50">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-slate-700/60">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <SlidersHorizontal className="h-4 w-4 text-sky-500" aria-hidden="true" />
          Фильтры
        </div>
        {hasActiveFilters && (
          <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white">
            активны
          </span>
        )}
      </div>

      <div className="space-y-5 p-4">
        <div>
          <label htmlFor="search" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Поиск
          </label>
          <div className="relative mt-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
            <input
              id="search"
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Название товара..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-800"
            />
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Категория
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onCategoryChange('')}
              className={clsx(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150',
                selectedCategory === ''
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm shadow-sky-500/30 ring-2 ring-sky-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
              )}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150',
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm shadow-sky-500/30 ring-2 ring-sky-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="sort" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Сортировка
          </label>
          <div className="relative mt-2">
            <select
              id="sort"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-9 text-sm text-slate-900 transition-colors focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-500 dark:focus:bg-slate-800"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
