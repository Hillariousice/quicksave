import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../api/client';

// Async Thunk to restore session on app boot
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return rejectWithValue('No token found');

      // Hit your "me" endpoint to verify the token is valid and get the user data
      const response = await api.get('/auth/me');
      return response.data.data; // The user object
    } catch (error) {
      return rejectWithValue('Session expired');
    }
  }
);

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Tracks the initial boot state
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // We assume loading is true when the app first opens
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: any }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  // 👉 NEW: Handle the result of restoreSession
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;