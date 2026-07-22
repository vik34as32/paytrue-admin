"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppSelector } from "@/hooks/useAppStore";
import { AuthRestoreLoader } from "@/components/common/AuthRestoreLoader";
import { ROUTES } from "@/constants";
import { canAccessCommissionManagement } from "@/lib/commission/permissions";
import { getCommissionAuthToken } from "@/lib/api/commissionClient";

interface CommissionPageShellProps {
  children: React.ReactNode;
}

export function CommissionPageShell({ children }: CommissionPageShellProps) {
  const router = useRouter();
  const { isAdminApiAuth, isRestoring: isAdminRestoring } = useAdminGuard({
    allowSuperAdmin: true,
  });
  const {
    hasSuperAdminWalletAccess,
    isSuperAdminAuthenticated,
    isAuthLoading: isSuperAdminRestoring,
    user: superAdminUser,
  } = useSuperAdminAuth();
  const authUser = useAppSelector((state) => state.auth.user);

  const isRestoring = isAdminRestoring || isSuperAdminRestoring;
  const isSuperAdmin =
    isSuperAdminAuthenticated || hasSuperAdminWalletAccess;

  const permissions =
    (superAdminUser as { permissions?: string[] } | null)?.permissions ??
    (authUser as { permissions?: string[] } | null)?.permissions ??
    null;

  const canAccess =
    Boolean(getCommissionAuthToken()) &&
    canAccessCommissionManagement({
      isAdminApiAuth,
      isSuperAdminAuthenticated: isSuperAdmin,
      role: isSuperAdmin ? "super_admin" : authUser?.role,
      userType: isSuperAdmin
        ? "SUPER_ADMIN"
        : authUser?.role === "admin"
          ? "ADMIN"
          : null,
      permissions,
    });

  useEffect(() => {
    if (isRestoring) return;
    if (canAccess) return;

    if (isSuperAdmin) {
      router.replace(ROUTES.superAdminDashboard);
      return;
    }
    if (isAdminApiAuth) {
      router.replace(ROUTES.adminDashboard);
      return;
    }
    router.replace(ROUTES.login);
  }, [canAccess, isRestoring, router, isSuperAdmin, isAdminApiAuth]);

  if (isRestoring || !canAccess) {
    return <AuthRestoreLoader />;
  }

  return <>{children}</>;
}
