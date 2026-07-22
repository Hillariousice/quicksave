import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../api/client';
import { AuthService } from '../../api/services/auth.service';
import { SecureVault } from '@/utils/securestorage';

// Ensure this is at the top of the file
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: any, { rejectWithValue }) => {
    try {
      const data = await AuthService.login(credentials);
      await SecureStore.setItemAsync('accessToken', data.tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.tokens.refreshToken);
      return data.user;
    } catch (error: any) {
      if (error.message === 'Network Error') {
        return rejectWithValue('Cannot connect to server. Check your Wi-Fi or IP address.');
      }
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  },
);

export const verifyOtpAction = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const data = await AuthService.verifyOtp(email, otp);
      if (data.tokens) {
        await SecureStore.setItemAsync('accessToken', data.tokens.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.tokens.refreshToken);
      }
      return data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'OTP Verification failed');
    }
  },
);

// Async Thunk to restore session on app boot
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const token = await SecureVault.getAccessToken();
      if (!token) return rejectWithValue('No token found');

      // Hit your "me" endpoint to verify the token is valid and get the user data
      const response = await api.get('/auth/me');
      return response.data.data; // The user object
    } catch (error) {
      return rejectWithValue('Session expired');
    }
  },
);

// interface AuthState {
//   user: any | null;
//   isAuthenticated: boolean;
//   isLoading: boolean; // Tracks the initial boot state
// }

// const initialState: AuthState = {
//   user: null,
//   isAuthenticated: false,
//   isLoading: true, // We assume loading is true when the app first opens
// };

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isBooting: true,
    isAppLocked: false,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      SecureStore.deleteItemAsync('accessToken');
      SecureStore.deleteItemAsync('refreshToken');
    },
    lockApp: (state) => {
      state.isAppLocked = true;
    },
    unlockApp: (state) => {
      state.isAppLocked = false;
    },
  },
  // 👉 NEW: Handle the result of restoreSession
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.isBooting = false; // 👈 Add this: Tell the layout booting is finished
      })
      .addCase(loginUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      })
      .addCase(restoreSession.pending, (state) => {
        state.isBooting = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isBooting = false; // Initial check done
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isBooting = false; // Initial check done, no user found
      })
      .addCase(verifyOtpAction.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      });
  },
});

export const { logout, lockApp, unlockApp } = authSlice.actions;
export default authSlice.reducer;
