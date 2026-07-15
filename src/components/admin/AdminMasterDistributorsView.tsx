"use client";

import { AdminNetworkUsersView } from "@/components/admin/AdminNetworkUsersView";
import { fetchAdminMasterDistributors } from "@/store/api/adminModuleApi";
import { selectAdminMasterDistributors } from "@/store/selectors/adminSelectors";
import { NetworkUserRecord } from "@/types/superAdmin";
import { ROUTES } from "@/constants";

export function AdminMasterDistributorsView() {
  return (
    <AdminNetworkUsersView
      title="Master Distributors"
      subtitle="Search, filter, view, edit and manage master distributors"
      searchPlaceholder="Search by name, phone or email..."
      createHref={ROUTES.adminCreateMasterDistributor}
      createLabel="Create Master Distributor"
      draftUserType="MASTER_DISTRIBUTOR"
      selectList={(state) => {
        const list = selectAdminMasterDistributors(state);
        return {
          data: list.data as NetworkUserRecord[],
          total: list.total ?? 0,
          isLoading: list.isLoading,
          error: list.error,
        };
      }}
      fetchList={fetchAdminMasterDistributors}
    />
  );
}
