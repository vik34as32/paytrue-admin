"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminRetailersView } from "@/components/admin/AdminRetailersView";

export default function AdminRetailersPage() {
  return (
    <AdminPageShell>
      <AdminRetailersView />
    </AdminPageShell>
  );
}
