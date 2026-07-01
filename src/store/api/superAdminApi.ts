import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getDashboard,
  getStatistics,
  getProfile,
  updateProfile,
  changePassword,
  getRetailers,
  getMasterDistributors,
  getDistributors,
  getAdmins,
  getAdminFundRequests,
} from "@/services/superAdminApi";
import { RootState } from "@/store";
import {
  ListQueryParams,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "@/types/superAdmin";

export const fetchDashboard = createAsyncThunk(
  "superAdmin/fetchDashboard",
  async (_arg: { force?: boolean } | undefined, { rejectWithValue }) => {
    try {
      return await getDashboard();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch dashboard"
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const { isLoadingDashboard, lastDashboardFetch } = (
        getState() as RootState
      ).superAdmin;
      if (isLoadingDashboard) return false;
      if (lastDashboardFetch && Date.now() - lastDashboardFetch < 30000) {
        return false;
      }
      return true;
    },
  }
);

export const fetchStatistics = createAsyncThunk(
  "superAdmin/fetchStatistics",
  async (_arg: { force?: boolean } | undefined, { rejectWithValue }) => {
    try {
      return await getStatistics();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch statistics"
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const { isLoadingStatistics, lastStatisticsFetch } = (
        getState() as RootState
      ).superAdmin;
      if (isLoadingStatistics) return false;
      if (lastStatisticsFetch && Date.now() - lastStatisticsFetch < 30000) {
        return false;
      }
      return true;
    },
  }
);

export const fetchSuperAdminProfile = createAsyncThunk(
  "superAdmin/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await getProfile();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch profile"
      );
    }
  }
);

export const updateSuperAdminProfile = createAsyncThunk(
  "superAdmin/updateProfile",
  async (payload: UpdateProfilePayload, { rejectWithValue }) => {
    try {
      return await updateProfile(payload);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  }
);

export const updateSuperAdminPassword = createAsyncThunk(
  "superAdmin/changePassword",
  async (payload: ChangePasswordPayload, { rejectWithValue }) => {
    try {
      await changePassword(payload);
      return true;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to change password"
      );
    }
  }
);

export const fetchRetailers = createAsyncThunk(
  "superAdmin/fetchRetailers",
  async (params: ListQueryParams, { rejectWithValue }) => {
    try {
      return { ...params, result: await getRetailers(params) };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch retailers"
      );
    }
  }
);

export const fetchMasterDistributors = createAsyncThunk(
  "superAdmin/fetchMasterDistributors",
  async (params: ListQueryParams, { rejectWithValue }) => {
    try {
      return { ...params, result: await getMasterDistributors(params) };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch master distributors"
      );
    }
  }
);

export const fetchDistributors = createAsyncThunk(
  "superAdmin/fetchDistributors",
  async (params: ListQueryParams, { rejectWithValue }) => {
    try {
      return { ...params, result: await getDistributors(params) };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch distributors"
      );
    }
  }
);

export const fetchAdminsList = createAsyncThunk(
  "superAdmin/fetchAdminsList",
  async (params: ListQueryParams, { rejectWithValue }) => {
    try {
      return { ...params, result: await getAdmins(params) };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch admins"
      );
    }
  }
);

export const fetchAdminFundRequests = createAsyncThunk(
  "superAdmin/fetchAdminFundRequests",
  async (
    { adminId, ...params }: ListQueryParams & { adminId: string },
    { rejectWithValue }
  ) => {
    try {
      return {
        adminId,
        ...params,
        result: await getAdminFundRequests(adminId, params),
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch fund requests"
      );
    }
  }
);
