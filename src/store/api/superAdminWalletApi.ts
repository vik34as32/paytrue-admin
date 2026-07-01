import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getWalletBalance,
  addVirtualBalance,
  transferBalanceToAdmin,
  getWalletHistory,
} from "@/services/superAdminWallet";
import { RootState } from "@/store";
import { createAdmin as registerAdmin, getAllAdmins } from "@/services/admin";
import {
  AddBalancePayload,
  TransferBalancePayload,
  CreateAdminPayload,
  WalletHistoryParams,
} from "@/types/superAdmin";
import { refreshSuperAdminMetrics } from "@/store/api/superAdminRefresh";

export const fetchWalletBalance = createAsyncThunk(
  "superAdminWallet/fetchBalance",
  async (_arg: { force?: boolean } | undefined, { rejectWithValue }) => {
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
      const { isLoadingBalance } = (getState() as RootState).superAdminWallet;
      return !isLoadingBalance;
    },
  }
);

export const addBalance = createAsyncThunk(
  "superAdminWallet/addBalance",
  async (payload: AddBalancePayload, { dispatch, rejectWithValue }) => {
    try {
      const result = await addVirtualBalance(payload);
      await refreshSuperAdminMetrics(dispatch);
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add balance"
      );
    }
  }
);

export const transferToAdmin = createAsyncThunk(
  "superAdminWallet/transfer",
  async (payload: TransferBalancePayload, { dispatch, rejectWithValue }) => {
    try {
      await transferBalanceToAdmin(payload);
      await refreshSuperAdminMetrics(dispatch);
      await dispatch(fetchAllAdmins());
      await dispatch(fetchWalletHistory({ page: 1, pageSize: 10 }));
      return payload;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Transfer failed"
      );
    }
  }
);

/** Alias for spec compatibility */
export const transferBalance = transferToAdmin;

export const fetchWalletHistory = createAsyncThunk(
  "superAdminWallet/fetchHistory",
  async (params: WalletHistoryParams, { rejectWithValue }) => {
    try {
      return await getWalletHistory(params);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch history"
      );
    }
  }
);

export const fetchAllAdmins = createAsyncThunk(
  "superAdminWallet/fetchAdmins",
  async (_, { rejectWithValue }) => {
    try {
      return await getAllAdmins();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch admins"
      );
    }
  }
);

export const createAdminAccount = createAsyncThunk(
  "superAdminWallet/createAdmin",
  async (payload: CreateAdminPayload, { dispatch, rejectWithValue }) => {
    try {
      const result = await registerAdmin(payload);
      await dispatch(fetchAllAdmins());
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create admin"
      );
    }
  }
);

/** Alias for spec compatibility */
export { createAdminAccount as createAdmin };
