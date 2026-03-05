import Link from 'next/link';
import { ArrowRight, Zap, Truck, Shield, Headphones } from 'lucide-react';
import { getProducts, getCategories } from '@/lib/products';
import { ProductCard } from '@/components/ProductCard';

export default function HomePage() {
  const products = getProducts();
  const categories = getCategories();
  const featured = products.slice(0, 8);

  const benefits = [
    {
      icon: Truck,
      title: 'Быстрая доставка',
      text: 'Доставим в течение 1–3 дней по всей стране.',
    },
    {
      icon: Shield,
      title: 'Гарантия качества',
      text: 'Официальная гарантия на все товары.',
    },
    {
      icon: Headphones,
      title: 'Поддержка 24/7',
      text: 'Поможем с выбором и после покупки.',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-slate-900 via-sky-900/90 to-slate-900 px-4 py-20 text-white sm:px-6 md:py-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
            <Zap className="h-4 w-4 text-sky-300" />
            Электроника и гаджеты
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Добро пожаловать в <span className="text-sky-400">VOLT</span>
          </h1>
          <p className="mt-4 text-lg text-slate-300 sm:text-xl">
            Современная техника, умные устройства и аксессуары с доставкой и гарантией.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-medium text-white hover:bg-sky-600 transition-colors"
            >
              Смотреть каталог
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/products?category=Phone"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-medium text-white backdrop-blur hover:bg-white/20 transition-colors"
            >
              Смартфоны
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Категории</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center font-medium text-slate-700 shadow-card transition-smooth hover:border-sky-200 hover:shadow-card-hover hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-sky-500/30 dark:hover:text-sky-400"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center sm:items-start sm:text-left"
              >
                <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-400">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Популярные товары</h2>
          <Link
            href="/products"
            className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
          >
            Все товары →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      </section>
    </div>
  );
}
