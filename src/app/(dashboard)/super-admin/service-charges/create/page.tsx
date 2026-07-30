"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ServiceChargeCreateView } from "@/components/service-charges/ServiceChargeCreateView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

export default function SuperAdminServiceChargeCreatePage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return <ServiceChargeCreateView />;
}
