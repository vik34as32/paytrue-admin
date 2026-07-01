"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminHierarchyView } from "@/components/admin/AdminHierarchyView";

export default function AdminHierarchyPage() {
  return (
    <AdminPageShell>
      <AdminHierarchyView />
    </AdminPageShell>
  );
}
