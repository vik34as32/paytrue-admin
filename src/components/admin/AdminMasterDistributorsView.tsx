"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import {
  AdminListFilters,
  AdminListFiltersValue,
} from "@/components/admin/AdminListFilters";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminMasterDistributors } from "@/store/api/adminModuleApi";
import { selectAdminMasterDistributors } from "@/store/selectors/adminSelectors";
import { getNetworkUserName } from "@/services/adminApi";
import { clearUserFormDraft } from "@/lib/userFormDraftStorage";
import { ROUTES } from "@/constants";
import { AdminNetworkUser } from "@/types/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UserPlus } from "lucide-react";

const PAGE_SIZE = 10;

export function AdminMasterDistributorsView() {
  const dispatch = useAppDispatch();
  const { data, total, isLoading, error } = useAppSelector(
    selectAdminMasterDistributors
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminListFiltersValue>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const loadData = useCallback(() => {
    dispatch(
      fetchAdminMasterDistributors({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })
    );
  }, [dispatch, pageIndex, search, filters]);

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
      header: "Wallet Balance",
      cell: ({ row }) => formatCurrency(row.original.walletBalance ?? 0),
    },
    {
      id: "business",
      header: "Business",
      cell: ({ row }) => {
        const business = row.original.business ?? row.original.totalBusiness;
        return typeof business === "number" ? formatCurrency(business) : "—";
      },
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
      header: "Created Date",
      cell: ({ row }) => formatDate(row.original.createdAt || ""),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Admin"
        title="Master Distributors"
        subtitle="Manage master distributors under your administration"
        action={
          <Link
            href={ROUTES.adminCreateMasterDistributor}
            onClick={() => clearUserFormDraft("MASTER_DISTRIBUTOR")}
          >
            <Button>
              <UserPlus className="h-4 w-4" />
              Create Master Distributor
            </Button>
          </Link>
        }
      />
      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
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
          searchPlaceholder="Search master distributors..."
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
