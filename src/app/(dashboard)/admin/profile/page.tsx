"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminProfileView } from "@/components/admin/AdminProfileView";

export default function AdminProfilePage() {
  return (
    <AdminPageShell>
      <AdminProfileView />
    </AdminPageShell>
  );
}
