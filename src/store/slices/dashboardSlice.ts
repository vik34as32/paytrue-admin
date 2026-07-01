import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllAdmins } from "@/services/admin";
import { getWalletHistory } from "@/services/superAdminWallet";
import {
  DashboardStats,
  ChartDataPoint,
  ActivityItem,
  User,
  Transaction,
} from "@/types";
import { WalletHistoryRecord, AdminRecord } from "@/types/superAdmin";
import { getAdminDisplayName } from "@/services/admin";

function adminToUser(admin: AdminRecord): User {
  const now = new Date().toISOString();
  return {
    id: admin.adminId || admin.id,
    name: getAdminDisplayName(admin),
    email: admin.email,
    mobile: admin.mobile,
    password: "",
    role: "admin",
    status: "active",
    balance: admin.currentWalletBalance ?? admin.walletBalance ?? admin.balance ?? 0,
    parentId: null,
    createdBy: null,
    createdAt: now,
    updatedAt: now,
  };
}

function historyToActivity(record: WalletHistoryRecord): ActivityItem {
  return {
    id: record.id,
    title: record.transactionType,
    description: record.remarks || record.adminName || "Wallet transaction",
    time: record.date || record.createdAt || new Date().toISOString(),
    type: "transaction",
  };
}

function buildChartFromHistory(history: WalletHistoryRecord[]): {
  monthly: ChartDataPoint[];
  revenue: ChartDataPoint[];
} {
  const monthlyMap = new Map<string, number>();
  history.forEach((item) => {
    const date = item.date || item.createdAt;
    if (!date) return;
    const month = date.slice(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + item.amount);
  });
  const monthly: ChartDataPoint[] = Array.from(monthlyMap.entries()).map(
    ([name, transactions]) => ({ name, value: transactions, transactions })
  );
  const revenue: ChartDataPoint[] = history.slice(0, 12).map((item, i) => ({
    name: `T${i + 1}`,
    value: item.amount,
    revenue: item.amount,
  }));
  return { monthly, revenue };
}

function buildStats(admins: AdminRecord[], history: WalletHistoryRecord[]): DashboardStats {
  const success = history.filter((h) =>
    (h.status || "").toLowerCase() === "success"
  ).length;
  const pending = history.filter((h) =>
    (h.status || "").toLowerCase() === "pending"
  ).length;
  const rejected = history.filter((h) =>
    (h.status || "").toLowerCase() === "rejected"
  ).length;

  return {
    totalRetailers: 0,
    totalDistributors: 0,
    totalAdmins: admins.length,
    totalMasterDistributors: 0,
    todayRetailers: 0,
    todayDistributors: 0,
    todayAdmins: 0,
    todayMasterDistributors: 0,
    todayTransactions: history.length,
    successTransactions: success,
    pendingTransactions: pending,
    rejectedTransactions: rejected,
  };
}

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const [admins, historyResult] = await Promise.all([
        getAllAdmins(),
        getWalletHistory({ page: 1, pageSize: 50 }),
      ]);
      return buildStats(admins, historyResult.data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch dashboard stats"
      );
    }
  }
);

export const fetchChartData = createAsyncThunk(
  "dashboard/fetchCharts",
  async (_, { rejectWithValue }) => {
    try {
      const historyResult = await getWalletHistory({ page: 1, pageSize: 100 });
      return buildChartFromHistory(historyResult.data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch chart data"
      );
    }
  }
);

export const fetchRecentActivities = createAsyncThunk(
  "dashboard/fetchActivities",
  async (_, { rejectWithValue }) => {
    try {
      const historyResult = await getWalletHistory({ page: 1, pageSize: 10 });
      return historyResult.data.map(historyToActivity);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch activities"
      );
    }
  }
);

export const fetchLatestUsers = createAsyncThunk(
  "dashboard/fetchLatestUsers",
  async (_, { rejectWithValue }) => {
    try {
      const admins = await getAllAdmins();
      return admins.slice(0, 5).map(adminToUser);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch admins"
      );
    }
  }
);

export const fetchLatestTransactions = createAsyncThunk(
  "dashboard/fetchLatestTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const historyResult = await getWalletHistory({ page: 1, pageSize: 5 });
      return historyResult.data.map((h) => ({
        id: h.transactionId || h.id,
        fromUserId: "",
        toUserId: h.adminId || "",
        fromUserName: "Super Admin",
        toUserName: h.adminName || "—",
        amount: h.amount,
        status: (h.status?.toLowerCase() || "success") as Transaction["status"],
        remarks: h.remarks || "",
        createdAt: h.date || h.createdAt || new Date().toISOString(),
      }));
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch transactions"
      );
    }
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
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  monthlyChart: [],
  revenueChart: [],
  activities: [],
  latestUsers: [],
  latestTransactions: [],
  isLoading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchChartData.fulfilled, (state, action) => {
        state.monthlyChart = action.payload.monthly;
        state.revenueChart = action.payload.revenue;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.activities = action.payload;
      })
      .addCase(fetchLatestUsers.fulfilled, (state, action) => {
        state.latestUsers = action.payload;
      })
      .addCase(fetchLatestTransactions.fulfilled, (state, action) => {
        state.latestTransactions = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
