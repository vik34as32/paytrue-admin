"use client";

import { useEffect, useState, useCallback } from "react";
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
import { fetchWalletHistory } from "@/store/api/superAdminWalletApi";
import { ROUTES } from "@/constants";
import { WalletHistoryRecord } from "@/types/superAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function WalletHistoryPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const { history, isLoadingHistory, error, historyTotal } = useAppSelector(
    (state) => state.superAdminWallet
  );
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState<SuperAdminListFiltersValue>({});

  const loadHistory = useCallback(() => {
    dispatch(
      fetchWalletHistory({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        transactionType: filters.transactionType,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
    );
  }, [dispatch, pageIndex, search, filters]);

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    loadHistory();
  }, [hasSuperAdminWalletAccess, router, loadHistory]);

  const columns: ColumnDef<WalletHistoryRecord, unknown>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) =>
        formatDate(row.original.date || row.original.createdAt || ""),
    },
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => row.original.transactionId || row.original.id || "—",
    },
    {
      accessorKey: "adminName",
      header: "Admin Name",
      cell: ({ row }) => row.original.adminName || "—",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.amount)}</span>
      ),
    },
    {
      accessorKey: "previousBalance",
      header: "Previous Balance",
      cell: ({ row }) => formatCurrency(row.original.previousBalance),
    },
    {
      id: "updatedBalance",
      header: "Updated Balance",
      cell: ({ row }) =>
        formatCurrency(
          row.original.updatedBalance ?? row.original.currentBalance
        ),
    },
    {
      accessorKey: "transactionType",
      header: "Transaction Type",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.transactionType}</Badge>
      ),
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => row.original.remarks || "—",
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
          {row.original.status || "—"}
        </Badge>
      ),
    },
  ];

  if (!hasSuperAdminWalletAccess) return null;

  const pageCount = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE));

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Wallet History"
        subtitle="Complete transaction history for super admin wallet"
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
          showStatus={false}
          showDateRange
          showTransactionType
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          searchPlaceholder="Search history..."
          resultsCount={history.length}
        />
        <DataTable
          data={history}
          columns={columns}
          isLoading={isLoadingHistory}
          hideSearch
          manualPagination
          pageCount={pageCount}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={PAGE_SIZE}
        />
      </Card>
    </div>
  );
}
