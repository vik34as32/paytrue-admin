"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WalletBalancesView } from "@/components/wallets/WalletBalancesView";
import { useRoleAccess } from "@/hooks/useAuth";
import { useAppSelector } from "@/hooks/useAppStore";
import { ROUTES } from "@/constants";

const SELF_ROLES = new Set([
  "master_distributor",
  "distributor",
  "retailer",
]);

export default function WalletsPage() {
  const router = useRouter();
  const { user, isAdminApiAuth, isSuperAdminApiAuth } = useRoleAccess();
  const { isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized && !isSuperAdminApiAuth) return;

    if (isAdminApiAuth || isSuperAdminApiAuth) {
      router.replace(ROUTES.adminWallets);
      return;
    }

    if (!user || !SELF_ROLES.has(user.role)) {
      router.replace(ROUTES.login);
    }
  }, [
    isInitialized,
    isAdminApiAuth,
    isSuperAdminApiAuth,
    user,
    router,
  ]);

  if (isAdminApiAuth || isSuperAdminApiAuth) return null;
  if (!user || !SELF_ROLES.has(user.role)) return null;

  return <WalletBalancesView breadcrumb="Wallet" />;
}
