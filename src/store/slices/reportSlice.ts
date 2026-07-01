import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getWalletHistory } from "@/services/superAdminWallet";
import { WalletHistoryParams } from "@/types/superAdmin";

export const fetchHistory = createAsyncThunk(
  "reports/fetchHistory",
  async (params: WalletHistoryParams = {}, { rejectWithValue }) => {
    try {
      return await getWalletHistory(params);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch history"
      );
    }
  }
);

export const fetchHierarchy = createAsyncThunk(
  "reports/fetchHierarchy",
  async (_, { rejectWithValue }) =>
    rejectWithValue("Hierarchy live API not available")
);

interface ReportState {
  history: Awaited<ReturnType<typeof getWalletHistory>> | null;
  hierarchy: unknown[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  history: null,
  hierarchy: [],
  isLoading: false,
  error: null,
};

const reportSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history = action.payload;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default reportSlice.reducer;
