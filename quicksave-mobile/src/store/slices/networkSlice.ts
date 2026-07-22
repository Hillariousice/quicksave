import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
}

const initialState: NetworkState = {
  isConnected: true, // Optimistically assume true on boot
  isInternetReachable: true,
  type: null,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkState: (state, action: PayloadAction<NetInfoState>) => {
      // Double check isInternetReachable.
      // Sometimes it returns 'null' while still verifying. We treat false explicitly.
      state.isConnected = action.payload.isConnected;
      state.isInternetReachable = action.payload.isInternetReachable;
      state.type = action.payload.type;
    },
  },
});

export const { setNetworkState } = networkSlice.actions;
export default networkSlice.reducer;
