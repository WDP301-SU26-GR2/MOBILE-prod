import { apiClient } from './client';

export const authApi = {
  login: async (data: any) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },
  loginWithGoogle: async (data: { idToken: string }) => {
    const response = await apiClient.post('/auth/google', data);
    return response.data;
  },
  register: async (data: any) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  verifyEmail: async (data: { email: string; code: string }) => {
    const response = await apiClient.post('/auth/verify-email', data);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get('/me');
    return response.data;
  },
  updateMe: async (data: any) => {
    const response = await apiClient.patch('/me', data);
    return response.data;
  },
  forgotPassword: async (data: any) => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },
  sendOtpEmail: async (data: { email: string; purpose: string }) => {
    const response = await apiClient.post('/auth/send-otp-email', data);
    return response.data;
  }
};
