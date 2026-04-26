'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cart-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { formatPrice } from '@/lib/config';
import { ShoppingBag, CheckCircle2, AlertCircle, ArrowRight, LogIn } from 'lucide-react';
import { checkout as apiCheckout, ApiError } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function CheckoutForm() {
  const { items, totalSum, clear } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    try {
      const order = await apiCheckout();
      setOrderId(order.id);
      setSubmitted(true);
      void clear();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ошибка при оформлении заказа');
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !submitted) {
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
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 font-medium text-white shadow-md shadow-sky-500/30 transition-all hover:shadow-lg hover:shadow-sky-500/40 hover:brightness-110 active:scale-[0.98]"
        >
          Перейти в каталог
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card dark:border-slate-700/60 dark:bg-slate-800/50">
        <div className="relative bg-gradient-to-br from-emerald-50 to-white px-8 pb-8 pt-10 text-center dark:from-emerald-950/30 dark:to-slate-800/50">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
            Заказ принят!
          </h2>
          <p className="mt-1 font-mono text-sm text-slate-500 dark:text-slate-400">
            #{orderId}
          </p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Вы можете отслеживать статус заказа в личном кабинете.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 font-medium text-white shadow-md shadow-sky-500/30 transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
            >
              Мои заказы
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              На главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
      {/* Order summary */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-700/60 dark:bg-slate-800/50">
        <div className="border-b border-slate-200/80 px-6 py-4 dark:border-slate-700/60">
          <h2 className="font-semibold text-slate-900 dark:text-white">Состав заказа</h2>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="flex items-center justify-between gap-4 px-6 py-3.5 text-sm">
              <span className="min-w-0 flex-1 text-slate-700 dark:text-slate-300 truncate">
                {product.name}
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                × {quantity}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatPrice(product.price * quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Payment summary */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-700/60 dark:bg-slate-800/50">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Сводка</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Товаров</dt>
              <dd className="font-medium tabular-nums text-slate-900 dark:text-white">{items.length}</dd>
            </div>
          </dl>

          <div className="my-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />

          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">К оплате</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatPrice(totalSum())}
            </span>
          </div>

          {!isLoggedIn && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
              <LogIn className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Необходимо{' '}
                <Link href="/auth" className="font-semibold underline underline-offset-2 hover:no-underline">
                  войти в аккаунт
                </Link>
              </span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 py-3 font-semibold text-white shadow-md shadow-sky-500/30 transition-all hover:shadow-lg hover:shadow-sky-500/40 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Оформление...' : 'Подтвердить заказ'}
          </button>
        </div>
      </aside>
    </form>
  );
}
