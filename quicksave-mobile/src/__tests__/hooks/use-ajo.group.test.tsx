import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import groupReducer from '@/store/slices/groupSlice';
import { useAjoGroup } from '@/hooks/use-ajo-group';
import { GroupService } from '@/api/services/group.service';

jest.mock('@/api/services/group.service');
const mockedGroupService = GroupService as jest.Mocked<typeof GroupService>;

describe('useAjoGroup Hook', () => {
  it('should fetch data on mount and return it', async () => {
    const store = configureStore({ reducer: { groups: groupReducer } });
    
    mockedGroupService.getGroupById.mockResolvedValue({ id: 'g1', name: 'Hook Test Group' });
    mockedGroupService.getRotationTimeline.mockResolvedValue([]);

    // 1. Render the hook inside a Redux Provider wrapper
    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useAjoGroup('g1'), { wrapper });

    // 2. Initially, it should be loading
    expect(result.current.isLoading).toBe(true);

    // 3. Wait for the Redux Thunk to finish!
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 4. Assert the hook successfully returned the data from the store
    expect(result.current.group.name).toBe('Hook Test Group');
    expect(result.current.error).toBeNull();
  });
});