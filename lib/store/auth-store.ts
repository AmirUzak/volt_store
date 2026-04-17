import { create } from 'zustand';
import { authLogout, authRegister, getMe, type AuthUser, authLogin } from '@/lib/api';
import { useCartStore } from '@/lib/store/cart-store';

interface AuthStore {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,

  login: async (email, password) => {
    const user = await authLogin(email, password);
    set({ user, isLoggedIn: true });
    await useCartStore.getState().setActiveUser(user.id);
  },

  register: async (email, username, password) => {
    const user = await authRegister(email, username, password);
    set({ user, isLoggedIn: true });
    await useCartStore.getState().setActiveUser(user.id);
  },

  logout: async () => {
    await authLogout();
    await useCartStore.getState().setActiveUser(null);
    set({ user: null, isLoggedIn: false });
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const user = await getMe();
      set({ user, isLoggedIn: !!user });
      await useCartStore.getState().setActiveUser(user?.id ?? null);
    } finally {
      set({ isLoading: false });
    }
  },
}));
