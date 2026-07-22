import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store";

export const selectWalletBalance = (state: RootState) =>
  state.superAdminWallet.balance;

export const selectWalletHistory = (state: RootState) =>
  state.superAdminWallet.history;

export const selectWalletHistoryTotal = (state: RootState) =>
  state.superAdminWallet.historyTotal;

export const selectWalletAdmins = (state: RootState) =>
  state.superAdminWallet.admins;

const EMPTY_RECENT_TRANSFERS: RootState["superAdminWallet"]["history"] = [];

export const selectWalletLoading = createSelector(
  [
    (state: RootState) => state.superAdminWallet.isLoadingBalance,
    (state: RootState) => state.superAdminWallet.isLoadingHistory,
    (state: RootState) => state.superAdminWallet.isLoadingAdmins,
    (state: RootState) => state.superAdminWallet.addBalanceLoading,
    (state: RootState) => state.superAdminWallet.transferLoading,
    (state: RootState) => state.superAdminWallet.createAdminLoading,
  ],
  (balance, history, admins, addBalance, transfer, createAdmin) => ({
    balance,
    history,
    admins,
    addBalance,
    transfer,
    createAdmin,
  })
);

export const selectWalletError = (state: RootState) =>
  state.superAdminWallet.error;

/** Memoized slice of wallet history for dashboard recent transfers */
export const selectRecentTransfers = createSelector(
  [selectWalletHistory],
  (history) => {
    if (!history.length) return EMPTY_RECENT_TRANSFERS;
    return history.slice(0, 5);
  }
);

export const selectTotalAdmins = (state: RootState) =>
  state.superAdminWallet.admins.length;
