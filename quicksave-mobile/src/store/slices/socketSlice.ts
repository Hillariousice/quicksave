import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SocketState {
  isConnected: boolean;
}

const initialState: SocketState = {
  isConnected: false,
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocketConnection: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
  },
});

export const { setSocketConnection } = socketSlice.actions;
export default socketSlice.reducer;
