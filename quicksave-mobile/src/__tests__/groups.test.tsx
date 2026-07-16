import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import GroupsScreen from '@/app/(tabs)/groups';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe('Groups Screen Offline UI', () => {
  it('renders the Pending Sync badge when there are offline contributions', () => {
    // 1. Create a fake Redux store simulating a dropped network and queued data
    const mockStore = configureStore({
      reducer: {
        auth: (state = { user: { firstName: 'Hillary' } }) => state,
        network: (state = { isConnected: false, isInternetReachable: false }) => state,
        groups: (state = { activeGroups: [{ id: 'group-1', name: 'Lagos Techies', progress: 50 }], completedGroups: [] }) => state,
        // 👉 Inject a pending contribution for group-1!
        offlineQueue: (state = { pendingContributions: [{ id: 'tx-1', groupId: 'group-1', amount: 10000 }] }) => state,
      },
    });

    // 2. Render the screen
    const { getByText, getByTestId } = render(
      <Provider store={mockStore}>
        <GroupsScreen />
      </Provider>
    );

    // 3. Assertions
    // The pending sync badge text should be visible on the screen!
    expect(getByText('Pending Sync')).toBeTruthy();

    // The "Start a New Group" text should dynamically change to the offline warning!
    expect(getByText('Connect to the internet to create a group.')).toBeTruthy();
  });
});