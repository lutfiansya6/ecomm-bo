import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('luxe_admin_token', token);
      localStorage.setItem('luxe_admin_user', JSON.stringify(user));
      // Also set luxe_token cookie for Next.js middleware / proxy compatibility
      document.cookie = `luxe_token=${token}; path=/; max-age=604800; SameSite=Lax`;
    }
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('luxe_admin_token');
      localStorage.removeItem('luxe_admin_user');
      document.cookie = 'luxe_token=; path=/; max-age=0';
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  initialize: () => {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('luxe_admin_token');
      const userStr = localStorage.getItem('luxe_admin_user');
      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        if (user.role === 'admin') {
          set({ user, token, isAuthenticated: true, isLoading: false });
          return;
        }
      }
    } catch {
      // Ignored
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));
