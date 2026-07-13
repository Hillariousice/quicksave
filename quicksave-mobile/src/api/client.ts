import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { SecureVault } from '../utils/securestorage';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

let injectedStore: any;

export const injectStore = (storeInstance: any) => {
  injectedStore = storeInstance;
};

// 1. REQUEST INTERCEPTOR: Attach Token
api.interceptors.request.use(async (config) => {
  const token = await SecureVault.getAccessToken(); 
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));


//  The Refresh Queue
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// 2. RESPONSE INTERCEPTOR: Handle 401s and Queueing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401, not a login/refresh route, and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      
      // If a refresh is already happening, queue this request and wait!
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      // Lock the interceptor
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureVault.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token found');

        // Hit backend for new tokens
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`, { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data.tokens;

        // Save new tokens
        await SecureVault.saveTokens(newAccess, newRefresh); 

        // Process all queued requests with the new token
        processQueue(null, newAccess);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);

      } catch (refreshError) {
        // If the refresh fails (token expired/blacklisted), wipe everything and force logout
        processQueue(refreshError, null);
        await SecureVault.clearTokens();
        if (injectedStore) {
          // Dynamic import to prevent circular dependency
          const { logout } = require('../store/slices/authSlice');
          injectedStore.dispatch(logout());
        }
         // Kick them to the login screen
        return Promise.reject(refreshError);
      } finally {
        // Unlock the interceptor
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);