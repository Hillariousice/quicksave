import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ChatService } from '@/api/services/chat.service';

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (groupId: string) => {
  return await ChatService.getMessages(groupId);
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: { messages: [], conversations: [], loading: false },
  reducers: {
    receiveMessage: (state, action) => {
      state.messages.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMessages.fulfilled, (state: any, action: any) => {
      state.messages = action.payload;
    });
  }
});

export const { receiveMessage } = chatSlice.actions;
export default chatSlice.reducer;