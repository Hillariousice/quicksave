import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/notifications'); // Assuming you add this endpoint
    return res.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    isLoading: false,
  },
  reducers: {
    // Optimistic UI update when a user reads a notification
    markAsRead: (state, action) => {
      const notif = state.items.find((n: any) => n.id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    // Instant update via WebSockets!
    addRealtimeNotification: (state, action) => {
      state.items.unshift(action.payload as never);
      state.unreadCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n: any) => !n.isRead).length;
      });
  }
});

export const { markAsRead, addRealtimeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;