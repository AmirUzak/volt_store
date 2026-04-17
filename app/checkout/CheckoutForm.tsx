'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cart-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { formatPrice } from '@/lib/config';
import { ShoppingBag } from 'lucide-react';
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

  if (submitted) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          ✓
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
          Заказ #{orderId} принят
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Вы можете отслеживать статус заказа в личном кабинете.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/profile"
            className="inline-block rounded-xl bg-sky-500 px-6 py-3 font-medium text-white hover:bg-sky-600"
          >
            Мои заказы
          </Link>
          <Link
            href="/"
            className="inline-block rounded-xl border border-slate-200 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {/* Order summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
        <h2 className="font-semibold text-slate-900 dark:text-white">Состав заказа</h2>
        <ul className="mt-4 space-y-3">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300">
                {product.name}
                <span className="ml-2 text-slate-400">× {quantity}</span>
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatPrice(product.price * quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="flex justify-between text-lg font-bold text-slate-900 dark:text-white">
          К оплате: <span>{formatPrice(totalSum())}</span>
        </p>

        {!isLoggedIn && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
            Для оформления заказа необходимо{' '}
            <Link href="/auth" className="underline hover:no-underline">
              войти в аккаунт
            </Link>
          </p>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-sky-500 py-3 font-medium text-white hover:bg-sky-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Оформление...' : 'Подтвердить заказ'}
        </button>
      </div>
    </form>
  );
}
