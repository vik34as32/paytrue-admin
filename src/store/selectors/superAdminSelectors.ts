import { RootState } from "@/store";
import { SuperAdminStatisticsData } from "@/types/superAdmin";
import { formatBalanceFieldLabel } from "@/lib/walletBalance";
import { sanitizePersonName } from "@/lib/personName";

export const selectDashboard = (state: RootState) => state.superAdmin.dashboard;
export const selectStatistics = (state: RootState) => state.superAdmin.statistics;
export const selectSuperAdminProfile = (state: RootState) =>
  state.superAdmin.profile;
export const selectRetailersList = (state: RootState) =>
  state.superAdmin.retailers;
export const selectMasterDistributorsList = (state: RootState) =>
  state.superAdmin.masterDistributors;
export const selectDistributorsList = (state: RootState) =>
  state.superAdmin.distributors;
export const selectAdminsList = (state: RootState) => state.superAdmin.adminsList;
export const selectFundRequests = (state: RootState) =>
  state.superAdmin.fundRequests;

export function flattenStatistics(
  stats: SuperAdminStatisticsData | null
): { section: string; label: string; value: number }[] {
  if (!stats) return [];

  const sections: { key: keyof SuperAdminStatisticsData; title: string }[] = [
    { key: "users", title: "Users" },
    { key: "transactions", title: "Transactions" },
    { key: "business", title: "Business" },
    { key: "wallet", title: "Wallet" },
    { key: "fundRequests", title: "Fund Requests" },
    { key: "profit", title: "Profit" },
  ];

  const rows: { section: string; label: string; value: number }[] = [];

  for (const { key, title } of sections) {
    const group = stats[key];
    if (group && typeof group === "object" && !Array.isArray(group)) {
      for (const [field, value] of Object.entries(group)) {
        if (typeof value === "number") {
          rows.push({
            section: title,
            label: formatBalanceFieldLabel(field),
            value,
          });
        }
      }
    }
  }

  if (rows.length === 0) {
    for (const [field, value] of Object.entries(stats)) {
      if (typeof value === "number") {
        rows.push({
          section: "Overview",
          label: formatBalanceFieldLabel(field),
          value,
        });
      }
    }
  }

  return rows;
}

export function getNetworkUserName(user: {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}): string {
  const named = sanitizePersonName(user.name, user.firstName, user.lastName);
  if (named) return named;
  return user.email || "—";
}
