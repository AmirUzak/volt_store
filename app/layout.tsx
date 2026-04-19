import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ChatWidget } from '@/components/ChatWidget';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'VOLT — Электроника и гаджеты',
  description:
    'Современный магазин электроники и гаджетов. Смартфоны, ноутбуки, аудио, аксессуары. Быстрая доставка и гарантия.',
  openGraph: {
    title: 'VOLT — Электроника и гаджеты',
    description: 'Современный магазин электроники и гаджетов.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
