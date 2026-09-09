import { api } from '../client';
import { ApiResponse } from '../types';

export const AuthService = {
  login: async (credentials: any) => {
    const res = await api.post<ApiResponse>('/auth/login', credentials);
    return res.data.data; // Strips the Axios response AND the API envelope!
  },
  
  register: async (userData: any) => {
    const res = await api.post<ApiResponse>('/auth/register', userData);
    return res.data.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const res = await api.post<ApiResponse>('/auth/verify-otp', { email, otp });
    return res.data.data;
  },

  getMe: async () => {
    const res = await api.get<ApiResponse>('/auth/me');
    return res.data.data;
  },

  changePassword: async (data: any) => {
    const res = await api.put<ApiResponse>('/auth/change-password', data);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (data: any) => {
    const res = await api.post<ApiResponse>('/auth/reset-password', data);
    return res.data;
  },
  syncPushToken: async (token: string) => {
    await api.patch('/users/push-token', { pushToken: token }); // Adjust to your route path
  }
};