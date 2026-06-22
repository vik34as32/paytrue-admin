import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { mockApi } from "@/services/mockApi";
import {
  DashboardStats,
  ChartDataPoint,
  ActivityItem,
  User,
  Transaction,
} from "@/types";

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async () => mockApi.getDashboardStats()
);

export const fetchChartData = createAsyncThunk(
  "dashboard/fetchCharts",
  async () => mockApi.getChartData()
);

export const fetchRecentActivities = createAsyncThunk(
  "dashboard/fetchActivities",
  async () => mockApi.getRecentActivities()
);

export const fetchLatestUsers = createAsyncThunk(
  "dashboard/fetchLatestUsers",
  async () => {
    const result = await mockApi.getUsers({ page: 1, pageSize: 5 });
    return result.data;
  }
);

export const fetchLatestTransactions = createAsyncThunk(
  "dashboard/fetchLatestTransactions",
  async () => {
    const result = await mockApi.getTransactions({ page: 1, pageSize: 5 });
    return result.data;
  }
);

interface DashboardState {
  stats: DashboardStats | null;
  monthlyChart: ChartDataPoint[];
  revenueChart: ChartDataPoint[];
  activities: ActivityItem[];
  latestUsers: User[];
  latestTransactions: Transaction[];
  isLoading: boolean;
}

const initialState: DashboardState = {
  stats: null,
  monthlyChart: [],
  revenueChart: [],
  activities: [],
  latestUsers: [],
  latestTransactions: [],
  isLoading: false,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchChartData.fulfilled, (state, action) => {
        state.monthlyChart = action.payload.monthly;
        state.revenueChart = action.payload.revenue;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.activities = action.payload;
      })
      .addCase(fetchLatestUsers.fulfilled, (state, action) => {
        state.latestUsers = action.payload as User[];
      })
      .addCase(fetchLatestTransactions.fulfilled, (state, action) => {
        state.latestTransactions = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
