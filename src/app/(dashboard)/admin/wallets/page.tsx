"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WalletBalancesView } from "@/components/wallets/WalletBalancesView";
import { useRoleAccess } from "@/hooks/useAuth";
import { useAppSelector } from "@/hooks/useAppStore";
import { ROUTES } from "@/constants";

export default function AdminWalletsPage() {
  const router = useRouter();
  const { isAdminApiAuth, isSuperAdminApiAuth } = useRoleAccess();
  const { isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized && !isSuperAdminApiAuth) return;
    if (!isAdminApiAuth && !isSuperAdminApiAuth) {
      router.replace(ROUTES.login);
    }
  }, [isInitialized, isAdminApiAuth, isSuperAdminApiAuth, router]);

  if (!isAdminApiAuth && !isSuperAdminApiAuth) return null;

  return (
    <WalletBalancesView
      breadcrumb={isSuperAdminApiAuth ? "Super Admin" : "Admin"}
    />
  );
}
