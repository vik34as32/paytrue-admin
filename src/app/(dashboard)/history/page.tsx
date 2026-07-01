"use client";

import { useCallback, useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useRoleAccess } from "@/hooks/useAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminWalletHistory } from "@/store/api/adminModuleApi";
import { fetchWalletHistory } from "@/store/api/superAdminWalletApi";
import { selectAdminWalletHistory } from "@/store/selectors/adminSelectors";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/common/Badge";
import { AdminWalletHistoryRecord } from "@/types/admin";
import { WalletHistoryRecord } from "@/types/superAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const dispatch = useAppDispatch();
  const { isAdminApiAuth, isSuperAdminApiAuth } = useRoleAccess();
  const adminHistory = useAppSelector(selectAdminWalletHistory);
  const superHistory = useAppSelector((state) => state.superAdminWallet);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");

  const loadAdminHistory = useCallback(() => {
    dispatch(
      fetchAdminWalletHistory({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
      })
    );
  }, [dispatch, pageIndex, search]);

  useEffect(() => {
    if (isAdminApiAuth) {
      loadAdminHistory();
    } else if (isSuperAdminApiAuth) {
      dispatch(fetchWalletHistory({ page: 1, pageSize: 50 }));
    }
  }, [dispatch, isAdminApiAuth, isSuperAdminApiAuth, loadAdminHistory]);

  const adminColumns: ColumnDef<AdminWalletHistoryRecord, unknown>[] = [
    {
      accessorKey: "transactionType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.transactionType}</Badge>
      ),
    },
    { accessorKey: "remarks", header: "Description" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) =>
        formatDate(row.original.date || row.original.createdAt || ""),
    },
  ];

  const superColumns: ColumnDef<WalletHistoryRecord, unknown>[] = [
    {
      accessorKey: "transactionType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.transactionType}</Badge>
      ),
    },
    { accessorKey: "remarks", header: "Description" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) =>
        formatDate(row.original.date || row.original.createdAt || ""),
    },
  ];

  if (isAdminApiAuth) {
    return (
      <div className="page-container space-y-6">
        <PageHeader title="Wallet History" subtitle="Your admin wallet transactions" />
        {adminHistory.error && (
          <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {adminHistory.error}
          </div>
        )}
        <Card>
          <DataTable
            data={adminHistory.data}
            columns={adminColumns}
            isLoading={adminHistory.isLoading}
            searchPlaceholder="Search history..."
            onSearch={(value) => {
              setSearch(value);
              setPageIndex(0);
            }}
            manualPagination
            pageCount={Math.max(1, Math.ceil(adminHistory.total / PAGE_SIZE))}
            pageIndex={pageIndex}
            onPageChange={setPageIndex}
            pageSize={PAGE_SIZE}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="History" subtitle="Wallet transaction history" />
      {superHistory.error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {superHistory.error}
        </div>
      )}
      <Card>
        <DataTable
          data={superHistory.history}
          columns={superColumns}
          isLoading={superHistory.isLoadingHistory}
          searchPlaceholder="Search history..."
        />
      </Card>
    </div>
  );
}
