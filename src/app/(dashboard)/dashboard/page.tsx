"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsDashboardView } from "@/components/dashboard/AnalyticsDashboardView";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";

/** Dashboard — admin redirects to /admin/dashboard; other roles see analytics */
export default function DashboardPage() {
  const { user, isAdminApiAuth } = useRoleAccess();
  const router = useRouter();

  useEffect(() => {
    if (isAdminApiAuth) {
      router.replace(ROUTES.adminDashboard);
    }
  }, [isAdminApiAuth, router]);

  if (isAdminApiAuth) return null;

  if (user?.role === "admin") {
    return null;
  }

  return (
    <AnalyticsDashboardView
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening today."
    />
  );
}
