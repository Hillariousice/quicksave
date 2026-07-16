import { configureStore } from '@reduxjs/toolkit';
import groupReducer, { fetchMyGroups } from '@/store/slices/groupSlice';
import { GroupService } from '@/api/services/group.service'; // Adjust path if needed

// 1. Mock the API Service so we don't hit the real backend
jest.mock('@/api/services/group.service');
const mockedGroupService = GroupService as jest.Mocked<typeof GroupService>;

describe('Group Slice Integration', () => {
  let store: any;

  beforeEach(() => {
    // 2. ⭐️ Spin up a REAL Redux store for the test
    store = configureStore({
      reducer: { groups: groupReducer },
    });
    jest.clearAllMocks();
  });

  it('1. should handle successful group fetching and sort by status', async () => {
    // Mock the API response
    const mockGroups = [
      { id: '1', name: 'Active Circle', status: 'ACTIVE' },
      { id: '2', name: 'Pending Circle', status: 'PENDING' },
      { id: '3', name: 'Done Circle', status: 'COMPLETED' },
    ];
    mockedGroupService.getMyGroups.mockResolvedValue(mockGroups);

    // Dispatch the Thunk!
    await store.dispatch(fetchMyGroups());

    // Extract the updated state
    const state = store.getState().groups;

    // Verify it stopped loading
    expect(state.isLoading).toBe(false);
    
    // Verify it dynamically sorted Active vs Completed groups!
    expect(state.activeGroups.length).toBe(2);
    expect(state.activeGroups[0].name).toBe('Active Circle');
    expect(state.completedGroups.length).toBe(1);
    expect(state.completedGroups[0].name).toBe('Done Circle');
  });

  it('2. should handle API errors gracefully', async () => {
    // Mock a network failure
    mockedGroupService.getMyGroups.mockRejectedValue({
      response: { data: { message: 'Server Timeout' } }
    });

    await store.dispatch(fetchMyGroups());

    const state = store.getState().groups;

    // Verify the error was safely caught and stored in Redux
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Server Timeout');
    expect(state.activeGroups.length).toBe(0);
  });
});