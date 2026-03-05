import { ProductsClient } from './ProductsClient';
import { getProducts, getCategories } from '@/lib/products';

export const metadata = {
  title: 'Каталог | VOLT',
  description: 'Каталог электроники и гаджетов VOLT. Смартфоны, ноутбуки, аудио, аксессуары.',
};

interface PageProps {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const products = getProducts();
  const categories = getCategories();
  return (
    <ProductsClient
      initialProducts={products}
      categories={categories}
      initialCategory={params.category ?? ''}
      initialSort={(params.sort as any) ?? 'price-asc'}
      initialSearch={params.q ?? ''}
    />
  );
}
