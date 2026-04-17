import { create } from 'zustand';
import { getProducts } from '@/lib/products';
import type { Product } from '@/lib/types';
import {
  addToCart as apiAddToCart,
  clearCart as apiClearCart,
  getCart as apiGetCart,
  removeFromCart as apiRemoveFromCart,
  updateCartItem as apiUpdateCartItem,
  type ApiCart,
  type CartProductPayload,
} from '@/lib/api';

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

const toCartProductPayload = (product: Product): CartProductPayload => ({
  name: product.name,
  description: product.description,
  price: product.price,
  category: product.category,
  stock: product.inStock ? 1 : 0,
  imageUrl: product.image,
});

const mapRemoteCart = (cart: ApiCart): CartItem[] => {
  const catalog = getProducts();

  return cart.items
    .map(({ product, quantity }) => {
      const localProduct = catalog.find((entry) => entry.id === product.id);

      if (!localProduct) {
        return null;
      }

      return {
        product: localProduct,
        quantity,
      };
    })
    .filter((item): item is CartItem => item !== null);
};

const syncItemsToBackend = async (items: CartItem[]) => {
  await apiClearCart();

  for (const item of items) {
    await apiAddToCart(item.product.id, item.quantity, toCartProductPayload(item.product));
  }

  return apiGetCart();
};

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  activeUserId: string | null;
  add: (product: Product, quantity?: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  setActiveUser: (userId: string | null) => Promise<void>;
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
  add: async (product, quantity = 1) => {
    const state = get();

    if (!state.activeUserId) {
      set((current) => {
        const existing = current.items.find((item) => item.product.id === product.id);
        const next = existing
          ? current.items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          : [...current.items, { product, quantity }];

        return { items: next };
      });
      return;
    }

    const remoteCart = await apiAddToCart(product.id, quantity);
    const next = mapRemoteCart(remoteCart);
    set({ items: next });
    saveUserCart(state.activeUserId, next);
  },
  remove: async (productId) => {
    const state = get();

    if (!state.activeUserId) {
      set((current) => ({
        items: current.items.filter((item) => item.product.id !== productId),
      }));
      return;
    }

    const remoteCart = await apiRemoveFromCart(productId);
    const next = mapRemoteCart(remoteCart);
    set({ items: next });
    saveUserCart(state.activeUserId, next);
  },
  setQuantity: async (productId, quantity) => {
    const state = get();

    if (quantity < 1) {
      await get().remove(productId);
      return;
    }

    if (!state.activeUserId) {
      set((current) => ({
        items: current.items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      }));
      return;
    }

    const remoteCart = await apiUpdateCartItem(productId, quantity);
    const next = mapRemoteCart(remoteCart);
    set({ items: next });
    saveUserCart(state.activeUserId, next);
  },
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  clear: async () => {
    const state = get();

    if (!state.activeUserId) {
      set({ items: [] });
      return;
    }

    await apiClearCart();
    set({ items: [] });
    saveUserCart(state.activeUserId, []);
  },
  setActiveUser: async (userId) => {
    if (!userId) {
      set({ activeUserId: null, items: [] });
      return;
    }

    const currentItems = get().items;
    const savedItems = loadUserCart(userId);

    set({ activeUserId: userId });

    try {
      const remoteCart = await apiGetCart();

      if (remoteCart.items.length > 0) {
        const next = mapRemoteCart(remoteCart);
        set({ items: next });
        saveUserCart(userId, next);
        return;
      }

      const fallbackItems = currentItems.length > 0 ? currentItems : savedItems;
      if (fallbackItems.length > 0) {
        const syncedCart = await syncItemsToBackend(fallbackItems);
        const next = mapRemoteCart(syncedCart);
        set({ items: next });
        saveUserCart(userId, next);
        return;
      }

      set({ items: [] });
      saveUserCart(userId, []);
    } catch {
      const fallbackItems = currentItems.length > 0 ? currentItems : savedItems;
      set({ items: fallbackItems });
      saveUserCart(userId, fallbackItems);
    }
  },
  totalSum: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  totalCount: () => get().items.reduce((c, i) => c + i.quantity, 0),
}));
