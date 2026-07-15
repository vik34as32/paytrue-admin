"use client";

import { AdminNetworkUsersView } from "@/components/admin/AdminNetworkUsersView";
import { fetchAdminDistributors } from "@/store/api/adminModuleApi";
import { selectAdminDistributors } from "@/store/selectors/adminSelectors";
import { NetworkUserRecord } from "@/types/superAdmin";
import { ROUTES } from "@/constants";

export function AdminDistributorsView() {
  return (
    <AdminNetworkUsersView
      title="Distributors"
      subtitle="Search, filter, view, edit and manage distributors"
      searchPlaceholder="Search by name, phone or email..."
      createHref={ROUTES.adminCreateDistributor}
      createLabel="Create Distributor"
      draftUserType="DISTRIBUTOR"
      selectList={(state) => {
        const list = selectAdminDistributors(state);
        return {
          data: list.data as NetworkUserRecord[],
          total: list.total ?? 0,
          isLoading: list.isLoading,
          error: list.error,
        };
      }}
      fetchList={fetchAdminDistributors}
    />
  );
}
