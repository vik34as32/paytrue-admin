"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminHistoryView } from "@/components/admin/AdminHistoryView";

export default function AdminHistoryPage() {
  return (
    <AdminPageShell>
      <AdminHistoryView />
    </AdminPageShell>
  );
}
