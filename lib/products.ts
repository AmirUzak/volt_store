import type { Product } from './types';
import { getProducts as getApiProducts } from './api';

export async function getProducts(): Promise<Product[]> {
  const { products } = await getApiProducts({ limit: 1000 });
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((product) => product.slug === slug);
}

export async function getCategories(): Promise<string[]> {
  const products = await getProducts();
  const set = new Set(products.map((product) => product.category));
  return Array.from(set).sort();
}
