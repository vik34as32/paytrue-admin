"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ServiceChargeHistoryView } from "@/components/service-charges/ServiceChargeHistoryView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

export default function SuperAdminServiceChargeHistoryPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return <ServiceChargeHistoryView />;
}
