"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export default function AdminDashboardPage() {
  return (
    <AdminPageShell>
      <AdminDashboardView />
    </AdminPageShell>
  );
}
