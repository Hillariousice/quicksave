import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { GroupService } from '../../api/services/group.service';
import { fetchWalletData } from './walletSlice'; 
import { fetchGroupDetails } from './groupSlice';

export const submitContribution = createAsyncThunk(
  'contributions/submit',
  async (groupId: string, { dispatch, rejectWithValue }) => {
    try {
      // 1. Call the API Service
      const receipt = await GroupService.makeContribution(groupId);

      // 2. Cross-Slice Sync!
      // The payment succeeded, so the wallet balance went down and the group vault went up.
      // We fire these off in the background so the global state updates instantly!
      dispatch(fetchWalletData());
      dispatch(fetchGroupDetails(groupId));

      return receipt;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit contribution');
    }
  }
);

const contributionSlice = createSlice({
  name: 'contributions',
  initialState: {
    recentContributions: [] as any[],
    isProcessingPayment: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(submitContribution.pending, (state) => {
        state.isProcessingPayment = true;
        state.error = null;
      })
      .addCase(submitContribution.fulfilled, (state, action) => {
        state.isProcessingPayment = false;
        state.recentContributions.unshift(action.payload as never);
      })
      .addCase(submitContribution.rejected, (state, action) => {
        state.isProcessingPayment = false;
        state.error = action.payload as string;
      });
  }
});

export default contributionSlice.reducer;