import type { Product } from './types';

let cached: Product[] | null = null;

export function getProducts(): Product[] {
  if (cached) return cached;
  try {
    const data = require('@/lib/data/products.json');
    cached = Array.isArray(data) ? data : [];
    return cached;
  } catch {
    return [];
  }
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug);
}

export function getCategories(): string[] {
  const set = new Set(getProducts().map((p) => p.category));
  return Array.from(set).sort();
}
