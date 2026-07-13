"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";
import { ServiceMasterMuiProvider } from "@/components/service-master/ServiceMasterMuiProvider";
import { ServiceMasterPage } from "@/components/service-master/ServiceMasterPage";
import { AuthRestoreLoader } from "@/components/common/AuthRestoreLoader";

export default function AdminServiceMasterPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess, isAuthLoading } = useSuperAdminAuth();

  useEffect(() => {
    if (!isAuthLoading && !hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, isAuthLoading, router]);

  if (isAuthLoading || !hasSuperAdminWalletAccess) {
    return <AuthRestoreLoader />;
  }

  return (
    <ServiceMasterMuiProvider>
      <ServiceMasterPage />
    </ServiceMasterMuiProvider>
  );
}
