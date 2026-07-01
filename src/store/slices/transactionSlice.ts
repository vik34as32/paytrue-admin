import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getWalletHistory } from "@/services/superAdminWallet";
import { WalletHistoryParams } from "@/types/superAdmin";

export const fetchAllTransactions = createAsyncThunk(
  "transactions/fetchAll",
  async (params: WalletHistoryParams = {}, { rejectWithValue }) => {
    try {
      return await getWalletHistory(params);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch transactions"
      );
    }
  }
);

interface TransactionState {
  list: Awaited<ReturnType<typeof getWalletHistory>> | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  list: null,
  isLoading: false,
  error: null,
};

const transactionSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default transactionSlice.reducer;
