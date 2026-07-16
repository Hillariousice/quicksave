import { configureStore } from '@reduxjs/toolkit';
import contributionReducer, { submitContribution } from '@/store/slices/contributionSlice';
import walletReducer from '@/store/slices/walletSlice';
import groupReducer from '@/store/slices/groupSlice';
import { GroupService } from '@/api/services/group.service';

jest.mock('@/services/group.service');
const mockedGroupService = GroupService as jest.Mocked<typeof GroupService>;

describe('Contribution Cross-Slice Synchronization', () => {
  it('should submit a contribution and instantly refresh wallet and group data', async () => {
    // Create a store that includes ALL the connected slices
    const store = configureStore({
      reducer: {
        contributions: contributionReducer,
        wallet: walletReducer,
        groups: groupReducer,
      },
    });

    // Mock the successful payment
    mockedGroupService.makeContribution.mockResolvedValue({ id: 'receipt-123', amount: 10000 });

    // Spy on the dispatch function to see what actions it fires
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    await store.dispatch(submitContribution('group-1'));

    const state = store.getState().contributions;

    // 1. Check if the payment succeeded locally
    expect(state.isProcessingPayment).toBe(false);
    expect(state.recentContributions[0].id).toBe('receipt-123');

    // 2. ⭐️ THE CROSS-SLICE AUDIT: 
    // Did it automatically trigger the Wallet and Group refreshes?
    const dispatchedActionTypes = dispatchSpy.mock.calls.map(call => call[0].type);
    
    expect(dispatchedActionTypes).toContain('wallet/fetchData/pending');
    expect(dispatchedActionTypes).toContain('groups/fetchDetails/pending');
  });
});