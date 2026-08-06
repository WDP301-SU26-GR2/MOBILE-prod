import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const storage = {
  get: (key: string) => Platform.OS === 'web' ? Promise.resolve(null) : SecureStore.getItemAsync(key),
  set: (key: string, value: string) => Platform.OS === 'web' ? Promise.resolve() : SecureStore.setItemAsync(key, value),
  remove: (key: string) => Platform.OS === 'web' ? Promise.resolve() : SecureStore.deleteItemAsync(key),
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  setAuth: (accessToken: string, refreshToken: string, user: any) => void;
  setUser: (user: any) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
  isLoading: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isLoading: true,
  setAuth: async (accessToken, refreshToken, user) => {
    await storage.set('accessToken', accessToken);
    await storage.set('refreshToken', refreshToken);
    await storage.set('user', JSON.stringify(user));
    set({ accessToken, refreshToken, user });
  },
  setUser: async (user) => {
    await storage.set('user', JSON.stringify(user));
    set({ user });
  },
  logout: async () => {
    await storage.remove('accessToken');
    await storage.remove('refreshToken');
    await storage.remove('user');
    set({ accessToken: null, refreshToken: null, user: null });
  },
  hydrate: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await storage.get('accessToken');
      const refreshToken = await storage.get('refreshToken');
      const userStr = await storage.get('user');
      if (accessToken && refreshToken && userStr) {
        set({ accessToken, refreshToken, user: JSON.parse(userStr) });
      }
    } catch (e) {
      console.error("Log message", (e as any)?.message || "Unknown error");
    } finally {
      set({ isLoading: false });
    }
  }
}));
