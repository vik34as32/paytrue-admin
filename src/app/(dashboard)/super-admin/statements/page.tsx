"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminServiceStatementView } from "@/components/statement/SuperAdminServiceStatementView";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";

export default function SuperAdminServiceStatementPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return <SuperAdminServiceStatementView />;
}
