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
          'fixed inset-0 z-50 bg-black/40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={close}
        aria-hidden
      />
      <aside
        className={clsx(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-900',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="Корзина"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Корзина {totalCount() > 0 && `(${totalCount()})`}
            </h2>
            <button
              type="button"
              onClick={close}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-slate-500 dark:text-slate-400">Корзина пуста</p>
                <Link
                  href="/products"
                  onClick={close}
                  className="mt-4 text-sky-600 font-medium hover:underline dark:text-sky-400"
                >
                  Перейти в каталог
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {items.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white dark:bg-slate-700">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-white line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                        {formatPrice(product.price)}
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQuantity(product.id, quantity - 1)}
                          className="rounded bg-slate-200 p-1 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"
                          aria-label="Уменьшить"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(product.id, quantity + 1)}
                          className="rounded bg-slate-200 p-1 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"
                          aria-label="Увеличить"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(product.id)}
                          className="ml-2 text-xs text-red-600 hover:underline dark:text-red-400"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {items.length > 0 && (
            <div className="border-t border-slate-200 p-4 dark:border-slate-700">
              <p className="flex justify-between text-lg font-semibold text-slate-900 dark:text-white">
                Итого: <span>{formatPrice(totalSum())}</span>
              </p>
              <Link
                href="/cart"
                onClick={close}
                className="mt-3 block w-full rounded-xl bg-sky-500 py-3 text-center font-medium text-white hover:bg-sky-600 transition-colors"
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
