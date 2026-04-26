import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Star, CheckCircle2, Package } from 'lucide-react';
import { getProductBySlug } from '@/lib/products';
import { formatPrice } from '@/lib/config';
import { ProductActions } from './ProductActions';
import { ReviewsSection } from './ReviewsSection';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Товар | VOLT' };
  return {
    title: `${product.name} | VOLT`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const images = product.images?.length ? product.images : [product.image];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Хлебные крошки" className="mb-8 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="transition-colors hover:text-sky-600 dark:hover:text-sky-400">Главная</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <Link href="/products" className="transition-colors hover:text-sky-600 dark:hover:text-sky-400">Каталог</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <span className="max-w-[200px] truncate font-medium text-slate-900 dark:text-white">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white shadow-sm dark:border-slate-700/60 dark:from-slate-800/40 dark:to-slate-900/60">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-6"
              priority
              unoptimized
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <div
                  key={i}
                  className={i === 0
                    ? 'relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-sky-400 bg-white shadow-sm shadow-sky-400/20 dark:bg-slate-800'
                    : 'relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-sky-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-600'
                  }
                >
                  <Image src={src} alt={i === 0 ? product.name : `${product.name} вид ${i + 1}`} fill className="object-contain p-1.5" unoptimized />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="inline-flex w-fit items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 ring-1 ring-inset ring-sky-200/70 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20">
            {product.category}
          </span>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20"
              aria-label={`Рейтинг ${product.rating} из 5`}
            >
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
              {product.rating}
            </span>
            {product.inStock ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/60 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                В наличии
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500 ring-1 ring-inset ring-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:ring-slate-600">
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                Нет в наличии
              </span>
            )}
          </div>

          <div className="mt-5">
            <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatPrice(product.price)}
            </p>
          </div>

          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {product.description}
          </p>

          <ProductActions product={product} />

          {product.specs && product.specs.length > 0 && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="border-b border-slate-200/80 bg-slate-50 px-5 py-3 dark:border-slate-700/60 dark:bg-slate-800/60">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Характеристики</h3>
              </div>
              <dl className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {product.specs.map(({ label, value }, i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between gap-4 px-5 py-3 text-sm ${
                      i % 2 === 0
                        ? 'bg-white dark:bg-slate-800/30'
                        : 'bg-slate-50/60 dark:bg-slate-800/50'
                    }`}
                  >
                    <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      <ReviewsSection productId={product.id} />
    </div>
  );
}
