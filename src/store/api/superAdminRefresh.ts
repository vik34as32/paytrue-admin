import {
  fetchDashboard,
  fetchStatistics,
} from "@/store/api/superAdminApi";
import { fetchWalletBalance } from "@/store/api/superAdminWalletApi";

export async function refreshSuperAdminMetrics(
  dispatch: (action: unknown) => unknown
) {
  await Promise.all([
    dispatch(fetchWalletBalance({ force: true })),
    dispatch(fetchDashboard({ force: true })),
    dispatch(fetchStatistics({ force: true })),
  ]);
}
