"use client";

import { AdminNetworkUsersView } from "@/components/admin/AdminNetworkUsersView";
import { fetchAdminRetailers } from "@/store/api/adminModuleApi";
import { selectAdminRetailers } from "@/store/selectors/adminSelectors";
import { NetworkUserRecord } from "@/types/superAdmin";
import { ROUTES } from "@/constants";

export function AdminRetailersView() {
  return (
    <AdminNetworkUsersView
      title="Retailers"
      subtitle="Search, filter, view, edit and manage retailers"
      searchPlaceholder="Search by name, phone or email..."
      createHref={ROUTES.adminCreateRetailer}
      createLabel="Create Retailer"
      draftUserType="RETAILER"
      selectList={(state) => {
        const list = selectAdminRetailers(state);
        return {
          data: list.data as NetworkUserRecord[],
          total: list.total ?? 0,
          isLoading: list.isLoading,
          error: list.error,
        };
      }}
      fetchList={fetchAdminRetailers}
    />
  );
}
