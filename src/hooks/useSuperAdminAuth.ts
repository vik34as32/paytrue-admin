"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/useAppStore";
import { selectIsAuthRestoring } from "@/store/selectors/authSelectors";
import {
  getStoredSuperAdminUser,
  getSuperAdminToken,
} from "@/services/superAdminAuth";
import { ROUTES } from "@/constants";
import { isAdminRole } from "@/lib/normalizeAuthRole";

/** Super-admin-only protected prefixes (not shared admin pages) */
const SUPER_ADMIN_PROTECTED_PREFIXES = [
  ROUTES.superAdmin,
  ROUTES.superAdminDashboard,
  ROUTES.superAdminAdmins,
  ROUTES.superAdminAddBalance,
  ROUTES.superAdminTransferBalance,
  ROUTES.superAdminDeductBalance,
  ROUTES.superAdminWalletHistory,
  ROUTES.superAdminWalletSummary,
  ROUTES.superAdminCreateAdmin,
  ROUTES.superAdminStatistics,
  ROUTES.superAdminRetailers,
  ROUTES.superAdminMasterDistributors,
  ROUTES.superAdminDistributors,
  ROUTES.superAdminFundRequests,
  ROUTES.superAdminChangePassword,
  ROUTES.superAdminBankAccounts,
];

const SHARED_ADMIN_SUPER_ADMIN_PREFIXES = [
  ROUTES.adminServiceMaster,
  ROUTES.adminCommissionManagement,
];

function hasPersistedSuperAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return !!(getSuperAdminToken() && getStoredSuperAdminUser());
}

export function useSuperAdminAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAppSelector((state) => state.superAdminAuth);
  const { isAuthenticated: isAdminAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );
  const isRestoring = useAppSelector(selectIsAuthRestoring);

  useEffect(() => {
    if (isRestoring) return;

    const isShared = SHARED_ADMIN_SUPER_ADMIN_PREFIXES.some((r) =>
      pathname.startsWith(r)
    );
    const isProtected = SUPER_ADMIN_PROTECTED_PREFIXES.some((r) =>
      pathname.startsWith(r)
    );

    if (isShared) {
      const hasAdminAccess = isAdminAuthenticated && isAdminRole(user);
      if (!isAuthenticated && !hasAdminAccess) {
        router.replace(ROUTES.login);
      }
      return;
    }

    if (!isAuthenticated && isProtected && pathname !== ROUTES.superAdminLogin) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }

    if (isAuthenticated && pathname === ROUTES.superAdminLogin) {
      router.replace(ROUTES.superAdminDashboard);
    }
  }, [
    isAuthenticated,
    isAdminAuthenticated,
    user,
    isRestoring,
    pathname,
    router,
  ]);
}

export function useSuperAdminAuth() {
  const superAdminAuth = useAppSelector((state) => state.superAdminAuth);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const wallet = useAppSelector((state) => state.superAdminWallet);
  const isRestoring = useAppSelector(selectIsAuthRestoring);

  const isSuperAdminAuthenticated = superAdminAuth.isAuthenticated;
  const isAdminAuthenticated = isAuthenticated && isAdminRole(user);
  const hasPersistedSession =
    isSuperAdminAuthenticated ||
    (isRestoring && hasPersistedSuperAdminSession());

  return {
    ...superAdminAuth,
    wallet,
    isSuperAdminAuthenticated,
    isAdminAuthenticated,
    isAuthLoading: isRestoring,
    /** Super admin wallet operations: transfer, history, create admin */
    hasSuperAdminWalletAccess: hasPersistedSession,
    /** Admin wallet operations: add balance to own wallet */
    hasAdminWalletAccess: isAdminAuthenticated,
  };
}
