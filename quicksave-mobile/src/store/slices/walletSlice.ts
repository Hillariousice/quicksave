import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/api/client';
import { WalletService } from '@/api/services/wallet.service';


// Async Thunks for API Calls
export const fetchWalletData = createAsyncThunk('wallet/fetchData', async (_, { rejectWithValue }) => {
  try {
    // ⭐️ Look how clean and readable this is now!
    const [wallet, transactions] = await Promise.all([
      WalletService.getWallet(),
      WalletService.getTransactions()
    ]);
    
    return {
      balance: wallet.balance,
      transactions: transactions
    };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet');
  }
});


const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: 0,
    transactions: [],
    isLoading: false,
    error: null as string | null,
  },
  reducers: {
    // Manually update balance (e.g., after a successful Webhook/Paystack payment)
    updateBalance: (state, action) => {
      state.balance += action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletData.pending, (state) => { state.isLoading = true; })
      .addCase(fetchWalletData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload.balance;
        state.transactions = action.payload.transactions;
      })
      .addCase(fetchWalletData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { updateBalance } = walletSlice.actions;
export default walletSlice.reducer;