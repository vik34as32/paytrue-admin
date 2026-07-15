"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminDistributorsView } from "@/components/admin/AdminDistributorsView";

export default function AdminDistributorsPage() {
  return (
    <AdminPageShell>
      <AdminDistributorsView />
    </AdminPageShell>
  );
}
