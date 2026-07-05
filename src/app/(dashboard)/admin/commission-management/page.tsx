"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CommissionPage } from "@/components/commission/CommissionPage";

export default function AdminCommissionManagementPage() {
  return (
    <AdminPageShell>
      <CommissionPage />
    </AdminPageShell>
  );
}
