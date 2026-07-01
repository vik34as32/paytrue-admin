import { RootState } from "@/store";
import { resolvePrimaryBalance } from "@/lib/walletBalance";
import { AdminWalletBalanceData } from "@/types/admin";

export const selectAdminDashboard = (state: RootState) =>
  state.adminModule.dashboard;
export const selectAdminBalance = (state: RootState) =>
  state.adminModule.balance;
export const selectAdminProfile = (state: RootState) =>
  state.adminModule.profile;
export const selectAdminMasterDistributors = (state: RootState) =>
  state.adminModule.masterDistributors;
export const selectAdminDistributors = (state: RootState) =>
  state.adminModule.distributors;
export const selectAdminRetailers = (state: RootState) =>
  state.adminModule.retailers;
export const selectAdminFundRequests = (state: RootState) =>
  state.adminModule.fundRequests;
export const selectAdminWalletHistory = (state: RootState) =>
  state.adminModule.walletHistory;
export const selectAdminTransferHistory = (state: RootState) =>
  state.adminModule.transferHistory;
export const selectAdminBusinessReport = (state: RootState) =>
  state.adminModule.businessReport;

export function resolveAdminPrimaryBalance(
  data: AdminWalletBalanceData | null
): number {
  if (!data) return 0;
  const priority = [
    "walletBalance",
    "balance",
    "availableBalance",
  ];
  for (const key of priority) {
    const val = data[key];
    if (typeof val === "number" && !Number.isNaN(val)) return val;
  }
  return resolvePrimaryBalance(data);
}

export function getDashboardMetric(
  dashboard: ReturnType<typeof selectAdminDashboard>,
  keys: string[],
  fallback = 0
): number {
  if (!dashboard) return fallback;
  for (const key of keys) {
    const val = dashboard[key];
    if (typeof val === "number") return val;
  }
  return fallback;
}
