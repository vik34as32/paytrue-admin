"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/useAppStore";
import { UserRole } from "@/types";
import { ROUTES } from "@/constants";
import { STORAGE_KEYS } from "@/constants/storage";

const PUBLIC_ROUTES = [ROUTES.login, ROUTES.superAdminLogin];

const ROLE_ROUTES: Record<UserRole, string[]> = {
  super_admin: Object.values(ROUTES),
  admin: [
    ROUTES.admin,
    ROUTES.adminDashboard,
    ROUTES.adminMasterDistributor,
    ROUTES.adminCreateMasterDistributor,
    ROUTES.adminBalanceTransfer,
    ROUTES.adminHistory,
    ROUTES.adminProfile,
    ROUTES.adminChangePassword,
    ROUTES.adminReports,
    ROUTES.adminHierarchy,
    ROUTES.adminLedger,
    ROUTES.adminFundRequests,
  ],
  master_distributor: [
    ROUTES.dashboard,
    ROUTES.transactions,
    ROUTES.balanceTransfer,
    ROUTES.requests,
    ROUTES.reports,
    ROUTES.ledger,
    ROUTES.hierarchy,
    ROUTES.history,
    ROUTES.profile,
    ROUTES.settings,
    ROUTES.users,
  ],
  distributor: [
    ROUTES.dashboard,
    ROUTES.transactions,
    ROUTES.balanceTransfer,
    ROUTES.requests,
    ROUTES.ledger,
    ROUTES.hierarchy,
    ROUTES.history,
    ROUTES.profile,
    ROUTES.settings,
    ROUTES.users,
  ],
  retailer: [
    ROUTES.dashboard,
    ROUTES.transactions,
    ROUTES.requests,
    ROUTES.ledger,
    ROUTES.history,
    ROUTES.profile,
    ROUTES.settings,
  ],
};

const SUPER_ADMIN_API_ROUTES = [
  ROUTES.superAdmin,
  ROUTES.superAdminDashboard,
  ROUTES.superAdminAdmins,
  ROUTES.superAdminAddBalance,
  ROUTES.superAdminTransferBalance,
  ROUTES.superAdminWalletHistory,
  ROUTES.superAdminStatistics,
  ROUTES.superAdminRetailers,
  ROUTES.superAdminMasterDistributors,
  ROUTES.superAdminDistributors,
  ROUTES.superAdminFundRequests,
  ROUTES.superAdminChangePassword,
];

export function useAuthGuard(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAppSelector(
    (state) => state.auth
  );
  const superAdminAuth = useAppSelector((state) => state.superAdminAuth);

  useEffect(() => {
    if (isLoading || superAdminAuth.isLoading) return;

    const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
    const isSuperAdminApiRoute = SUPER_ADMIN_API_ROUTES.some((r) =>
      pathname.startsWith(r)
    );

    if (isSuperAdminApiRoute) {
      const hasSuperAdminSession =
        superAdminAuth.isAuthenticated ||
        (superAdminAuth.isLoading &&
          typeof window !== "undefined" &&
          !!localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN));

      if (!hasSuperAdminSession && pathname !== ROUTES.superAdminLogin) {
        router.replace(ROUTES.superAdminLogin);
      }
      return;
    }

    if (!isAuthenticated && !superAdminAuth.isAuthenticated && !isPublic) {
      router.replace(ROUTES.login);
      return;
    }

    if (isAuthenticated && pathname === ROUTES.login) {
      router.replace(
        user?.role === "admin" ? ROUTES.adminDashboard : ROUTES.dashboard
      );
      return;
    }

    if (
      isAuthenticated &&
      user?.role === "admin" &&
      pathname === ROUTES.dashboard
    ) {
      router.replace(ROUTES.adminDashboard);
      return;
    }

    if (superAdminAuth.isAuthenticated && pathname === ROUTES.superAdminLogin) {
      router.replace(ROUTES.superAdminDashboard);
      return;
    }

    if (isAuthenticated && user && !isPublic) {
      const allowed = ROLE_ROUTES[user.role] || [];
      const hasAccess =
        allowed.some((r) => pathname.startsWith(r)) ||
        pathname.startsWith("/super-admin") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/master-distributor") ||
        pathname.startsWith("/distributor") ||
        pathname.startsWith("/retailer");

      if (!hasAccess && user.role !== "super_admin") {
        router.replace(
          user.role === "admin" ? ROUTES.adminDashboard : ROUTES.dashboard
        );
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace(ROUTES.dashboard);
      }
    }
  }, [
    isAuthenticated,
    user,
    pathname,
    router,
    isLoading,
    allowedRoles,
    superAdminAuth.isAuthenticated,
    superAdminAuth.isLoading,
  ]);
}

export function useRoleAccess() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const superAdminAuth = useAppSelector((state) => state.superAdminAuth);
  const isSuperAdmin =
    superAdminAuth.isAuthenticated || user?.role === "super_admin";
  const isAdminApiAuth =
    isAuthenticated && user?.role === "admin" && !superAdminAuth.isAuthenticated;
  const canCreateUsers = isSuperAdmin;
  const canManageUsers = isSuperAdmin;
  const canApproveRequests =
    user?.role !== "retailer" && user?.role !== undefined;
  const canRequestBalance = user?.role === "retailer";
  const canTransferBalance = user?.role !== "retailer";

  return {
    user: superAdminAuth.isAuthenticated
      ? {
          id: superAdminAuth.user?.id || "",
          name: superAdminAuth.user?.name || superAdminAuth.user?.email || "Super Admin",
          email: superAdminAuth.user?.email || "",
          mobile: "",
          role: "super_admin" as UserRole,
          status: "active" as const,
          balance: 0,
        }
      : user,
    isSuperAdmin,
    isSuperAdminApiAuth: superAdminAuth.isAuthenticated,
    isAdminApiAuth,
    canCreateUsers,
    canManageUsers,
    canApproveRequests,
    canRequestBalance,
    canTransferBalance,
  };
}
