'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, Zap, User, LogOut, X } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { useState } from 'react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const totalCount = useCartStore((s) => s.totalCount);
  const openCart = useCartStore((s) => s.open);
  const { user, isLoggedIn, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const links = [
    { href: '/', label: 'Главная' },
    { href: '/products', label: 'Каталог' },
    { href: '/cart', label: 'Корзина' },
    { href: '/checkout', label: 'Оформление' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-slate-700/50 dark:bg-slate-900/80 dark:supports-[backdrop-filter]:bg-slate-900/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold text-slate-900 dark:text-white"
          aria-label="VOLT — на главную"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-md shadow-sky-500/30 ring-1 ring-inset ring-white/20 transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
            <Zap className="h-5 w-5 fill-white text-white" aria-hidden="true" />
          </span>
          <span className="text-lg tracking-tight">VOLT</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Основная навигация">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="group relative rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
            >
              {label}
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-center scale-x-0 rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="ml-1 inline-flex items-center gap-1 rounded-lg bg-sky-500/10 px-3 py-1.5 text-sm font-semibold text-sky-700 ring-1 ring-inset ring-sky-500/20 transition-colors hover:bg-sky-500/15 hover:text-sky-800 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20 dark:hover:text-sky-200"
            >
              Админ
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openCart}
            className="group relative rounded-xl p-2.5 text-slate-600 transition-all hover:bg-sky-50 hover:text-sky-600 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
            aria-label={`Корзина${totalCount() > 0 ? `, товаров: ${totalCount()}` : ', пусто'}`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {totalCount() > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 px-1 text-[10px] font-bold text-white shadow-md shadow-sky-500/40 ring-2 ring-white dark:ring-slate-900"
                aria-hidden="true"
              >
                {totalCount() > 99 ? '99+' : totalCount()}
              </span>
            )}
          </button>

          {isLoggedIn ? (
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-[10px] font-bold uppercase text-white">
                  {user?.username?.[0] ?? <User className="h-3.5 w-3.5" />}
                </span>
                <span className="max-w-[8rem] truncate">{user?.username}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                aria-label="Выйти"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-sky-500/40 dark:hover:bg-slate-800 dark:hover:text-sky-300"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              Войти
            </Link>
          )}

          <button
            type="button"
            className="md:hidden rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        className={clsx(
          'md:hidden overflow-hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 ease-out dark:border-slate-700/60 dark:bg-slate-900/95',
          mobileOpen ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Мобильная навигация">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-400"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="rounded-lg bg-sky-500/10 px-3 py-3 text-sm font-semibold text-sky-700 ring-1 ring-inset ring-sky-500/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20"
              onClick={() => setMobileOpen(false)}
            >
              Админ
            </Link>
          )}
          <div className="my-2 h-px bg-slate-200 dark:bg-slate-700/60" aria-hidden="true" />
          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setMobileOpen(false)}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-[10px] font-bold uppercase text-white">
                  {user?.username?.[0]}
                </span>
                Профиль ({user?.username})
              </Link>
              <button
                type="button"
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Выйти
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-500/30 hover:bg-sky-600"
              onClick={() => setMobileOpen(false)}
            >
              <User className="h-4 w-4" aria-hidden="true" />
              Войти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
