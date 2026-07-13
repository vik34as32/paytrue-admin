"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WalletSummaryView } from "@/components/wallet/WalletSummaryView";
import { useAppSelector } from "@/hooks/useAppStore";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";

export default function AdminWalletSummaryPage() {
  const router = useRouter();
  const { isAdminApiAuth } = useRoleAccess();
  const { user, isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAdminApiAuth) {
      router.replace(ROUTES.login);
    }
  }, [isInitialized, isAdminApiAuth, router]);

  if (!isInitialized || !isAdminApiAuth) return null;

  return (
    <WalletSummaryView
      scope="admin"
      breadcrumb="Admin"
      accountName={user?.name || "Admin"}
      accountEmail={user?.email}
    />
  );
}
