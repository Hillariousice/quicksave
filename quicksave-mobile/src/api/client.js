"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectStore = exports.api = void 0;
const axios_1 = __importDefault(require("axios"));
const securestorage_1 = require("../utils/securestorage");
exports.api = axios_1.default.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    headers: { 'Content-Type': 'application/json' },
});
let injectedStore;
const injectStore = (storeInstance) => {
    injectedStore = storeInstance;
};
exports.injectStore = injectStore;
// 1. REQUEST INTERCEPTOR: Attach Token
exports.api.interceptors.request.use(async (config) => {
    const token = await securestorage_1.SecureVault.getAccessToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));
//  The Refresh Queue
let isRefreshing = false;
let failedQueue = [];
const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error)
            prom.reject(error);
        else
            prom.resolve(token);
    });
    failedQueue = [];
};
// 2. RESPONSE INTERCEPTOR: Handle 401s and Queueing
exports.api.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    // If it's a 401, not a login/refresh route, and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
        // If a refresh is already happening, queue this request and wait!
        if (isRefreshing) {
            return new Promise(function (resolve, reject) {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return (0, exports.api)(originalRequest);
            }).catch(err => Promise.reject(err));
        }
        // Lock the interceptor
        originalRequest._retry = true;
        isRefreshing = true;
        try {
            const refreshToken = await securestorage_1.SecureVault.getRefreshToken();
            if (!refreshToken)
                throw new Error('No refresh token found');
            // Hit backend for new tokens
            const response = await axios_1.default.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`, { refreshToken });
            const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data.tokens;
            // Save new tokens
            await securestorage_1.SecureVault.saveTokens(newAccess, newRefresh);
            // Process all queued requests with the new token
            processQueue(null, newAccess);
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return (0, exports.api)(originalRequest);
        }
        catch (refreshError) {
            // If the refresh fails (token expired/blacklisted), wipe everything and force logout
            processQueue(refreshError, null);
            await securestorage_1.SecureVault.clearTokens();
            if (injectedStore) {
                // Dynamic import to prevent circular dependency
                const { logout } = require('../store/slices/authSlice');
                injectedStore.dispatch(logout());
            }
            // Kick them to the login screen
            return Promise.reject(refreshError);
        }
        finally {
            // Unlock the interceptor
            isRefreshing = false;
        }
    }
    return Promise.reject(error);
});
//# sourceMappingURL=client.js.map