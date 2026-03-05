'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/lib/config';
import { ShoppingBag } from 'lucide-react';

export function CheckoutForm() {
  const { items, totalSum } = useCartStore();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    comment: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
          Заказ принят
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Мы свяжемся с вами по указанному email и телефону для подтверждения.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-sky-500 px-6 py-3 font-medium text-white hover:bg-sky-600"
        >
          На главную
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
        <h2 className="font-semibold text-slate-900 dark:text-white">Контактные данные</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Имя *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Телефон *
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Адрес доставки *
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              value={formData.address}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="comment" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Комментарий
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={3}
              value={formData.comment}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="flex justify-between text-lg font-bold text-slate-900 dark:text-white">
          К оплате: <span>{formatPrice(totalSum())}</span>
        </p>
        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-sky-500 py-3 font-medium text-white hover:bg-sky-600 transition-colors"
        >
          Подтвердить заказ
        </button>
      </div>
    </form>
  );
}
