"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RetailerWalletLedgerView } from "@/components/wallet/RetailerWalletLedgerView";
import { useAppSelector } from "@/hooks/useAppStore";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";

export default function AdminRetailerWalletLedgerPage() {
  const router = useRouter();
  const { isAdminApiAuth } = useRoleAccess();
  const { isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAdminApiAuth) {
      router.replace(ROUTES.login);
    }
  }, [isInitialized, isAdminApiAuth, router]);

  if (!isInitialized || !isAdminApiAuth) return null;

  return <RetailerWalletLedgerView scope="admin" breadcrumb="Admin" />;
}
