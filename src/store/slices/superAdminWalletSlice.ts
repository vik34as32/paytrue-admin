import { createSlice } from "@reduxjs/toolkit";
import {
  AdminRecord,
  WalletBalanceData,
  WalletHistoryRecord,
} from "@/types/superAdmin";
import {
  fetchWalletBalance,
  addBalance,
  transferToAdmin,
  fetchWalletHistory,
  fetchAllAdmins,
  createAdminAccount,
} from "@/store/api/superAdminWalletApi";

interface SuperAdminWalletState {
  balance: WalletBalanceData | null;
  admins: AdminRecord[];
  history: WalletHistoryRecord[];
  historyTotal: number;
  historyPage: number;
  historyPageSize: number;
  historySearch: string;
  isLoadingBalance: boolean;
  isLoadingAdmins: boolean;
  isLoadingHistory: boolean;
  addBalanceLoading: boolean;
  transferLoading: boolean;
  createAdminLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

const initialState: SuperAdminWalletState = {
  balance: null,
  admins: [],
  history: [],
  historyTotal: 0,
  historyPage: 1,
  historyPageSize: 10,
  historySearch: "",
  isLoadingBalance: false,
  isLoadingAdmins: false,
  isLoadingHistory: false,
  addBalanceLoading: false,
  transferLoading: false,
  createAdminLoading: false,
  error: null,
  lastFetchedAt: null,
};

const superAdminWalletSlice = createSlice({
  name: "superAdminWallet",
  initialState,
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletBalance.pending, (state) => {
        state.isLoadingBalance = true;
        state.error = null;
      })
      .addCase(fetchWalletBalance.fulfilled, (state, action) => {
        state.isLoadingBalance = false;
        state.balance = action.payload;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchWalletBalance.rejected, (state, action) => {
        state.isLoadingBalance = false;
        state.error = action.payload as string;
      })
      .addCase(addBalance.pending, (state) => {
        state.addBalanceLoading = true;
        state.error = null;
      })
      .addCase(addBalance.fulfilled, (state, action) => {
        state.addBalanceLoading = false;
        state.balance = action.payload;
        state.lastFetchedAt = Date.now();
      })
      .addCase(addBalance.rejected, (state, action) => {
        state.addBalanceLoading = false;
        state.error = action.payload as string;
      })
      .addCase(transferToAdmin.pending, (state) => {
        state.transferLoading = true;
        state.error = null;
      })
      .addCase(transferToAdmin.fulfilled, (state) => {
        state.transferLoading = false;
      })
      .addCase(transferToAdmin.rejected, (state, action) => {
        state.transferLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWalletHistory.pending, (state) => {
        state.isLoadingHistory = true;
        state.error = null;
      })
      .addCase(fetchWalletHistory.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        state.history = action.payload.data;
        state.historyTotal = action.payload.total ?? action.payload.data.length;
        state.historyPage = action.payload.page ?? state.historyPage;
        state.historyPageSize = action.payload.pageSize ?? state.historyPageSize;
      })
      .addCase(fetchWalletHistory.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAllAdmins.pending, (state) => {
        state.isLoadingAdmins = true;
        state.error = null;
      })
      .addCase(fetchAllAdmins.fulfilled, (state, action) => {
        state.isLoadingAdmins = false;
        state.admins = action.payload;
      })
      .addCase(fetchAllAdmins.rejected, (state, action) => {
        state.isLoadingAdmins = false;
        state.error = action.payload as string;
      })
      .addCase(createAdminAccount.pending, (state) => {
        state.createAdminLoading = true;
        state.error = null;
      })
      .addCase(createAdminAccount.fulfilled, (state) => {
        state.createAdminLoading = false;
      })
      .addCase(createAdminAccount.rejected, (state, action) => {
        state.createAdminLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearWalletError } = superAdminWalletSlice.actions;
export default superAdminWalletSlice.reducer;
