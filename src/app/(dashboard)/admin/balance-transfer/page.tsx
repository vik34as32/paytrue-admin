"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminBalanceTransferView } from "@/components/admin/AdminBalanceTransferView";

export default function AdminBalanceTransferPage() {
  return (
    <AdminPageShell>
      <AdminBalanceTransferView />
    </AdminPageShell>
  );
}
