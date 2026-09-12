"use client";

import dynamic from "next/dynamic";
import { HierarchyManagementShell } from "@/components/hierarchy-management/HierarchyManagementShell";
import { AuthRestoreLoader } from "@/components/common/AuthRestoreLoader";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppSelector } from "@/hooks/useAppStore";

const HierarchyManagementView = dynamic(
  () =>
    import("@/components/hierarchy-management/HierarchyManagementView").then(
      (mod) => mod.HierarchyManagementView
    ),
  {
    ssr: false,
    loading: () => <AuthRestoreLoader />,
  }
);

export default function HierarchyManagementPage() {
  const { isAdminApiAuth } = useAdminGuard({ allowSuperAdmin: true });
  const {
    hasSuperAdminWalletAccess,
    isSuperAdminAuthenticated,
    user: superAdminUser,
  } = useSuperAdminAuth();
  const authUser = useAppSelector((state) => state.auth.user);

  const isSuperAdmin =
    isSuperAdminAuthenticated || hasSuperAdminWalletAccess;

  const permissions =
    (superAdminUser as { permissions?: string[] } | null)?.permissions ??
    (authUser as { permissions?: string[] } | null)?.permissions ??
    null;

  return (
    <HierarchyManagementShell>
      <HierarchyManagementView
        breadcrumb={isSuperAdmin ? "Super Admin" : "Admin"}
        permissions={permissions}
        role={isSuperAdmin ? "super_admin" : authUser?.role}
        userType={isSuperAdmin ? "SUPER_ADMIN" : "ADMIN"}
        isAdminApiAuth={isAdminApiAuth}
        isSuperAdminAuthenticated={isSuperAdmin}
      />
    </HierarchyManagementShell>
  );
}
