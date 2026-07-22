import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getOfflineContributions,
  removeOfflineContribution,
  saveOfflineContribution,
} from '../../database/offline-queue';
import { api } from '../../api/client';
import { fetchWalletData } from './walletSlice';

export const syncOfflineData = createAsyncThunk(
  'offlineQueue/sync',
  async (_, { dispatch, rejectWithValue }) => {
    // 1. Grab all pending offline jobs from SQLite
    const pendingRecords = await getOfflineContributions();

    if (pendingRecords.length === 0) return [];

    try {
      // 2. Push them to our brand new Backend Endpoint
      await api.post('/groups/sync-contributions', { contributions: pendingRecords });

      // 3. If successful, delete them from the local phone hard drive!
      for (const record of pendingRecords) {
        await removeOfflineContribution(record.id);
      }

      // 4. Tell Redux to fetch the fresh wallet balance!
      dispatch(fetchWalletData());

      return pendingRecords;
    } catch (error) {
      return rejectWithValue('Failed to reach server during sync.');
    }
  },
);
// Load the queue from SQLite into Redux on app boot
export const loadOfflineQueue = createAsyncThunk('offlineQueue/load', async () => {
  return await getOfflineContributions();
});

// Save a new offline contribution
export const enqueueContribution = createAsyncThunk(
  'offlineQueue/enqueue',
  async (data: { groupId: string; amount: number }) => {
    const record = await saveOfflineContribution(data.groupId, data.amount);
    return record;
  },
);

const offlineQueueSlice = createSlice({
  name: 'offlineQueue',
  initialState: {
    pendingContributions: [] as any[],
    isSyncing: false,
    syncAttempts: 0, // 👉 Track how many times we've tried to push to the server
    lastSyncError: null as string | null,
  },
  reducers: {
    // We'll use this tomorrow when we successfully sync with the backend
    removeFromQueue: (state, action) => {
      state.pendingContributions = state.pendingContributions.filter(
        (c) => c.id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadOfflineQueue.fulfilled, (state, action) => {
        state.pendingContributions = action.payload;
      })
      .addCase(enqueueContribution.fulfilled, (state, action) => {
        state.pendingContributions.unshift(action.payload);
      })
      // 👉 NEW: Handle Sync Lifecycle
      .addCase(syncOfflineData.pending, (state) => {
        state.isSyncing = true;
        state.lastSyncError = null;
      })
      .addCase(syncOfflineData.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.syncAttempts = 0; // Reset attempts on success!
        // Remove successfully synced items from Redux state
        const syncedIds = action.payload.map((p: any) => p.id);
        state.pendingContributions = state.pendingContributions.filter(
          (p) => !syncedIds.includes(p.id),
        );
      })
      .addCase(syncOfflineData.rejected, (state, action) => {
        state.isSyncing = false;
        state.syncAttempts += 1; // Increment attempt counter
        state.lastSyncError = action.payload as string;
      });
  },
});

export const { removeFromQueue } = offlineQueueSlice.actions;
export default offlineQueueSlice.reducer;
