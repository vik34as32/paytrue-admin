"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WalletLienManagementView } from "@/components/wallet-lien/WalletLienManagementView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

export default function SuperAdminWalletLienPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return <WalletLienManagementView />;
}
