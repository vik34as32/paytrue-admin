"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { CreateAdminForm } from "@/components/forms/CreateAdminForm";
import {
  SuperAdminListFilters,
  SuperAdminListFiltersValue,
} from "@/components/super-admin/SuperAdminListFilters";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminsList } from "@/store/api/superAdminApi";
import { selectAdminsList } from "@/store/selectors/superAdminSelectors";
import {
  getAdminDisplayName,
  getAdminBalance,
  getAdminId,
} from "@/services/admin";
import { ROUTES } from "@/constants";
import { AdminRecord } from "@/types/superAdmin";
import { formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function SuperAdminAdminsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const { data, total, isLoading, error } = useAppSelector(selectAdminsList);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
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

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    loadAdmins();
  }, [dispatch, hasSuperAdminWalletAccess, router, loadAdmins]);

  const columns: ColumnDef<AdminRecord, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => getAdminDisplayName(row.original),
    },
    {
      accessorKey: "id",
      header: "Admin ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{getAdminId(row.original)}</span>
      ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "mobile", header: "Mobile" },
    {
      accessorKey: "userType",
      header: "User Type",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.userType.toUpperCase()}</Badge>
      ),
    },
    {
      accessorKey: "balance",
      header: "Wallet Balance",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {formatCurrency(getAdminBalance(row.original))}
        </span>
      ),
    },
  ];

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Admin Management"
        subtitle="Create admins and manage all registered administrators"
      />

      <CreateAdminForm />

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
        />
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search admins by name, email, mobile..."
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
