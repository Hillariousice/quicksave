import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ChatService } from '@/api/services/chat.service';

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (groupId: string) => {
  return await ChatService.getMessages(groupId);
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: { messages: [], conversations: [], loading: false },
  reducers: {
    setConversations: (state: any, action: any) => {
      state.conversations = action.payload;
    },
    receiveMessage: (state: any, action: any) => {
      // Prevent duplicates from socket + optimistic update
      const exists = state.messages.find((m: any) => m.id === action.payload.id);
      if (!exists) state.messages.push(action.payload);
    },
    markLocalAsRead: (state: any) => {
      state.conversations = state.conversations.map((c: any) => ({ ...c, unread: 0 }));
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMessages.fulfilled, (state: any, action: any) => {
      state.messages = action.payload;
    });
  }
});

export const { receiveMessage, markLocalAsRead, setConversations } = chatSlice.actions;
export default chatSlice.reducer;