'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, Zap, User, LogOut } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-slate-700/50 dark:bg-slate-900/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"
        >
          <Zap className="h-6 w-6 text-sky-500" />
          VOLT
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-smooth dark:text-slate-300 dark:hover:text-sky-400"
            >
              {label}
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-smooth dark:text-sky-400 dark:hover:text-sky-300"
            >
              Админ
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCart}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-sky-600 transition-smooth dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
            aria-label="Корзина"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalCount() > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                {totalCount() > 99 ? '99+' : totalCount()}
              </span>
            )}
          </button>

          {isLoggedIn ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-sky-600 transition-smooth dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
              >
                <User className="h-4 w-4" />
                {user?.username}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-smooth dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
                aria-label="Выйти"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-sky-600 transition-smooth dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
            >
              <User className="h-4 w-4" />
              Войти
            </Link>
          )}

          <button
            type="button"
            className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Меню"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className={clsx(
          'md:hidden border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
          mobileOpen ? 'block' : 'hidden'
        )}
      >
        <nav className="flex flex-col gap-0 py-2 px-4">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="py-3 text-sm font-medium text-slate-600 dark:text-slate-300"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="py-3 text-sm font-medium text-sky-600 dark:text-sky-400"
              onClick={() => setMobileOpen(false)}
            >
              Админ
            </Link>
          )}
          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                className="py-3 text-sm font-medium text-slate-600 dark:text-slate-300"
                onClick={() => setMobileOpen(false)}
              >
                Профиль ({user?.username})
              </Link>
              <button
                type="button"
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="py-3 text-left text-sm font-medium text-red-600 dark:text-red-400"
              >
                Выйти
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="py-3 text-sm font-medium text-sky-600 dark:text-sky-400"
              onClick={() => setMobileOpen(false)}
            >
              Войти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
