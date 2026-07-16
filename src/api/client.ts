import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Cấu hình URL thông qua biến môi trường (.env) hoặc dùng local port cho việc dev
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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

// Response interceptor để xử lý lỗi token hết hạn (401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          
          if (res.data?.success && res.data?.data) {
            const { accessToken: newAccess, refreshToken: newRefresh, user } = res.data.data;
            await useAuthStore.getState().setAuth(newAccess, newRefresh, user);
            
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Xóa token nếu không thể refresh
          await useAuthStore.getState().logout();
          return Promise.reject(refreshError);
        }
      } else {
        await useAuthStore.getState().logout();
      }
    }
    
    return Promise.reject(error);
  }
);
