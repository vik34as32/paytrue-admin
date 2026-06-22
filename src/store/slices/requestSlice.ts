import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { mockApi } from "@/services/mockApi";
import { BalanceRequest, TableFilters, PaginatedResponse } from "@/types";

export const fetchRequests = createAsyncThunk(
  "requests/fetchAll",
  async (filters?: TableFilters) => mockApi.getRequests(filters)
);

export const createBalanceRequest = createAsyncThunk(
  "requests/create",
  async ({
    retailerId,
    amount,
    remarks,
  }: {
    retailerId: string;
    amount: number;
    remarks: string;
  }) => mockApi.createRequest(retailerId, amount, remarks)
);

export const approveBalanceRequest = createAsyncThunk(
  "requests/approve",
  async ({
    requestId,
    approverId,
    remarks,
  }: {
    requestId: string;
    approverId: string;
    remarks: string;
  }) => mockApi.approveRequest(requestId, approverId, remarks)
);

export const rejectBalanceRequest = createAsyncThunk(
  "requests/reject",
  async ({
    requestId,
    rejectorId,
    reason,
  }: {
    requestId: string;
    rejectorId: string;
    reason: string;
  }) => mockApi.rejectRequest(requestId, rejectorId, reason)
);

interface RequestState {
  requests: PaginatedResponse<BalanceRequest> | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RequestState = {
  requests: null,
  isLoading: false,
  error: null,
};

const requestSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    clearRequestError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requests = action.payload;
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch requests";
      });
  },
});

export const { clearRequestError } = requestSlice.actions;
export default requestSlice.reducer;
