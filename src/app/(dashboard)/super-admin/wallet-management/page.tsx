"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WalletManagementView } from "@/components/wallet-management/WalletManagementView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

export default function SuperAdminWalletManagementPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return <WalletManagementView breadcrumb="Super Admin" />;
}
