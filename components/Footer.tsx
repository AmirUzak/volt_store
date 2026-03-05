import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200"
          >
            <Zap className="h-5 w-5 text-sky-500" />
            VOLT
          </Link>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Главная
            </Link>
            <Link href="/products" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Каталог
            </Link>
            <Link href="/cart" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Корзина
            </Link>
            <Link href="/checkout" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Оформление
            </Link>
          </nav>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          © {new Date().getFullYear()} VOLT. Электроника и гаджеты.
        </p>
      </div>
    </footer>
  );
}
