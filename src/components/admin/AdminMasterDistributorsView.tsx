"use client";

import { AdminNetworkUsersView } from "@/components/admin/AdminNetworkUsersView";
import { ROUTES } from "@/constants";

export function AdminMasterDistributorsView() {
  return (
    <AdminNetworkUsersView
      title="Master Distributors"
      subtitle="Manage master distributors via /api/v1/admin/users"
      searchPlaceholder="Search by name, phone or email..."
      userKind="MASTER_DISTRIBUTOR"
      createHref={ROUTES.adminCreateMasterDistributor}
      createLabel="Create Master Distributor"
    />
  );
}
