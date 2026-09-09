import { api } from '../client';
import { ApiResponse } from '../types';

export const WalletService = {
  getWallet: async () => {
    const res = await api.get<ApiResponse>('/wallets');
    return res.data.data;
  },

  getTransactions: async (type?: string, page = 1) => {
    const query = type && type !== 'All' ? `?type=${type}&page=${page}` : `?page=${page}`;
    const res = await api.get<ApiResponse>(`/wallets/transactions${query}`);
    return res.data.data;
  },

  fundWallet: async (amount: number) => {
    const res = await api.post<ApiResponse>('/wallets/fund', { amount });
    return res.data.data;
  },

  withdraw: async (data: { amount: number; accountNumber: string; bankCode: string; accountName: string }) => {
    const res = await api.post<ApiResponse>('/wallets/withdraw', data);
    return res.data.data;
  },
   getTransactionById: async (id: string) => {
    const res = await api.get<ApiResponse>(`/wallets/transactions/${id}`);
    return res.data.data;
  },
};