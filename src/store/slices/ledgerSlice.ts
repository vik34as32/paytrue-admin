import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getWalletHistory } from "@/services/superAdminWallet";
import { WalletHistoryParams } from "@/types/superAdmin";

export const fetchLedger = createAsyncThunk(
  "ledger/fetchAll",
  async (params: WalletHistoryParams = {}, { rejectWithValue }) => {
    try {
      return await getWalletHistory(params);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch ledger"
      );
    }
  }
);

interface LedgerState {
  entries: Awaited<ReturnType<typeof getWalletHistory>> | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LedgerState = {
  entries: null,
  isLoading: false,
  error: null,
};

const ledgerSlice = createSlice({
  name: "ledger",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLedger.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLedger.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = action.payload;
      })
      .addCase(fetchLedger.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default ledgerSlice.reducer;
