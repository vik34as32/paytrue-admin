import { createSlice } from "@reduxjs/toolkit";
import {
  AdminDashboardData,
  AdminWalletBalanceData,
  AdminWalletHistoryRecord,
  AdminProfile,
  AdminNetworkUser,
  AdminFundRequestRecord,
  AdminBusinessReportData,
  AdminListQueryParams,
} from "@/types/admin";
import {
  fetchAdminDashboard,
  fetchAdminWalletBalance,
  fetchAdminWalletHistory,
  fetchAdminTransferHistory,
  adminTransferBalance,
  adminDeductBalance,
  fetchAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
  fetchAdminMasterDistributors,
  registerUser,
  fetchAdminDistributors,
  fetchAdminRetailers,
  submitAdminFundRequest,
  fetchAdminFundRequests,
  approveAdminFundRequest,
  rejectAdminFundRequest,
  fetchAdminBusinessReport,
  loadAdminSession,
} from "@/store/api/adminModuleApi";

interface PaginatedListState<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  query: AdminListQueryParams;
}

function emptyListState<T>(): PaginatedListState<T> {
  return {
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    isLoading: false,
    error: null,
    query: {},
  };
}

function applyListResult<T>(
  state: PaginatedListState<T>,
  params: AdminListQueryParams,
  payload: {
    data: T[];
    total?: number;
    page?: number;
    pageSize?: number;
  }
) {
  state.isLoading = false;
  state.data = payload.data;
  state.total = payload.total ?? payload.data.length;
  state.page = payload.page ?? params.page ?? 1;
  state.pageSize = payload.pageSize ?? params.pageSize ?? state.pageSize;
  state.query = params;
  state.error = null;
}

interface AdminModuleState {
  dashboard: AdminDashboardData | null;
  balance: AdminWalletBalanceData | null;
  walletHistory: PaginatedListState<AdminWalletHistoryRecord>;
  transferHistory: PaginatedListState<AdminWalletHistoryRecord>;
  masterDistributors: PaginatedListState<AdminNetworkUser>;
  distributors: PaginatedListState<AdminNetworkUser>;
  retailers: PaginatedListState<AdminNetworkUser>;
  fundRequests: PaginatedListState<AdminFundRequestRecord>;
  businessReport: AdminBusinessReportData | null;
  profile: AdminProfile | null;
  isLoadingDashboard: boolean;
  isLoadingBalance: boolean;
  isLoadingProfile: boolean;
  profileUpdateLoading: boolean;
  changePasswordLoading: boolean;
  transferLoading: boolean;
  deductLoading: boolean;
  fundRequestLoading: boolean;
  fundRequestActionLoading: boolean;
  createUserLoading: boolean;
  isLoadingBusinessReport: boolean;
  isSessionLoading: boolean;
  error: string | null;
  lastDashboardFetch: number | null;
}

const initialState: AdminModuleState = {
  dashboard: null,
  balance: null,
  walletHistory: emptyListState(),
  transferHistory: emptyListState(),
  masterDistributors: emptyListState(),
  distributors: emptyListState(),
  retailers: emptyListState(),
  fundRequests: emptyListState(),
  businessReport: null,
  profile: null,
  isLoadingDashboard: false,
  isLoadingBalance: false,
  isLoadingProfile: false,
  profileUpdateLoading: false,
  changePasswordLoading: false,
  transferLoading: false,
  deductLoading: false,
  fundRequestLoading: false,
  fundRequestActionLoading: false,
  createUserLoading: false,
  isLoadingBusinessReport: false,
  isSessionLoading: false,
  error: null,
  lastDashboardFetch: null,
};

