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
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
        <ShoppingBag className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600" />
        <p className="mt-4 text-slate-600 dark:text-slate-400">Корзина пуста</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-xl bg-sky-500 px-6 py-3 font-medium text-white hover:bg-sky-600"
        >
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <ul className="space-y-4">
        {items.map(({ product, quantity }) => (
          <li
            key={product.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800/50"
          >
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700/50">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${product.slug}`}
                className="font-semibold text-slate-900 hover:text-sky-600 dark:text-white dark:hover:text-sky-400"
              >
                {product.name}
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400">{product.category}</p>
              <p className="mt-1 font-bold text-sky-600 dark:text-sky-400">{formatPrice(product.price)}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-600">
                <button
                  type="button"
                  onClick={() => setQuantity(product.id, quantity - 1)}
                  className="rounded-l-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label="Уменьшить"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2.5rem] text-center font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(product.id, quantity + 1)}
                  className="rounded-r-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label="Увеличить"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="w-20 text-right font-semibold">${product.price * quantity}</p>
              <button
                type="button"
                onClick={() => remove(product.id)}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                aria-label="Удалить"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="flex justify-between text-xl font-bold text-slate-900 dark:text-white">
          Итого: <span>{formatPrice(totalSum())}</span>
        </p>
        <Link
          href="/checkout"
          className="mt-4 block w-full rounded-xl bg-sky-500 py-3 text-center font-medium text-white hover:bg-sky-600 transition-colors"
        >
          Оформить заказ
        </Link>
      </div>
    </div>
  );
}
