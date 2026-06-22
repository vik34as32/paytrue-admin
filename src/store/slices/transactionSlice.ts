import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { mockApi } from "@/services/mockApi";
import { Transaction, TableFilters, PaginatedResponse } from "@/types";

export const fetchAllTransactions = createAsyncThunk(
  "transactions/fetchAll",
  async (filters?: TableFilters) => mockApi.getTransactions(filters)
);

interface TransactionState {
  list: PaginatedResponse<Transaction> | null;
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
      })
      .addCase(fetchAllTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch";
      });
  },
});

export default transactionSlice.reducer;
