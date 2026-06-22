import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { mockApi } from "@/services/mockApi";
import { Transaction, TableFilters, PaginatedResponse } from "@/types";
import { BalanceTransferFormData } from "@/validations";

export const transferBalance = createAsyncThunk(
  "balance/transfer",
  async ({
    fromUserId,
    data,
  }: {
    fromUserId: string;
    data: BalanceTransferFormData;
  }) =>
    mockApi.transferBalance(
      fromUserId,
      data.toUserId,
      data.amount,
      data.remarks
    )
);

export const fetchTransactions = createAsyncThunk(
  "transactions/fetchAll",
  async (filters?: TableFilters) => mockApi.getTransactions(filters)
);

interface BalanceState {
  transactions: PaginatedResponse<Transaction> | null;
  isLoading: boolean;
  error: string | null;
  lastTransfer: Transaction | null;
}

const initialState: BalanceState = {
  transactions: null,
  isLoading: false,
  error: null,
  lastTransfer: null,
};

const balanceSlice = createSlice({
  name: "balance",
  initialState,
  reducers: {
    clearBalanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(transferBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(transferBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastTransfer = action.payload;
      })
      .addCase(transferBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Transfer failed";
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
      });
  },
});

export const { clearBalanceError } = balanceSlice.actions;
export default balanceSlice.reducer;
