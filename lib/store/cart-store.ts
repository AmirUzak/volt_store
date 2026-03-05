import { create } from 'zustand';
import type { Product } from '@/lib/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  totalSum: () => number;
  totalCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  add: (product, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      let next: CartItem[];
      if (existing) {
        next = state.items.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        next = [...state.items, { product, quantity }];
      }
      return { items: next };
    });
  },
  remove: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }));
  },
  setQuantity: (productId, quantity) => {
    if (quantity < 1) {
      get().remove(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    }));
  },
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  totalSum: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  totalCount: () => get().items.reduce((c, i) => c + i.quantity, 0),
}));
