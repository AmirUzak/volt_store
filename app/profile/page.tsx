'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import { ApiError, getOrders, getMyReviews, type ApiOrder, type ApiReview, updateProfile } from '@/lib/api';
import { formatPrice } from '@/lib/config';
import { User, ShoppingBag, Star, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

const STATUS_LABELS: Record<string, string> = {
  pending: 'В обработке',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function ProfilePage() {
  const { user, isLoggedIn, isLoading, logout, fetchUser } = useAuthStore();
  const router = useRouter();

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [tab, setTab] = useState<'orders' | 'reviews'>('orders');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: '',
    preferredPaymentMethod: '',
  });

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      phone: user.phone ?? '',
      addressLine1: user.addressLine1 ?? '',
      addressLine2: user.addressLine2 ?? '',
      city: user.city ?? '',
      postalCode: user.postalCode ?? '',
      country: user.country ?? '',
      preferredPaymentMethod: user.preferredPaymentMethod ?? '',
    });
  }, [user]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/auth');
    }
  }, [isLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setDataLoading(true);
    Promise.all([getOrders(), getMyReviews()])
      .then(([o, r]) => { setOrders(o); setReviews(r); })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      await updateProfile(profileForm);
      await fetchUser();
      setProfileMessage('Профиль обновлён');
    } catch (error) {
      if (error instanceof ApiError) {
        setProfileError(error.message);
      } else {
        setProfileError('Не удалось обновить профиль');
      }
    } finally {
      setProfileSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Profile card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
              <User className="h-7 w-7 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user.username}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              {user.role === 'ADMIN' && (
                <span className="mt-1 inline-block rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                  Администратор
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors dark:border-slate-600 dark:text-slate-400 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </div>

      <form
        onSubmit={handleProfileSubmit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Контактные данные и доставка</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={profileForm.phone}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="Телефон"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/40"
          />
          <select
            value={profileForm.preferredPaymentMethod}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, preferredPaymentMethod: e.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/40"
          >
            <option value="">Способ оплаты (не выбран)</option>
            <option value="card">Карта</option>
            <option value="cash">Наличные</option>
            <option value="sbp">СБП</option>
            <option value="paypal">PayPal</option>
          </select>
          <input
            value={profileForm.addressLine1}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
            placeholder="Адрес, строка 1"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/40 sm:col-span-2"
          />
          <input
            value={profileForm.addressLine2}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
            placeholder="Адрес, строка 2 (квартира, офис)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/40 sm:col-span-2"
          />
          <input
            value={profileForm.city}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
            placeholder="Город"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/40"
          />
          <input
            value={profileForm.postalCode}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, postalCode: e.target.value }))}
            placeholder="Почтовый индекс"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/40"
          />
          <input
            value={profileForm.country}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, country: e.target.value }))}
            placeholder="Страна"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/40 sm:col-span-2"
          />
        </div>

        {profileMessage && (
          <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{profileMessage}</p>
        )}
        {profileError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{profileError}</p>
        )}

        <button
          type="submit"
          disabled={profileSaving}
          className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {profileSaving ? 'Сохранение...' : 'Сохранить профиль'}
        </button>
      </form>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={clsx(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
            tab === 'orders'
              ? 'bg-sky-500 text-white'
              : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
          )}
        >
          <ShoppingBag className="h-4 w-4" />
          Мои заказы ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('reviews')}
          className={clsx(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
            tab === 'reviews'
              ? 'bg-sky-500 text-white'
              : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
          )}
        >
          <Star className="h-4 w-4" />
          Мои отзывы ({reviews.length})
        </button>
      </div>

      {dataLoading ? (
        <div className="mt-8 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {tab === 'orders' && (
            <>
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 text-slate-500 dark:text-slate-400">Заказов ещё нет</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            Заказ #{order.id}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })}
                          </p>
                        </div>
                        <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600')}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatPrice(order.total)}
                        </span>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {expandedOrder === order.id && (
                      <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                        <ul className="space-y-2">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700 dark:text-slate-300">
                                {item.product?.name ?? `Товар #${item.productId}`}
                                <span className="ml-2 text-slate-400">× {item.quantity}</span>
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'reviews' && (
            <>
              {reviews.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <Star className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 text-slate-500 dark:text-slate-400">Отзывов ещё нет</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {review.product?.name ?? `Товар #${review.productId}`}
                        </p>
                        <div className="mt-1 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={clsx(
                                'h-3.5 w-3.5',
                                i < review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              )}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
