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
import { fetchAdminFundRequests } from "@/store/api/superAdminApi";
import { fetchAllAdmins } from "@/store/api/superAdminWalletApi";
import { selectFundRequests } from "@/store/selectors/superAdminSelectors";
import { getAdminDisplayName, getAdminId } from "@/services/admin";
import { ROUTES } from "@/constants";
import { AdminFundRequest } from "@/types/superAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function SuperAdminFundRequestsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const { data, total, isLoading, error } = useAppSelector(
    selectFundRequests
  );
  const { admins, isLoadingAdmins } = useAppSelector(
    (state) => state.superAdminWallet
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [filters, setFilters] = useState<SuperAdminListFiltersValue>({});

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    dispatch(fetchAllAdmins());
  }, [dispatch, hasSuperAdminWalletAccess, router]);

  useEffect(() => {
    if (admins.length > 0 && !selectedAdminId) {
      setSelectedAdminId(getAdminId(admins[0]));
    }
  }, [admins, selectedAdminId]);

  const loadData = useCallback(() => {
    if (!selectedAdminId) return;
    dispatch(
      fetchAdminFundRequests({
        adminId: selectedAdminId,
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
    );
  }, [dispatch, selectedAdminId, pageIndex, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: ColumnDef<AdminFundRequest, unknown>[] = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) =>
        formatDate(
          row.original.createdAt ||
            (row.original.requestedAt as string | undefined) ||
            (row.original.updatedAt as string | undefined) ||
            null
        ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.amount)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            (row.original.status?.toLowerCase() as "success" | "pending" | "rejected") ||
            "default"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: "remarks", header: "Remarks" },
    { accessorKey: "adminName", header: "Admin" },
  ];

  if (!hasSuperAdminWalletAccess) return null;

  const adminOptions = admins.map((admin) => ({
    value: getAdminId(admin),
    label: getAdminDisplayName(admin),
  }));

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Admin Fund Requests"
        subtitle="Fund requests by admin with pagination and filters"
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
          showDateRange
          showStatus
          showSort={false}
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          searchPlaceholder="Search fund requests..."
          resultsCount={data.length}
          adminSelect={{
            value: selectedAdminId,
            onChange: (value) => {
              setSelectedAdminId(value);
              setPageIndex(0);
            },
            options:
              adminOptions.length > 0
                ? adminOptions
                : [
                    {
                      value: "",
                      label: isLoadingAdmins ? "Loading..." : "No admins",
                    },
                  ],
          }}
        />

        {!selectedAdminId ? (
          <p className="py-8 text-center text-sm text-muted">
            Select an admin to view fund requests
          </p>
        ) : (
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
        )}
      </Card>
    </div>
  );
}
