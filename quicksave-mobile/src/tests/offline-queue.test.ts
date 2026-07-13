import { configureStore } from '@reduxjs/toolkit';
import offlineQueueReducer, { syncOfflineData, enqueueContribution } from '../store/slices/offlineQueueSlice';
import { api } from '../api/client';
import * as offlineDB from '../database/offlineQueue';

// Mock the API client
jest.mock('../api/client');
const mockedApi = api as jest.Mocked<typeof api>;

describe('Offline Queue & Sync Engine', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: { offlineQueue: offlineQueueReducer },
    });
    jest.clearAllMocks();
  });

  it('1. should enqueue a contribution and update state', async () => {
    // Mock the SQLite save function
    jest.spyOn(offlineDB, 'saveOfflineContribution').mockResolvedValue({
      id: 'mock-uuid',
      groupId: 'group-1',
      amount: 10000,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    await store.dispatch(enqueueContribution({ groupId: 'group-1', amount: 10000 }));
    
    const state = store.getState().offlineQueue;
    expect(state.pendingContributions.length).toBe(1);
    expect(state.pendingContributions[0].amount).toBe(10000);
  });

  it('2. should keep local records if network drops MID-SYNC (500 Error)', async () => {
    // Setup: Pretend SQLite has 1 pending record
    jest.spyOn(offlineDB, 'getOfflineContributions').mockResolvedValue([
      { id: 'tx-1', groupId: 'group-1', amount: 5000, status: 'PENDING', createdAt: '2026-06-30T12:00:00Z' }
    ]);
    
    // Simulate a Network Drop/Server Crash during the POST request!
    mockedApi.post.mockRejectedValueOnce(new Error('Network Error'));

    await store.dispatch(syncOfflineData());

    const state = store.getState().offlineQueue;
    // The attempt counter should go up!
    expect(state.syncAttempts).toBe(1);
    // The queue should NOT be empty (data is safe!)
    expect(state.isSyncing).toBe(false);
  });

  it('3. should delete local records on successful sync (Idempotency Success)', async () => {
    const mockRecord = { id: 'tx-1', groupId: 'group-1', amount: 5000, status: 'PENDING', createdAt: '2026-06-30T12:00:00Z' };
    jest.spyOn(offlineDB, 'getOfflineContributions').mockResolvedValue([mockRecord]);
    
    const removeSpy = jest.spyOn(offlineDB, 'removeOfflineContribution').mockResolvedValue();
    
    // Simulate a successful 202 response from your Express backend
    mockedApi.post.mockResolvedValueOnce({ data: { success: true } });

    await store.dispatch(syncOfflineData());

    // Verify it called the delete function on the SQLite database
    expect(removeSpy).toHaveBeenCalledWith('tx-1');

    const state = store.getState().offlineQueue;
    // State should reset and pending contributions should be cleared!
    expect(state.syncAttempts).toBe(0);
    expect(state.pendingContributions.length).toBe(0);
  });
});