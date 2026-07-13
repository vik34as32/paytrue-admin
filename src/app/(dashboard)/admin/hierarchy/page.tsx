"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { HierarchyNetworkView } from "@/components/hierarchy/HierarchyNetworkView";

export default function AdminHierarchyPage() {
  return (
    <AdminPageShell>
      <HierarchyNetworkView scope="admin" breadcrumb="Admin" />
    </AdminPageShell>
  );
}
