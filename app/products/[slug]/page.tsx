import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductBySlug, getProducts } from '@/lib/products';
import { formatPrice } from '@/lib/config';
import { ProductActions } from './ProductActions';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
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
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const images = product.images?.length ? product.images : [product.image];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400">Главная</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-sky-600 dark:hover:text-sky-400">Каталог</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 dark:text-white">{product.name}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-4"
              priority
              unoptimized
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700"
                >
                  <Image src={src} alt="" fill className="object-contain" unoptimized />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
            {product.category}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {product.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {formatPrice(product.price)}
            </span>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              ★ {product.rating}
            </span>
            {product.inStock && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">В наличии</span>
            )}
          </div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">{product.description}</p>
          <ProductActions product={product} />
          {product.specs && product.specs.length > 0 && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <h3 className="font-semibold text-slate-900 dark:text-white">Характеристики</h3>
              <dl className="mt-2 space-y-1">
                {product.specs.map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
