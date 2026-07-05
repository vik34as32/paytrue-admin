"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFundRequestsView } from "@/components/admin/AdminFundRequestsView";

export default function RequestsPage() {
  return (
    <AdminPageShell>
      <AdminFundRequestsView />
    </AdminPageShell>
  );
}
