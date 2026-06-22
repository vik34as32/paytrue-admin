import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { mockApi } from "@/services/mockApi";
import { LedgerEntry, TableFilters, PaginatedResponse } from "@/types";

export const fetchLedger = createAsyncThunk(
  "ledger/fetchAll",
  async (filters?: TableFilters) => mockApi.getLedger(filters)
);

interface LedgerState {
  entries: PaginatedResponse<LedgerEntry> | null;
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
      })
      .addCase(fetchLedger.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = action.payload;
      })
      .addCase(fetchLedger.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch ledger";
      });
  },
});

export default ledgerSlice.reducer;
