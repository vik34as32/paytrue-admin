"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WalletSummaryView } from "@/components/wallet/WalletSummaryView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchSuperAdminProfile } from "@/store/api/superAdminApi";
import { selectSuperAdminProfile } from "@/store/selectors/superAdminSelectors";
import { ROUTES } from "@/constants";

export default function SuperAdminWalletSummaryPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess, user } = useSuperAdminAuth();
  const profile = useAppSelector(selectSuperAdminProfile);

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    if (!profile) {
      void dispatch(fetchSuperAdminProfile());
    }
  }, [hasSuperAdminWalletAccess, router, dispatch, profile]);

  if (!hasSuperAdminWalletAccess) return null;

  const account = profile || user;

  return (
    <WalletSummaryView
      scope="super_admin"
      breadcrumb="Super Admin"
      accountName={
        account?.name ||
        [account?.firstName, account?.lastName].filter(Boolean).join(" ") ||
        "Super Admin"
      }
      accountEmail={account?.email}
      accountCity={account?.city}
      accountState={account?.state}
    />
  );
}
