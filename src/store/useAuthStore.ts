import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  setAuth: (accessToken: string, refreshToken: string, user: any) => void;
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
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ accessToken, refreshToken, user });
  },
  logout: async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    set({ accessToken: null, refreshToken: null, user: null });
  },
  hydrate: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userStr = await AsyncStorage.getItem('user');
      if (accessToken && refreshToken && userStr) {
        set({ accessToken, refreshToken, user: JSON.parse(userStr) });
      }
    } catch (e) {
      console.error('Failed to hydrate auth state', e);
    } finally {
      set({ isLoading: false });
    }
  }
}));
