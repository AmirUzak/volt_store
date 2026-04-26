import Link from 'next/link';
import { Zap, Truck, Shield, Headphones } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Главная' },
  { href: '/products', label: 'Каталог' },
  { href: '/cart', label: 'Корзина' },
  { href: '/checkout', label: 'Оформление' },
];

const TRUST_ITEMS = [
  { icon: Truck, label: 'Быстрая доставка' },
  { icon: Shield, label: 'Гарантия качества' },
  { icon: Headphones, label: 'Поддержка 24/7' },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-gradient-to-b from-slate-50/60 to-white dark:border-slate-800/60 dark:from-slate-900/80 dark:to-slate-950/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 py-12 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto]">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="group flex w-fit items-center gap-2.5 font-semibold text-slate-900 dark:text-white"
              aria-label="VOLT — на главную"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-md shadow-sky-500/30 ring-1 ring-inset ring-white/20 transition-transform duration-200 group-hover:scale-105">
                <Zap className="h-5 w-5 fill-white text-white" aria-hidden="true" />
              </span>
              <span className="text-lg tracking-tight">VOLT</span>
            </Link>
            <p className="max-w-[18rem] text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Электроника и гаджеты с доставкой и официальной гарантией.
            </p>
          </div>

          {/* Nav */}
          <nav aria-label="Навигация в подвале">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Разделы
            </p>
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-1.5 text-sm text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
                  >
                    <span className="h-px w-3 rounded-full bg-slate-300 transition-all group-hover:w-4 group-hover:bg-sky-400 dark:bg-slate-600 dark:group-hover:bg-sky-500" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Trust */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Наши преимущества
            </p>
            <ul className="flex flex-col gap-3">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 border-t border-slate-200/80 py-6 sm:flex-row sm:justify-between dark:border-slate-800/60">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            © {new Date().getFullYear()} VOLT. Все права защищены.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-600">
            Электроника и гаджеты
          </p>
        </div>
      </div>
    </footer>
  );
}
