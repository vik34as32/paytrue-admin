"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminBalanceDeductView } from "@/components/admin/AdminBalanceDeductView";

export default function AdminBalanceDeductPage() {
  return (
    <AdminPageShell>
      <AdminBalanceDeductView />
    </AdminPageShell>
  );
}
