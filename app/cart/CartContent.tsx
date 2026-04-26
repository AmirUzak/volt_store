'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/lib/config';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export function CartContent() {
  const { items, setQuantity, remove, totalSum } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-card dark:border-slate-700/60 dark:bg-slate-800/50">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
          <ShoppingBag className="h-9 w-9 text-slate-400 dark:text-slate-500" aria-hidden="true" />
        </div>
        <p className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Корзина пуста</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Добавьте товары из каталога, чтобы оформить заказ
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 font-medium text-white shadow-md shadow-sky-500/30 transition-all hover:shadow-lg hover:shadow-sky-500/40 hover:brightness-110 active:scale-[0.98]"
        >
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
      <ul className="space-y-3">
        {items.map(({ product, quantity }) => (
          <li
            key={product.id}
            className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-all hover:border-sky-300/60 hover:shadow-card-hover sm:flex-row sm:items-center dark:border-slate-700/60 dark:bg-slate-800/50 dark:hover:border-sky-500/30"
          >
            <Link
              href={`/products/${product.slug}`}
              className="relative h-28 w-28 shrink-0 self-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 transition-transform duration-300 hover:scale-[1.03] dark:from-slate-700/40 dark:to-slate-800/60"
              aria-label={`Открыть ${product.name}`}
            >
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain p-2"
                unoptimized
              />
            </Link>
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700 ring-1 ring-inset ring-sky-200/70 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20">
                {product.category}
              </span>
              <Link
                href={`/products/${product.slug}`}
                className="mt-1.5 block font-semibold leading-snug text-slate-900 transition-colors hover:text-sky-600 dark:text-white dark:hover:text-sky-400"
              >
                {product.name}
              </Link>
              <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                {formatPrice(product.price)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center sm:gap-3">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => { void setQuantity(product.id, quantity - 1); }}
                  className="flex h-9 w-9 items-center justify-center rounded-l-full text-slate-600 transition-colors hover:bg-slate-200 hover:text-sky-600 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-sky-400"
                  aria-label="Уменьшить"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => { void setQuantity(product.id, quantity + 1); }}
                  className="flex h-9 w-9 items-center justify-center rounded-r-full text-slate-600 transition-colors hover:bg-slate-200 hover:text-sky-600 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-sky-400"
                  aria-label="Увеличить"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-right text-base font-bold tabular-nums text-sky-600 dark:text-sky-400">
                  ${product.price * quantity}
                </p>
                <button
                  type="button"
                  onClick={() => { void remove(product.id); }}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95 dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  aria-label={`Удалить ${product.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-700/60 dark:bg-slate-800/50">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Сводка</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Товаров</dt>
              <dd className="font-medium text-slate-900 tabular-nums dark:text-white">{items.length}</dd>
            </div>
          </dl>
          <div className="my-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Итого</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatPrice(totalSum())}
            </span>
          </div>
          <Link
            href="/checkout"
            className="mt-5 block w-full rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 py-3 text-center font-medium text-white shadow-md shadow-sky-500/30 transition-all hover:shadow-lg hover:shadow-sky-500/40 hover:brightness-110 active:scale-[0.99]"
          >
            Оформить заказ
          </Link>
        </div>
      </aside>
    </div>
  );
}
