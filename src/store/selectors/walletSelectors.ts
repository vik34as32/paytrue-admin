import { RootState } from "@/store";

export const selectWalletBalance = (state: RootState) =>
  state.superAdminWallet.balance;

export const selectWalletHistory = (state: RootState) =>
  state.superAdminWallet.history;

export const selectWalletHistoryTotal = (state: RootState) =>
  state.superAdminWallet.historyTotal;

export const selectWalletAdmins = (state: RootState) =>
  state.superAdminWallet.admins;

export const selectWalletLoading = (state: RootState) => ({
  balance: state.superAdminWallet.isLoadingBalance,
  history: state.superAdminWallet.isLoadingHistory,
  admins: state.superAdminWallet.isLoadingAdmins,
  addBalance: state.superAdminWallet.addBalanceLoading,
  transfer: state.superAdminWallet.transferLoading,
  createAdmin: state.superAdminWallet.createAdminLoading,
});

export const selectWalletError = (state: RootState) =>
  state.superAdminWallet.error;

export const selectRecentTransfers = (state: RootState, limit = 5) =>
  state.superAdminWallet.history.slice(0, limit);

export const selectTotalAdmins = (state: RootState) =>
  state.superAdminWallet.admins.length;
