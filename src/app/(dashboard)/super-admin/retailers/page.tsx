"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import {
  SuperAdminListFilters,
  SuperAdminListFiltersValue,
} from "@/components/super-admin/SuperAdminListFilters";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchRetailers } from "@/store/api/superAdminApi";
import { selectRetailersList, getNetworkUserName } from "@/store/selectors/superAdminSelectors";
import { ROUTES } from "@/constants";
import { NetworkUserRecord } from "@/types/superAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function SuperAdminRetailersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const { data, total, isLoading, error } = useAppSelector(selectRetailersList);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<SuperAdminListFiltersValue>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const loadData = useCallback(() => {
    dispatch(
      fetchRetailers({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: filters.status,
        city: filters.city,
        state: filters.state,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })
    );
  }, [dispatch, pageIndex, search, filters]);

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    loadData();
  }, [hasSuperAdminWalletAccess, router, loadData]);

  const columns: ColumnDef<NetworkUserRecord, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => getNetworkUserName(row.original),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "mobile", header: "Mobile" },
    { accessorKey: "city", header: "City" },
    { accessorKey: "state", header: "State" },
    {
      accessorKey: "walletBalance",
      header: "Balance",
      cell: ({ row }) =>
        formatCurrency(row.original.walletBalance ?? 0),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            (row.original.status?.toLowerCase() as "success" | "pending") ||
            "default"
          }
        >
          {row.original.status || "—"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt || ""),
    },
  ];

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Retailers"
        subtitle="All retailers with server-side pagination and filters"
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <Card>
        <SuperAdminListFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPageIndex(0);
          }}
          showCity
          showState
          showDateRange
          showSort
        />
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search retailers..."
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