const adminModuleSlice = createSlice({
  name: "adminModule",
  initialState,
  reducers: {
    clearAdminModuleError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAdminSession.pending, (state) => {
        state.isSessionLoading = true;
      })
      .addCase(loadAdminSession.fulfilled, (state) => {
        state.isSessionLoading = false;
      })
      .addCase(loadAdminSession.rejected, (state) => {
        state.isSessionLoading = false;
      })
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoadingDashboard = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoadingDashboard = false;
        state.dashboard = action.payload;
        state.lastDashboardFetch = Date.now();
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoadingDashboard = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminWalletBalance.pending, (state) => {
        state.isLoadingBalance = true;
        state.error = null;
      })
      .addCase(fetchAdminWalletBalance.fulfilled, (state, action) => {
        state.isLoadingBalance = false;
        state.balance = action.payload;
      })
      .addCase(fetchAdminWalletBalance.rejected, (state, action) => {
        state.isLoadingBalance = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminWalletHistory.pending, (state) => {
        state.walletHistory.isLoading = true;
        state.walletHistory.error = null;
      })
      .addCase(fetchAdminWalletHistory.fulfilled, (state, action) => {
        applyListResult(
          state.walletHistory,
          action.payload,
          action.payload.result
        );
      })
      .addCase(fetchAdminWalletHistory.rejected, (state, action) => {
        state.walletHistory.isLoading = false;
        state.walletHistory.error = action.payload as string;
      })
      .addCase(fetchAdminTransferHistory.pending, (state) => {
        state.transferHistory.isLoading = true;
        state.transferHistory.error = null;
      })
      .addCase(fetchAdminTransferHistory.fulfilled, (state, action) => {
        applyListResult(
          state.transferHistory,
          action.payload,
          action.payload.result
        );
      })
      .addCase(fetchAdminTransferHistory.rejected, (state, action) => {
        state.transferHistory.isLoading = false;
        state.transferHistory.error = action.payload as string;
      })
      .addCase(adminTransferBalance.pending, (state) => {
        state.transferLoading = true;
        state.error = null;
      })
      .addCase(adminTransferBalance.fulfilled, (state) => {
        state.transferLoading = false;
      })
      .addCase(adminTransferBalance.rejected, (state, action) => {
        state.transferLoading = false;
        state.error = action.payload as string;
      })
      .addCase(adminDeductBalance.pending, (state) => {
        state.deductLoading = true;
        state.error = null;
      })
      .addCase(adminDeductBalance.fulfilled, (state) => {
        state.deductLoading = false;
      })
      .addCase(adminDeductBalance.rejected, (state, action) => {
        state.deductLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminProfile.pending, (state) => {
        state.isLoadingProfile = true;
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.isLoadingProfile = false;
        state.profile = action.payload;
      })
      .addCase(fetchAdminProfile.rejected, (state, action) => {
        state.isLoadingProfile = false;
        state.error = action.payload as string;
      })
      .addCase(updateAdminProfile.pending, (state) => {
        state.profileUpdateLoading = true;
      })
      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.profileUpdateLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.profileUpdateLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateAdminPassword.pending, (state) => {
        state.changePasswordLoading = true;
      })
      .addCase(updateAdminPassword.fulfilled, (state) => {
        state.changePasswordLoading = false;
      })
      .addCase(updateAdminPassword.rejected, (state, action) => {
        state.changePasswordLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminMasterDistributors.pending, (state) => {
        state.masterDistributors.isLoading = true;
        state.masterDistributors.error = null;
      })
      .addCase(fetchAdminMasterDistributors.fulfilled, (state, action) => {
        applyListResult(
          state.masterDistributors,
          action.payload,
          action.payload.result
        );
      })
      .addCase(fetchAdminMasterDistributors.rejected, (state, action) => {
        state.masterDistributors.isLoading = false;
        state.masterDistributors.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.createUserLoading = true;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.createUserLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.createUserLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminDistributors.pending, (state) => {
        state.distributors.isLoading = true;
        state.distributors.error = null;
      })
      .addCase(fetchAdminDistributors.fulfilled, (state, action) => {
        applyListResult(
          state.distributors,
          action.payload,
          action.payload.result
        );
      })
      .addCase(fetchAdminDistributors.rejected, (state, action) => {
        state.distributors.isLoading = false;
        state.distributors.error = action.payload as string;
      })
      .addCase(fetchAdminRetailers.pending, (state) => {
        state.retailers.isLoading = true;
        state.retailers.error = null;
      })
      .addCase(fetchAdminRetailers.fulfilled, (state, action) => {
        applyListResult(state.retailers, action.payload, action.payload.result);
      })
      .addCase(fetchAdminRetailers.rejected, (state, action) => {
        state.retailers.isLoading = false;
        state.retailers.error = action.payload as string;
      })
      .addCase(submitAdminFundRequest.pending, (state) => {
        state.fundRequestLoading = true;
      })
      .addCase(submitAdminFundRequest.fulfilled, (state) => {
        state.fundRequestLoading = false;
      })
      .addCase(submitAdminFundRequest.rejected, (state, action) => {
        state.fundRequestLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminFundRequests.pending, (state) => {
        state.fundRequests.isLoading = true;
        state.fundRequests.error = null;
      })
      .addCase(fetchAdminFundRequests.fulfilled, (state, action) => {
        applyListResult(
          state.fundRequests,
          action.payload,
          action.payload.result
        );
      })
      .addCase(fetchAdminFundRequests.rejected, (state, action) => {
        state.fundRequests.isLoading = false;
        state.fundRequests.error = action.payload as string;
      })
      .addCase(approveAdminFundRequest.pending, (state) => {
        state.fundRequestActionLoading = true;
        state.error = null;
      })
      .addCase(approveAdminFundRequest.fulfilled, (state) => {
        state.fundRequestActionLoading = false;
      })
      .addCase(approveAdminFundRequest.rejected, (state, action) => {
        state.fundRequestActionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(rejectAdminFundRequest.pending, (state) => {
        state.fundRequestActionLoading = true;
        state.error = null;
      })
      .addCase(rejectAdminFundRequest.fulfilled, (state) => {
        state.fundRequestActionLoading = false;
      })
      .addCase(rejectAdminFundRequest.rejected, (state, action) => {
        state.fundRequestActionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminBusinessReport.pending, (state) => {
        state.isLoadingBusinessReport = true;
      })
      .addCase(fetchAdminBusinessReport.fulfilled, (state, action) => {
        state.isLoadingBusinessReport = false;
        state.businessReport = action.payload.result;
      })
      .addCase(fetchAdminBusinessReport.rejected, (state, action) => {
        state.isLoadingBusinessReport = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAdminModuleError } = adminModuleSlice.actions;
export default adminModuleSlice.reducer;
