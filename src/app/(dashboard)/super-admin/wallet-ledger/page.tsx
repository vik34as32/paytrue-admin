"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RetailerWalletLedgerView } from "@/components/wallet/RetailerWalletLedgerView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

export default function SuperAdminRetailerWalletLedgerPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <RetailerWalletLedgerView scope="super_admin" breadcrumb="Super Admin" />
  );
}
