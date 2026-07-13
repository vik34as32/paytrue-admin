"use client";

import { CommissionPageShell } from "@/components/commission/CommissionPageShell";
import { CommissionPage } from "@/components/commission/CommissionPage";

export default function AdminCommissionManagementPage() {
  return (
    <CommissionPageShell>
      <CommissionPage />
    </CommissionPageShell>
  );
}
