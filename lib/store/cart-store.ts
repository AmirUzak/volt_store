import { create } from 'zustand';
import type { Product } from '@/lib/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

type CartStorage = Record<string, CartItem[]>;

const CART_STORAGE_KEY = 'volt-cart-by-user';

const readCartStorage = (): CartStorage => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CartStorage;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeCartStorage = (storage: CartStorage) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storage));
};

const loadUserCart = (userId: string): CartItem[] => {
  const storage = readCartStorage();
  return storage[userId] ?? [];
};

const saveUserCart = (userId: string, items: CartItem[]) => {
  const storage = readCartStorage();
  storage[userId] = items;
  writeCartStorage(storage);
};

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  activeUserId: string | null;
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  setActiveUser: (userId: string | null) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  totalSum: () => number;
  totalCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  activeUserId: null,
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
      if (state.activeUserId) {
        saveUserCart(state.activeUserId, next);
      }
      return { items: next };
    });
  },
  remove: (productId) => {
    set((state) => ({
      items: (() => {
        const next = state.items.filter((i) => i.product.id !== productId);
        if (state.activeUserId) {
          saveUserCart(state.activeUserId, next);
        }
        return next;
      })(),
    }));
  },
  setQuantity: (productId, quantity) => {
    if (quantity < 1) {
      get().remove(productId);
      return;
    }
    set((state) => ({
      items: (() => {
        const next = state.items.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        );
        if (state.activeUserId) {
          saveUserCart(state.activeUserId, next);
        }
        return next;
      })(),
    }));
  },
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  clear: () => {
    set((state) => {
      if (state.activeUserId) {
        saveUserCart(state.activeUserId, []);
      }
      return { items: [] };
    });
  },
  setActiveUser: (userId) => {
    if (!userId) {
      set({ activeUserId: null, items: [] });
      return;
    }

    set({
      activeUserId: userId,
      items: loadUserCart(userId),
    });
  },
  totalSum: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  totalCount: () => get().items.reduce((c, i) => c + i.quantity, 0),
}));
