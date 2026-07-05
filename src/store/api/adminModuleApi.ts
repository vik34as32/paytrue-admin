import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getDashboard,
  getWalletBalance,
  getWalletHistory,
  getTransferHistory,
  transferBalance,
  getProfile,
  updateProfile,
  changePassword,
  getMasterDistributors,
  createUser,
  getDistributors,
  getRetailers,
  createFundRequest,
  getFundRequests,
  approveFundRequest,
  rejectFundRequest,
  getBusinessReport,
} from "@/services/adminApi";
import { RootState } from "@/store";
import {
  AdminListQueryParams,
  AdminTransferPayload,
  AdminFundRequestPayload,
  AdminApproveFundRequestPayload,
  AdminRejectFundRequestPayload,
  AdminUpdateProfilePayload,
  AdminChangePasswordPayload,
} from "@/types/admin";
import {
  AdminCreateUserType,
  UserFormValues,
} from "@/validations/userStepSchemas";
import { getAdminToken } from "@/services/adminAuth";

export const loadAdminSession = createAsyncThunk(
  "adminModule/loadSession",
  async (_, { dispatch }) => {
    const token = getAdminToken();
    if (!token) return null;
    void dispatch(fetchAdminWalletBalance({ force: true }));
    void dispatch(fetchAdminDashboard({ force: true }));
    return true;
  }
);

export const fetchAdminDashboard = createAsyncThunk(
  "adminModule/fetchDashboard",
  async (_arg: { force?: boolean } | undefined, { rejectWithValue, getState }) => {
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
      ).adminModule;
      if (isLoadingDashboard) return false;
      if (lastDashboardFetch && Date.now() - lastDashboardFetch < 30000) {
        return false;
      }
      return true;
    },
  }
);

export const fetchAdminWalletBalance = createAsyncThunk(
  "adminModule/fetchWalletBalance",
  async (_arg: { force?: boolean } | undefined, { rejectWithValue, getState }) => {
    try {
      return await getWalletBalance();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch balance"
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const { isLoadingBalance } = (getState() as RootState).adminModule;
      return !isLoadingBalance;
    },
  }
);

export const fetchAdminWalletHistory = createAsyncThunk(
  "adminModule/fetchWalletHistory",
  async (params: AdminListQueryParams, { rejectWithValue }) => {
    try {
      return { ...params, result: await getWalletHistory(params) };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch wallet history"
      );
    }
  }
);

export const fetchAdminTransferHistory = createAsyncThunk(
  "adminModule/fetchTransferHistory",
  async (params: AdminListQueryParams, { rejectWithValue }) => {
    try {
      return { ...params, result: await getTransferHistory(params) };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch transfer history"
      );
    }
  }
);

export const adminTransferBalance = createAsyncThunk(
  "adminModule/transferBalance",
  async (payload: AdminTransferPayload, { dispatch, rejectWithValue }) => {
    try {
      await transferBalance(payload);
      await Promise.all([
        dispatch(fetchAdminWalletBalance({ force: true })),
        dispatch(fetchAdminDashboard({ force: true })),
        dispatch(fetchAdminTransferHistory({ page: 1, pageSize: 10 })),
      ]);
      return payload;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Transfer failed"
      );
    }
  }
);

export const fetchAdminProfile = createAsyncThunk(
  "adminModule/fetchProfile",
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

export const updateAdminProfile = createAsyncThunk(
  "adminModule/updateProfile",
  async (payload: AdminUpdateProfilePayload, { rejectWithValue }) => {
    try {
      return await updateProfile(payload);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  }
);

export const updateAdminPassword = createAsyncThunk(
  "adminModule/changePassword",
  async (payload: AdminChangePasswordPayload, { rejectWithValue }) => {
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

export const fetchAdminMasterDistributors = createAsyncThunk(
  "adminModule/fetchMasterDistributors",
  async (params: AdminListQueryParams, { rejectWithValue }) => {
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

export interface RegisterUserPayload {
  data: UserFormValues;
  userType: AdminCreateUserType;
}

export const registerUser = createAsyncThunk(
  "adminModule/registerUser",
  async (payload: RegisterUserPayload, { dispatch, rejectWithValue }) => {
    try {
      const result = await createUser(payload.data, payload.userType);
      if (payload.userType === "MASTER_DISTRIBUTOR") {
        await dispatch(fetchAdminMasterDistributors({ page: 1, pageSize: 10 }));
      } else if (payload.userType === "DISTRIBUTOR") {
        await dispatch(fetchAdminDistributors({ page: 1, pageSize: 10 }));
      } else {
        await dispatch(fetchAdminRetailers({ page: 1, pageSize: 10 }));
      }
      await dispatch(fetchAdminDashboard({ force: true }));
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create user"
      );
    }
  }
);

export const fetchAdminDistributors = createAsyncThunk(
  "adminModule/fetchDistributors",
  async (params: AdminListQueryParams, { rejectWithValue }) => {
    try {
      return { ...params, result: await getDistributors(params) };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch distributors"
      );
    }
  }
);

export const fetchAdminRetailers = createAsyncThunk(
  "adminModule/fetchRetailers",
  async (params: AdminListQueryParams, { rejectWithValue }) => {
    try {
      return { ...params, result: await getRetailers(params) };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch retailers"
      );
    }
  }
);

export const submitAdminFundRequest = createAsyncThunk(
  "adminModule/createFundRequest",
  async (payload: AdminFundRequestPayload, { dispatch, rejectWithValue }) => {
    try {
      const result = await createFundRequest(payload);
      await dispatch(fetchAdminFundRequests({ page: 1, pageSize: 10 }));
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to submit fund request"
      );
    }
  }
);

export const fetchAdminFundRequests = createAsyncThunk(
  "adminModule/fetchFundRequests",
  async (params: AdminListQueryParams, { rejectWithValue }) => {
    try {
      return { ...params, result: await getFundRequests(params) };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch fund requests"
      );
    }
  }
);

export const approveAdminFundRequest = createAsyncThunk(
  "adminModule/approveFundRequest",
  async (payload: AdminApproveFundRequestPayload, { dispatch, rejectWithValue }) => {
    try {
      const result = await approveFundRequest(payload);
      await dispatch(fetchAdminWalletBalance({ force: true }));
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to approve fund request"
      );
    }
  }
);

export const rejectAdminFundRequest = createAsyncThunk(
  "adminModule/rejectFundRequest",
  async (payload: AdminRejectFundRequestPayload, { dispatch, rejectWithValue }) => {
    try {
      const result = await rejectFundRequest(payload);
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to reject fund request"
      );
    }
  }
);

export const fetchAdminBusinessReport = createAsyncThunk(
  "adminModule/fetchBusinessReport",
  async (params: AdminListQueryParams, { rejectWithValue }) => {
    try {
      return { ...params, result: await getBusinessReport(params) };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch business report"
      );
    }
  }
);
