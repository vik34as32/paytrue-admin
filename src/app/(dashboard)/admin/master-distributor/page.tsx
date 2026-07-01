"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminMasterDistributorsView } from "@/components/admin/AdminMasterDistributorsView";

export default function AdminMasterDistributorPage() {
  return (
    <AdminPageShell>
      <AdminMasterDistributorsView />
    </AdminPageShell>
  );
}
