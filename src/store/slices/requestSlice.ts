import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchRequests = createAsyncThunk(
  "requests/fetchAll",
  async (_, { rejectWithValue }) =>
    rejectWithValue("Fund request live API not available")
);

export const createRequest = createAsyncThunk(
  "requests/create",
  async (_payload: unknown, { rejectWithValue }) =>
    rejectWithValue("Fund request live API not available")
);

export const approveRequest = createAsyncThunk(
  "requests/approve",
  async (_payload: unknown, { rejectWithValue }) =>
    rejectWithValue("Fund request live API not available")
);

export const rejectRequest = createAsyncThunk(
  "requests/reject",
  async (_payload: unknown, { rejectWithValue }) =>
    rejectWithValue("Fund request live API not available")
);

interface RequestState {
  requests: { data: never[]; total: number } | null;
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.requests = { data: [], total: 0 };
      });
  },
});

export default requestSlice.reducer;
