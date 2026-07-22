import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { NotificationService } from '@/api/services/notification.service';

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async () => {
  return await NotificationService.getAll();
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.items = action.payload;
    });
  },
});

export default notificationSlice.reducer;
