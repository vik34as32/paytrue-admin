"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/useAppStore";
import { UserRole } from "@/types";
import { ROUTES } from "@/constants";
import { selectIsAuthRestoring } from "@/store/selectors/authSelectors";
import { hasPersistedAdminSession, hasPersistedSuperAdminSession } from "@/lib/authSession";
import { isAdminRole } from "@/lib/normalizeAuthRole";

const PUBLIC_ROUTES = [ROUTES.login, ROUTES.superAdminLogin];

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
  ROUTES.superAdminBankAccounts,
  ROUTES.superAdminCreateAdmin,
];

const ROLE_ROUTES: Record<UserRole, string[]> = {
  super_admin: [
    ...SUPER_ADMIN_API_ROUTES,
    ROUTES.hierarchy,
    ROUTES.profile,
    ROUTES.settings,
  ],
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
    ROUTES.adminAssignBankAccount,
    ROUTES.adminCommissionManagement,
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

export function useAuthGuard(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated,
    user,
    isInitialized,
  } = useAppSelector((state) => state.auth);
  const superAdminAuth = useAppSelector((state) => state.superAdminAuth);
  const isRestoring = useAppSelector(selectIsAuthRestoring);

  useEffect(() => {
    if (isRestoring) return;

    const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
    const isSuperAdminApiRoute = SUPER_ADMIN_API_ROUTES.some((r) =>
      pathname.startsWith(r)
    );

    if (isSuperAdminApiRoute) {
      if (!superAdminAuth.isAuthenticated && pathname !== ROUTES.superAdminLogin) {
        router.replace(ROUTES.superAdminLogin);
      }
      return;
    }

    if (!isAuthenticated && !superAdminAuth.isAuthenticated && !isPublic) {
      if (hasPersistedAdminSession() || hasPersistedSuperAdminSession()) {
        return;
      }
      router.replace(ROUTES.login);
      return;
    }

    if (isAuthenticated && pathname === ROUTES.login) {
      router.replace(
        isAdminRole(user) ? ROUTES.adminDashboard : ROUTES.dashboard
      );
      return;
    }

    if (
      isAuthenticated &&
      isAdminRole(user) &&
      pathname === ROUTES.dashboard
    ) {
      router.replace(ROUTES.adminDashboard);
      return;
    }

    if (superAdminAuth.isAuthenticated && pathname === ROUTES.superAdminLogin) {
      router.replace(ROUTES.superAdminDashboard);
      return;
    }

    if (superAdminAuth.isAuthenticated) {
      const superAdminAllowed = ROLE_ROUTES.super_admin.some((r) =>
        pathname.startsWith(r)
      );
      if (!superAdminAllowed && !isPublic) {
        router.replace(ROUTES.superAdminDashboard);
        return;
      }
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
          isAdminRole(user) ? ROUTES.adminDashboard : ROUTES.dashboard
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
    isInitialized,
    allowedRoles,
    superAdminAuth.isAuthenticated,
    superAdminAuth.isInitialized,
    isRestoring,
  ]);
}

export function useRoleAccess() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const superAdminAuth = useAppSelector((state) => state.superAdminAuth);
  const isSuperAdmin =
    superAdminAuth.isAuthenticated || user?.role === "super_admin";
  const isAdminApiAuth =
    isAuthenticated && isAdminRole(user) && !superAdminAuth.isAuthenticated;
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
