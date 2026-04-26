'use client';

import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/lib/config';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';

export function CartDrawer() {
  const { items, isOpen, close, setQuantity, remove, totalSum, totalCount } = useCartStore();

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={close}
        aria-hidden
      />
      <aside
        className={clsx(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-slate-700/60 dark:bg-slate-900',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="Корзина"
      >
        <div className="flex h-full flex-col">
          <div className="relative flex items-center justify-between overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-sky-50 via-white to-white px-5 py-4 dark:border-slate-700/60 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900">
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-400/20 blur-2xl dark:bg-sky-500/10" />
            <div className="relative flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-md shadow-sky-500/30">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="leading-tight">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Корзина</h2>
                {totalCount() > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {totalCount()} {totalCount() === 1 ? 'товар' : totalCount() < 5 ? 'товара' : 'товаров'}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700/60">
                  <ShoppingBag className="h-9 w-9 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                </div>
                <p className="mt-4 font-medium text-slate-700 dark:text-slate-200">Корзина пуста</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Самое время выбрать что-то особенное
                </p>
                <Link
                  href="/products"
                  onClick={close}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-sky-500/30 transition-all hover:shadow-lg hover:shadow-sky-500/40 hover:brightness-110 active:scale-[0.98]"
                >
                  Перейти в каталог
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="group flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:border-sky-300/60 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/50 dark:hover:border-sky-500/30"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/40 dark:to-slate-800/60">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug text-slate-900 dark:text-white line-clamp-2">
                          {product.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => { void remove(product.id); }}
                          className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          aria-label={`Удалить ${product.name}`}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-sm font-bold text-sky-600 dark:text-sky-400">
                        {formatPrice(product.price)}
                      </p>
                      <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={() => { void setQuantity(product.id, quantity - 1); }}
                          className="flex h-7 w-7 items-center justify-center rounded-l-full text-slate-600 transition-colors hover:bg-slate-200 hover:text-sky-600 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-sky-400"
                          aria-label="Уменьшить"
                        >
                          <Minus className="h-3 w-3" aria-hidden="true" />
                        </button>
                        <span className="min-w-[1.75rem] text-center text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => { void setQuantity(product.id, quantity + 1); }}
                          className="flex h-7 w-7 items-center justify-center rounded-r-full text-slate-600 transition-colors hover:bg-slate-200 hover:text-sky-600 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-sky-400"
                          aria-label="Увеличить"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {items.length > 0 && (
            <div className="border-t border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 p-5 dark:border-slate-700/60 dark:from-slate-900 dark:to-slate-900/80">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Итого</span>
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatPrice(totalSum())}
                </span>
              </div>
              <Link
                href="/cart"
                onClick={close}
                className="mt-4 block w-full rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 py-3 text-center font-medium text-white shadow-md shadow-sky-500/30 transition-all hover:shadow-lg hover:shadow-sky-500/40 hover:brightness-110 active:scale-[0.99]"
              >
                Перейти к оформлению
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
