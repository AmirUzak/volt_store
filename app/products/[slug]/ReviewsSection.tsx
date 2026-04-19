'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ApiError, addReview, deleteReview, getReviews, type ApiReview } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth-store';
import { Star, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ReviewsSectionProps {
  productId: string;
}

export function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { user, isLoggedIn } = useAuthStore();

  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const myReview = useMemo(
    () => reviews.find((review) => review.userId === user?.id) ?? null,
    [reviews, user?.id],
  );

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await getReviews(productId);
      setReviews(data);
      setError(null);
    } catch {
      setError('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  useEffect(() => {
    if (!myReview) return;
    setRating(myReview.rating);
    setComment(myReview.comment ?? '');
  }, [myReview]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addReview(productId, rating, comment);
      await loadReviews();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось сохранить отзыв');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    setSaving(true);
    setError(null);
    try {
      await deleteReview(myReview.id);
      setComment('');
      setRating(5);
      await loadReviews();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось удалить отзыв');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Отзывы</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Всего отзывов: {reviews.length}</p>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {myReview ? 'Ваш отзыв (можно обновить)' : 'Оставьте отзыв о товаре'}
          </p>

          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded p-1"
                  aria-label={`Оценка ${value}`}
                >
                  <Star
                    className={clsx(
                      'h-5 w-5',
                      value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600',
                    )}
                  />
                </button>
              );
            })}
          </div>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Комментарий (необязательно)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/30"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Сохранение...' : myReview ? 'Обновить отзыв' : 'Отправить отзыв'}
            </button>
            {myReview && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
      ) : (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Чтобы оставить отзыв, пожалуйста, <Link href="/auth" className="font-medium text-sky-600 hover:underline dark:text-sky-400">войдите в аккаунт</Link>.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Загружаем отзывы...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Пока нет отзывов. Будьте первым.</p>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{review.user?.username ?? 'Пользователь'}</p>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={clsx(
                          'h-3.5 w-3.5',
                          i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600',
                        )}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{review.comment}</p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
