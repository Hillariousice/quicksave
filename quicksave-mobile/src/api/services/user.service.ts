import { api } from '../client';

export const UserService = {
  getStats: async () => {
    const res = await api.get('/users/stats');
    return res.data.data;
  },
  updateProfile: async (data: any) => {
    const res = await api.put('/users/profile', data);
    return res.data.data;
  },
  getBanks: async () => {
    const res = await api.get('/users/banks');
    return res.data.data;
  },
  addBank: async (data: any) => {
    const res = await api.post('/users/bank', data);
    return res.data.data;
  }
};