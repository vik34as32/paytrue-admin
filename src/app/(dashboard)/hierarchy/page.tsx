"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HierarchyNetworkView } from "@/components/hierarchy/HierarchyNetworkView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";
import { AuthRestoreLoader } from "@/components/common/AuthRestoreLoader";

export default function HierarchyPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess, isAuthLoading } = useSuperAdminAuth();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, isAuthLoading, router]);

  if (isAuthLoading || !hasSuperAdminWalletAccess) {
    return <AuthRestoreLoader />;
  }

  return (
    <HierarchyNetworkView scope="super_admin" breadcrumb="Super Admin" />
  );
}
