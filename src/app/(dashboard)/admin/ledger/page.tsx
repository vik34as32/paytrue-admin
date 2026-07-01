"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminLedgerView } from "@/components/admin/AdminLedgerView";

export default function AdminLedgerPage() {
  return (
    <AdminPageShell>
      <AdminLedgerView />
    </AdminPageShell>
  );
}
