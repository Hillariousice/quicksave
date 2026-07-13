import { api } from '../client';

export const NotificationService = {
  getAll: async () => {
    const res = await api.get('/notifications');
    return res.data.data;
  },
  markAsRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  }
};