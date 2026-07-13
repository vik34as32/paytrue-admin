import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getWalletBalance,
  addVirtualBalance,
  transferBalanceToAdmin,
  deductBalanceFromUser,
  getWalletHistory,
  getTransferHistory,
} from "@/services/superAdminWallet";
import { RootState } from "@/store";
import { createAdmin as registerAdmin, getAllAdmins } from "@/services/admin";
import {
  AddBalancePayload,
  CreateAdminPayload,
  WalletHistoryParams,
  ListQueryParams,
} from "@/types/superAdmin";
import type { WalletTransferPayload, WalletDeductInput } from "@/types/wallet";
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
  async (payload: WalletTransferPayload, { dispatch, rejectWithValue }) => {
    try {
      await transferBalanceToAdmin(payload);
      await refreshSuperAdminMetrics(dispatch);
      await dispatch(fetchTransferHistory({ page: 1, pageSize: 10 }));
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

export const deductFromUser = createAsyncThunk(
  "superAdminWallet/deduct",
  async (payload: WalletDeductInput, { dispatch, rejectWithValue }) => {
    try {
      await deductBalanceFromUser(payload);
      await refreshSuperAdminMetrics(dispatch);
      // Deduct movements live on /wallet/transfers (not wallet-history enum)
      await dispatch(fetchTransferHistory({ page: 1, pageSize: 10 }));
      return payload;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Deduction failed"
      );
    }
  }
);

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

/** GET /wallet/transfers — used by Transfer Balance / Deduct Balance pages */
export const fetchTransferHistory = createAsyncThunk(
  "superAdminWallet/fetchTransferHistory",
  async (params: ListQueryParams, { rejectWithValue }) => {
    try {
      return await getTransferHistory(params);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch transfer history"
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
