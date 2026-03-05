'use client';

import { useCartStore } from '@/lib/store/cart-store';
import type { Product } from '@/lib/types';
import { ShoppingCart } from 'lucide-react';

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const add = useCartStore((s) => s.add);
  const openCart = useCartStore((s) => s.open);

  const handleAdd = () => {
    add(product);
    openCart();
  };

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-medium text-white hover:bg-sky-600 transition-colors"
      >
        <ShoppingCart className="h-5 w-5" />
        В корзину
      </button>
    </div>
  );
}
