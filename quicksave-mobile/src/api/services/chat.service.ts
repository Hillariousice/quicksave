import { api } from '../client';

export const ChatService = {
  getConversations: async () => {
    const res = await api.get('/chats');
    return res.data.data;
  },
  getMessages: async (groupId: string) => {
    const res = await api.get(`/chats/${groupId}`);
    return res.data.data;
  },
  sendMessage: async (groupId: string, content: string) => {
    const res = await api.post('/chats/send', { groupId, content });
    return res.data.data;
  }
};