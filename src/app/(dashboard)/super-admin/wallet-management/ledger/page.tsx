"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WalletCategoryLedgerView } from "@/components/wallet-management/WalletCategoryLedgerView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

function SuperAdminWalletCategoryLedgerContent() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <WalletCategoryLedgerView scope="super_admin" breadcrumb="Super Admin" />
  );
}

export default function SuperAdminWalletCategoryLedgerPage() {
  return (
    <Suspense fallback={null}>
      <SuperAdminWalletCategoryLedgerContent />
    </Suspense>
  );
}
