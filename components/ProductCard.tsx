'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/lib/config';
import { clsx } from 'clsx';

const SLIDESHOW_INTERVAL_MS = 1100;
const FADE_DURATION_MS = 400;

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority }: ProductCardProps) {
  const add = useCartStore((s) => s.add);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const images = product.images?.length ? product.images : [product.image];

  const clearSlideshow = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startSlideshow = useCallback(() => {
    clearSlideshow();
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, SLIDESHOW_INTERVAL_MS);
  }, [images.length, clearSlideshow]);

  const stopSlideshow = useCallback(() => {
    clearSlideshow();
    setCurrentIndex(0);
  }, [clearSlideshow]);

  const handleMouseEnter = () => startSlideshow();
  const handleMouseLeave = () => stopSlideshow();

  useEffect(() => {
    return () => clearSlideshow();
  }, [clearSlideshow]);

  return (
    <article
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        'group relative flex flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:border-sky-300/70 hover:shadow-[0_18px_50px_-12px_rgba(14,165,233,0.25),0_0_1px_rgba(0,0,0,0.06)]',
        'dark:border-slate-700/80 dark:bg-slate-800/60 dark:hover:border-sky-500/40 dark:hover:shadow-[0_18px_50px_-12px_rgba(14,165,233,0.35)]'
      )}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/40 dark:to-slate-800/60">
          <span className="absolute left-2 top-2 z-10 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-sky-700 shadow-sm backdrop-blur dark:bg-slate-900/70 dark:text-sky-300">
            {product.category}
          </span>
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="absolute inset-0 transition-opacity"
              style={{
                transitionDuration: `${FADE_DURATION_MS}ms`,
                opacity: i === currentIndex ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              <Image
                src={src}
                alt={i === 0 ? product.name : `${product.name} вид ${i + 1}`}
                fill
                className="object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority && i === 0}
                unoptimized
              />
            </div>
          ))}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-black/30" />
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
              {product.name}
            </h3>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20"
              aria-label={`Рейтинг ${product.rating} из 5`}
            >
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
              {product.rating}
            </span>
          </div>
          <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          void add(product);
        }}
        aria-label={`Добавить ${product.name} в корзину`}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-500/20 transition-all duration-200 hover:from-sky-600 hover:to-sky-700 hover:shadow-md hover:shadow-sky-500/30 active:scale-[0.98]"
      >
        <ShoppingCart className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
        В корзину
      </button>
    </article>
  );
}
