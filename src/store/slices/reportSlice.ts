import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { mockApi } from "@/services/mockApi";
import { HistoryEntry, TableFilters, PaginatedResponse } from "@/types";

export const fetchHistory = createAsyncThunk(
  "history/fetchAll",
  async (filters?: TableFilters) => mockApi.getHistory(filters)
);

export const fetchHierarchy = createAsyncThunk(
  "history/fetchHierarchy",
  async () => mockApi.getHierarchy()
);

interface ReportState {
  history: PaginatedResponse<HistoryEntry> | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  history: null,
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
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history = action.payload;
      });
  },
});

export default reportSlice.reducer;
