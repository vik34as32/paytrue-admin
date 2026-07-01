"use client";

import { useCallback, useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import {
  AdminListFilters,
  AdminListFiltersValue,
} from "@/components/admin/AdminListFilters";
import { useRoleAccess } from "@/hooks/useAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminDistributors } from "@/store/api/adminModuleApi";
import { selectAdminDistributors } from "@/store/selectors/adminSelectors";
import { getNetworkUserName } from "@/services/adminApi";
import { AdminNetworkUser } from "@/types/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function DistributorPage() {
  const dispatch = useAppDispatch();
  const { isAdminApiAuth, user } = useRoleAccess();
  const { data, total, isLoading, error } = useAppSelector(selectAdminDistributors);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminListFiltersValue>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const loadData = useCallback(() => {
    if (!isAdminApiAuth) return;
    dispatch(
      fetchAdminDistributors({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })
    );
  }, [dispatch, isAdminApiAuth, pageIndex, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: ColumnDef<AdminNetworkUser, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => getNetworkUserName(row.original),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "mobile", header: "Mobile" },
    {
      accessorKey: "walletBalance",
      header: "Balance",
      cell: ({ row }) => formatCurrency(row.original.walletBalance ?? 0),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.status || "—"}</Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt || ""),
    },
  ];

  if (isAdminApiAuth) {
    return (
      <div className="page-container">
        <PageHeader
          breadcrumb="Admin"
          title="Distributors"
          subtitle="Distributors in your downline"
        />
        {error && (
          <div className="mb-4 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {error}
          </div>
        )}
        <Card>
          <AdminListFilters
            value={filters}
            onChange={(next) => {
              setFilters(next);
              setPageIndex(0);
            }}
            showSort
          />
          <DataTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Search distributors..."
            onSearch={(value) => {
              setSearch(value);
              setPageIndex(0);
            }}
            manualPagination
            pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            pageIndex={pageIndex}
            onPageChange={setPageIndex}
            pageSize={PAGE_SIZE}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader breadcrumb="Network" title="Distributor" subtitle="Distributor network" />
      <Card>
        <p className="text-sm text-muted">Viewing as {user?.name || "user"}.</p>
      </Card>
    </div>
  );
}
