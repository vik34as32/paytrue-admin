"use client";

import { AdminNetworkUsersView } from "@/components/admin/AdminNetworkUsersView";
import { ROUTES } from "@/constants";

export function AdminRetailersView() {
  return (
    <AdminNetworkUsersView
      title="Retailers"
      subtitle="Manage retailers via /api/v1/admin/users"
      searchPlaceholder="Search by name, phone or email..."
      userKind="RETAILER"
      createHref={ROUTES.adminCreateRetailer}
      createLabel="Create Retailer"
    />
  );
}
