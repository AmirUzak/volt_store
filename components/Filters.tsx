'use client';

import { clsx } from 'clsx';

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
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-800/50">
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Поиск
        </label>
        <input
          id="search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Название товара..."
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Категория
        </label>
        <div className="mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCategoryChange('')}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              selectedCategory === ''
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
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
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                selectedCategory === cat
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="sort" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Сортировка
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
