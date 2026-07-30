"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminAepsLedgerView } from "@/components/super-admin/aeps-ledger/SuperAdminAepsLedgerView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

export default function SuperAdminAepsLedgerPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess, isSuperAdminAuthenticated, isAuthLoading } =
    useSuperAdminAuth();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isSuperAdminAuthenticated && !hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [
    hasSuperAdminWalletAccess,
    isSuperAdminAuthenticated,
    isAuthLoading,
    router,
  ]);

  if (isAuthLoading) return null;

  return (
    <SuperAdminAepsLedgerView hasAccess={!!hasSuperAdminWalletAccess} />
  );
}
