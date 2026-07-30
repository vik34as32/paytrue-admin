"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WalletManagementView } from "@/components/wallet-management/WalletManagementView";
import { useRoleAccess } from "@/hooks/useAuth";
import { useAppSelector } from "@/hooks/useAppStore";
import { ROUTES } from "@/constants";

export default function AdminWalletManagementPage() {
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

  return <WalletManagementView breadcrumb="Admin" />;
}
