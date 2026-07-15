"use client";

import { AdminNetworkUsersView } from "@/components/admin/AdminNetworkUsersView";

export function AdminDistributorsView() {
  return (
    <AdminNetworkUsersView
      title="Distributors"
      subtitle="Manage distributors via /api/v1/admin/users"
      searchPlaceholder="Search by name, phone or email..."
      userKind="DISTRIBUTOR"
    />
  );
}
