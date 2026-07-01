"use client";

import { AnalyticsDashboardView } from "@/components/dashboard/AnalyticsDashboardView";
import { AdminWalletDashboardView } from "@/components/dashboard/AdminWalletDashboardView";
import { useRoleAccess } from "@/hooks/useAuth";

/** Dashboard — admin sees wallet view; other roles see analytics */
export default function DashboardPage() {
  const { user } = useRoleAccess();

  if (user?.role === "admin") {
    return <AdminWalletDashboardView />;
  }

  return (
    <AnalyticsDashboardView
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening today."
    />
  );
}
