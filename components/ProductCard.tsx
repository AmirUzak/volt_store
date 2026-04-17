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
        'group relative rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-all duration-300 ease-out',
        'hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.08)] hover:border-sky-200/80',
        'dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-sky-500/30'
      )}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700/50">
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
                className="object-contain"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority && i === 0}
                unoptimized
              />
            </div>
          ))}
        </div>
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
            {product.category}
          </p>
          <h3 className="mt-0.5 font-semibold text-slate-900 dark:text-white line-clamp-2">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {product.rating}
            </span>
          </div>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
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
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-600 transition-colors duration-200"
      >
        <ShoppingCart className="h-4 w-4" />
        В корзину
      </button>
    </article>
  );
}
