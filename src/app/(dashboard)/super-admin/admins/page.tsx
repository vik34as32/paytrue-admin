"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { DataTable } from "@/components/tables/DataTable";
import { CreateAdminModal } from "@/components/super-admin/CreateAdminModal";
import {
  SuperAdminListFilters,
  SuperAdminListFiltersValue,
} from "@/components/super-admin/SuperAdminListFilters";
import {
  AdminCrudModals,
  useAdminTableColumns,
} from "@/components/super-admin/AdminCrudModals";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminsList } from "@/store/api/superAdminApi";
import { selectAdminsList } from "@/store/selectors/superAdminSelectors";
import { ROUTES } from "@/constants";
import { Plus } from "lucide-react";

const PAGE_SIZE = 10;

export default function SuperAdminAdminsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const { data, total, isLoading, error } = useAppSelector(selectAdminsList);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<SuperAdminListFiltersValue>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const loadAdmins = useCallback(() => {
    dispatch(
      fetchAdminsList({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })
    );
  }, [dispatch, pageIndex, search, filters]);

  const { columns, crud } = useAdminTableColumns(loadAdmins);

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    loadAdmins();
  }, [dispatch, hasSuperAdminWalletAccess, router, loadAdmins]);

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Admin Management"
        subtitle="Create admins and manage all registered administrators"
        action={
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Admin
          </Button>
        }
      />

      <CreateAdminModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={loadAdmins}
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <Card>
        <h3 className="mb-4 text-lg font-bold">All Admins</h3>
        <SuperAdminListFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPageIndex(0);
          }}
          showSort
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          searchPlaceholder="Search admins by name, email, mobile..."
          resultsCount={data.length}
        />
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          hideSearch
          manualPagination
          pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={PAGE_SIZE}
        />
      </Card>

      <AdminCrudModals crud={crud} />
    </div>
  );
}
