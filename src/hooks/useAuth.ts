"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/useAppStore";
import { UserRole } from "@/types";
import { ROUTES } from "@/constants";

const PUBLIC_ROUTES = [ROUTES.login];

const ROLE_ROUTES: Record<UserRole, string[]> = {
  super_admin: Object.values(ROUTES),
  admin: [
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
  const { isAuthenticated, user, isLoading } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

    if (!isAuthenticated && !isPublic) {
      router.replace(ROUTES.login);
      return;
    }

    if (isAuthenticated && pathname === ROUTES.login) {
      router.replace(ROUTES.dashboard);
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
        router.replace(ROUTES.dashboard);
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace(ROUTES.dashboard);
      }
    }
  }, [isAuthenticated, user, pathname, router, isLoading, allowedRoles]);
}

export function useRoleAccess() {
  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === "super_admin";
  const canCreateUsers = isSuperAdmin;
  const canManageUsers = isSuperAdmin;
  const canApproveRequests =
    user?.role !== "retailer" && user?.role !== undefined;
  const canRequestBalance = user?.role === "retailer";
  const canTransferBalance = user?.role !== "retailer";

  return {
    user,
    isSuperAdmin,
    canCreateUsers,
    canManageUsers,
    canApproveRequests,
    canRequestBalance,
    canTransferBalance,
  };
}
