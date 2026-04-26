import Link from 'next/link';
import { ArrowRight, Zap, Truck, Shield, Headphones } from 'lucide-react';
import { getProducts, getCategories } from '@/lib/products';
import { ProductCard } from '@/components/ProductCard';

export default async function HomePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
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
      <section className="relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900 px-4 py-24 text-white sm:px-6 md:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-sky-500/30 blur-[120px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-[100px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-indigo-500/15 blur-[100px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-medium backdrop-blur-md">
            <Zap className="h-4 w-4 text-sky-300" aria-hidden="true" />
            <span className="bg-gradient-to-r from-sky-200 to-white bg-clip-text text-transparent">
              Электроника и гаджеты
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
            Добро пожаловать в{' '}
            <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(56,189,248,0.4)]">
              VOLT
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300 sm:text-xl">
            Современная техника, умные устройства и аксессуары с доставкой и гарантией.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 px-7 py-3.5 font-medium text-white shadow-lg shadow-sky-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-sky-500/40 hover:brightness-110 active:scale-[0.98]"
            >
              Смотреть каталог
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="/products?category=Phone"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 font-medium text-white backdrop-blur-md transition-all duration-200 hover:border-white/40 hover:bg-white/10"
            >
              Смартфоны
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-7 w-1 rounded-full bg-gradient-to-b from-sky-400 to-sky-600" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Категории</h2>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-center font-medium text-slate-700 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300/70 hover:text-sky-600 hover:shadow-card-hover dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:text-sky-400"
            >
              <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-sky-400/0 to-transparent transition-colors duration-300 group-hover:via-sky-400/70" />
              <span className="relative">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-b from-slate-50/80 to-white dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950/30">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group relative flex flex-col items-start rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/70 hover:shadow-card-hover dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:border-sky-500/40"
              >
                <div className="rounded-2xl bg-gradient-to-br from-sky-500/15 to-sky-500/5 p-3 text-sky-600 ring-1 ring-inset ring-sky-500/10 transition-all duration-300 group-hover:scale-110 group-hover:from-sky-500/20 dark:text-sky-400 dark:ring-sky-400/20">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-7 w-1 rounded-full bg-gradient-to-b from-sky-400 to-sky-600" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Популярные товары</h2>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            Все товары
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      </section>
    </div>
  );
}
