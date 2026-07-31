"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WalletCategoryLedgerView } from "@/components/wallet-management/WalletCategoryLedgerView";
import { useAppSelector } from "@/hooks/useAppStore";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";

function AdminWalletCategoryLedgerContent() {
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

  return <WalletCategoryLedgerView scope="admin" breadcrumb="Admin" />;
}

export default function AdminWalletCategoryLedgerPage() {
  return (
    <Suspense fallback={null}>
      <AdminWalletCategoryLedgerContent />
    </Suspense>
  );
}
