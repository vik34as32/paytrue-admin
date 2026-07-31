import { ROUTES } from "@/constants";
import { UserRole } from "@/types";

/** Role-aware post-login destination. */
export function getDashboardRouteForRole(role?: UserRole | null): string {
  switch (role) {
    case "super_admin":
      return ROUTES.superAdminDashboard;
    case "admin":
      return ROUTES.adminDashboard;
    case "master_distributor":
    case "distributor":
    case "retailer":
      return ROUTES.dashboard;
    default:
      return ROUTES.dashboard;
  }
}
