"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/useAppStore";
import {
  getStoredSuperAdminUser,
  getSuperAdminToken,
} from "@/services/superAdminAuth";
import { ROUTES } from "@/constants";

const SUPER_ADMIN_PUBLIC = [ROUTES.superAdminLogin];

const SUPER_ADMIN_PROTECTED_PREFIXES = [
  ROUTES.superAdmin,
  ROUTES.superAdminDashboard,
  ROUTES.superAdminAdmins,
  ROUTES.superAdminAddBalance,
  ROUTES.superAdminTransferBalance,
  ROUTES.superAdminWalletHistory,
  ROUTES.superAdminCreateAdmin,
  ROUTES.superAdminStatistics,
  ROUTES.superAdminRetailers,
  ROUTES.superAdminMasterDistributors,
  ROUTES.superAdminDistributors,
  ROUTES.superAdminFundRequests,
  ROUTES.superAdminChangePassword,
];

function hasPersistedSuperAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return !!(getSuperAdminToken() && getStoredSuperAdminUser());
}

export function useSuperAdminAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAppSelector(
    (state) => state.superAdminAuth
  );

  useEffect(() => {
    if (isLoading) return;

    const isPublic = SUPER_ADMIN_PUBLIC.some((r) => pathname.startsWith(r));
    const isProtected = SUPER_ADMIN_PROTECTED_PREFIXES.some((r) =>
      pathname.startsWith(r)
    );

    if (!isAuthenticated && isProtected && pathname !== ROUTES.superAdminLogin) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }

    if (isAuthenticated && pathname === ROUTES.superAdminLogin) {
      router.replace(ROUTES.superAdminDashboard);
    }
  }, [isAuthenticated, isLoading, pathname, router]);
}

export function useSuperAdminAuth() {
  const superAdminAuth = useAppSelector((state) => state.superAdminAuth);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const wallet = useAppSelector((state) => state.superAdminWallet);

  const isSuperAdminAuthenticated = superAdminAuth.isAuthenticated;
  const isAdminAuthenticated =
    isAuthenticated && user?.role === "admin";
  const hasPersistedSession =
    isSuperAdminAuthenticated ||
    (superAdminAuth.isLoading && hasPersistedSuperAdminSession());

  return {
    ...superAdminAuth,
    wallet,
    isSuperAdminAuthenticated,
    isAdminAuthenticated,
    isAuthLoading: superAdminAuth.isLoading,
    /** Super admin wallet operations: transfer, history, create admin */
    hasSuperAdminWalletAccess: hasPersistedSession,
    /** Admin wallet operations: add balance to own wallet */
    hasAdminWalletAccess: isAdminAuthenticated,
  };
}
