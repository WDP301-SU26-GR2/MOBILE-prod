import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Alert } from 'react-native';
import { router } from 'expo-router';

// Cấu hình URL thông qua biến môi trường (.env) hoặc dùng local port cho việc dev
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api-mangaka.novaproj.site';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để tự động chèn accessToken vào header
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor để xử lý lỗi token hết hạn (401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          
          if (res.data?.success && res.data?.data) {
            const { accessToken: newAccess, refreshToken: newRefresh, user } = res.data.data;
            await useAuthStore.getState().setAuth(newAccess, newRefresh, user);
            
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            processQueue(null, newAccess);
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          await useAuthStore.getState().logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        processQueue(new Error('No refresh token'), null);
        await useAuthStore.getState().logout();
        isRefreshing = false;
        Alert.alert('Session Expired', 'Please log in again to continue.');
        router.replace('/(auth)/login');
      }
    }
    
    // Check for specific backend error codes
    const backendCode = error.response?.data?.code;
    const backendMessage = error.response?.data?.message;
    
    if (backendCode === 'Error.RefreshTokenAlreadyUsed') {
      await useAuthStore.getState().logout();
      Alert.alert('Session Expired', 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.');
      router.replace('/(auth)/login');
      return Promise.reject(error);
    }
    
    // Log network errors (using console.warn to avoid React Native Red Box)
    console.warn('[Network Error]:', error?.response?.status, backendCode || error?.message, backendMessage);
    
    return Promise.reject(error);
  }
);
