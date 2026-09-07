"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProviderErrorLogsView } from "@/components/super-admin/ProviderErrorLogsView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

export default function SuperAdminProviderErrorLogsPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return <ProviderErrorLogsView />;
}
