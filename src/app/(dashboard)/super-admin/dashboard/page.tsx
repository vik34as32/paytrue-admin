"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { SuperAdminWalletDashboardView } from "@/components/dashboard/SuperAdminWalletDashboardView";
import { ROUTES } from "@/constants";

export default function SuperAdminDashboardPage() {
  const { isSuperAdminAuthenticated, isAuthLoading } = useSuperAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isSuperAdminAuthenticated) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [isSuperAdminAuthenticated, isAuthLoading, router]);

  if (isAuthLoading || !isSuperAdminAuthenticated) return null;

  return <SuperAdminWalletDashboardView />;
}
