"use client";

import { AdminNetworkUsersView } from "@/components/admin/AdminNetworkUsersView";
import { ROUTES } from "@/constants";

export function AdminDistributorsView() {
  return (
    <AdminNetworkUsersView
      title="Distributors"
      subtitle="Manage distributors via /api/v1/admin/users"
      searchPlaceholder="Search by name, phone or email..."
      userKind="DISTRIBUTOR"
      createHref={ROUTES.adminCreateDistributor}
      createLabel="Create Distributor"
    />
  );
}
