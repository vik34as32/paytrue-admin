"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminAssignBankAccountView } from "@/components/admin/AdminAssignBankAccountView";

export default function AdminAssignBankAccountPage() {
  return (
    <AdminPageShell>
      <AdminAssignBankAccountView />
    </AdminPageShell>
  );
}
