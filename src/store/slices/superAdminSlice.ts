import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  SuperAdminDashboardData,
  SuperAdminStatisticsData,
  SuperAdminProfile,
  ListQueryParams,
  AdminRecord,
  NetworkUserRecord,
  AdminFundRequest,
} from "@/types/superAdmin";
import {
  fetchDashboard,
  fetchStatistics,
  fetchSuperAdminProfile,
  updateSuperAdminProfile,
  updateSuperAdminPassword,
  fetchRetailers,
  fetchMasterDistributors,
  fetchDistributors,
  fetchAdminsList,
  fetchAdminFundRequests,
} from "@/store/api/superAdminApi";

interface PaginatedListState<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  query: ListQueryParams;
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

interface SuperAdminState {
  dashboard: SuperAdminDashboardData | null;
  statistics: SuperAdminStatisticsData | null;
  profile: SuperAdminProfile | null;
  retailers: PaginatedListState<NetworkUserRecord>;
  masterDistributors: PaginatedListState<NetworkUserRecord>;
  distributors: PaginatedListState<NetworkUserRecord>;
  adminsList: PaginatedListState<AdminRecord>;
  fundRequests: PaginatedListState<AdminFundRequest> & { adminId: string | null };
  isLoadingDashboard: boolean;
  isLoadingStatistics: boolean;
  isLoadingProfile: boolean;
  profileUpdateLoading: boolean;
  changePasswordLoading: boolean;
  error: string | null;
  lastDashboardFetch: number | null;
  lastStatisticsFetch: number | null;
}

const initialState: SuperAdminState = {
  dashboard: null,
  statistics: null,
  profile: null,
  retailers: emptyListState(),
  masterDistributors: emptyListState(),
  distributors: emptyListState(),
  adminsList: emptyListState(),
  fundRequests: { ...emptyListState(), adminId: null },
  isLoadingDashboard: false,
  isLoadingStatistics: false,
  isLoadingProfile: false,
  profileUpdateLoading: false,
  changePasswordLoading: false,
  error: null,
  lastDashboardFetch: null,
  lastStatisticsFetch: null,
};

function applyListResult<T>(
  state: PaginatedListState<T>,
  params: ListQueryParams,
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

const superAdminSlice = createSlice({
  name: "superAdmin",
  initialState,
  reducers: {
    clearSuperAdminError: (state) => {
      state.error = null;
    },
    setFundRequestsAdminId: (state, action: PayloadAction<string | null>) => {
      state.fundRequests.adminId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.isLoadingDashboard = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.isLoadingDashboard = false;
        state.dashboard = action.payload;
        state.lastDashboardFetch = Date.now();
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.isLoadingDashboard = false;
        state.error = action.payload as string;
      })
      .addCase(fetchStatistics.pending, (state) => {
        state.isLoadingStatistics = true;
        state.error = null;
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.isLoadingStatistics = false;
        state.statistics = action.payload;
        state.lastStatisticsFetch = Date.now();
      })
      .addCase(fetchStatistics.rejected, (state, action) => {
        state.isLoadingStatistics = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSuperAdminProfile.pending, (state) => {
        state.isLoadingProfile = true;
      })
      .addCase(fetchSuperAdminProfile.fulfilled, (state, action) => {
        state.isLoadingProfile = false;
        state.profile = action.payload;
      })
      .addCase(fetchSuperAdminProfile.rejected, (state, action) => {
        state.isLoadingProfile = false;
        state.error = action.payload as string;
      })
      .addCase(updateSuperAdminProfile.pending, (state) => {
        state.profileUpdateLoading = true;
      })
      .addCase(updateSuperAdminProfile.fulfilled, (state, action) => {
        state.profileUpdateLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateSuperAdminProfile.rejected, (state, action) => {
        state.profileUpdateLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSuperAdminPassword.pending, (state) => {
        state.changePasswordLoading = true;
      })
      .addCase(updateSuperAdminPassword.fulfilled, (state) => {
        state.changePasswordLoading = false;
      })
      .addCase(updateSuperAdminPassword.rejected, (state, action) => {
        state.changePasswordLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRetailers.pending, (state) => {
        state.retailers.isLoading = true;
        state.retailers.error = null;
      })
      .addCase(fetchRetailers.fulfilled, (state, action) => {
        applyListResult(state.retailers, action.payload, action.payload.result);
      })
      .addCase(fetchRetailers.rejected, (state, action) => {
        state.retailers.isLoading = false;
        state.retailers.error = action.payload as string;
      })
      .addCase(fetchMasterDistributors.pending, (state) => {
        state.masterDistributors.isLoading = true;
        state.masterDistributors.error = null;
      })
      .addCase(fetchMasterDistributors.fulfilled, (state, action) => {
        applyListResult(
          state.masterDistributors,
          action.payload,
          action.payload.result
        );
      })
      .addCase(fetchMasterDistributors.rejected, (state, action) => {
        state.masterDistributors.isLoading = false;
        state.masterDistributors.error = action.payload as string;
      })
      .addCase(fetchDistributors.pending, (state) => {
        state.distributors.isLoading = true;
        state.distributors.error = null;
      })
      .addCase(fetchDistributors.fulfilled, (state, action) => {
        applyListResult(state.distributors, action.payload, action.payload.result);
      })
      .addCase(fetchDistributors.rejected, (state, action) => {
        state.distributors.isLoading = false;
        state.distributors.error = action.payload as string;
      })
      .addCase(fetchAdminsList.pending, (state) => {
        state.adminsList.isLoading = true;
        state.adminsList.error = null;
      })
      .addCase(fetchAdminsList.fulfilled, (state, action) => {
        applyListResult(state.adminsList, action.payload, action.payload.result);
      })
      .addCase(fetchAdminsList.rejected, (state, action) => {
        state.adminsList.isLoading = false;
        state.adminsList.error = action.payload as string;
      })
      .addCase(fetchAdminFundRequests.pending, (state) => {
        state.fundRequests.isLoading = true;
        state.fundRequests.error = null;
      })
      .addCase(fetchAdminFundRequests.fulfilled, (state, action) => {
        state.fundRequests.adminId = action.payload.adminId;
        applyListResult(state.fundRequests, action.payload, action.payload.result);
      })
      .addCase(fetchAdminFundRequests.rejected, (state, action) => {
        state.fundRequests.isLoading = false;
        state.fundRequests.error = action.payload as string;
      });
  },
});

export const { clearSuperAdminError, setFundRequestsAdminId } =
  superAdminSlice.actions;
export default superAdminSlice.reducer;
