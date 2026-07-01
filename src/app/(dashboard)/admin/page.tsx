"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";

export default function AdminPage() {
  const { isAdminApiAuth } = useRoleAccess();
  const router = useRouter();

  useEffect(() => {
    if (!isAdminApiAuth) {
      router.replace(ROUTES.dashboard);
    }
  }, [isAdminApiAuth, router]);

  if (!isAdminApiAuth) return null;

  return <AdminDashboardView />;
}
