"use client";

import { useCallback, useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useRoleAccess } from "@/hooks/useAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminTransferHistory } from "@/store/api/adminModuleApi";
import { fetchWalletHistory } from "@/store/api/superAdminWalletApi";
import { selectAdminTransferHistory } from "@/store/selectors/adminSelectors";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/common/Badge";
import { AdminWalletHistoryRecord } from "@/types/admin";
import { WalletHistoryRecord } from "@/types/superAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const dispatch = useAppDispatch();
  const { isAdminApiAuth, isSuperAdminApiAuth } = useRoleAccess();
  const transferHistory = useAppSelector(selectAdminTransferHistory);
  const superHistory = useAppSelector((state) => state.superAdminWallet);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");

  const loadAdminTransfers = useCallback(() => {
    dispatch(
      fetchAdminTransferHistory({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
      })
    );
  }, [dispatch, pageIndex, search]);

  useEffect(() => {
    if (isAdminApiAuth) {
      loadAdminTransfers();
    } else if (isSuperAdminApiAuth) {
      dispatch(fetchWalletHistory({ page: 1, pageSize: 50 }));
    }
  }, [dispatch, isAdminApiAuth, isSuperAdminApiAuth, loadAdminTransfers]);

  const adminColumns: ColumnDef<AdminWalletHistoryRecord, unknown>[] = [
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => row.original.transactionId || row.original.id,
    },
    {
      accessorKey: "masterDistributorName",
      header: "Master Distributor",
      cell: ({ row }) =>
        row.original.masterDistributorName || row.original.recipientName || "—",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "transactionType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.transactionType}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.status || "—"}</Badge>
      ),
    },
    { accessorKey: "remarks", header: "Remarks" },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) =>
        formatDate(row.original.date || row.original.createdAt || ""),
    },
  ];

  const superColumns: ColumnDef<WalletHistoryRecord, unknown>[] = [
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => row.original.transactionId || row.original.id,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "transactionType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.transactionType}</Badge>
      ),
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
        <PageHeader
          title="Transfer History"
          subtitle="Balance transfers to your master distributors"
        />
        {transferHistory.error && (
          <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {transferHistory.error}
          </div>
        )}
        <Card>
          <DataTable
            data={transferHistory.data}
            columns={adminColumns}
            isLoading={transferHistory.isLoading}
            searchPlaceholder="Search transfers..."
            onSearch={(value) => {
              setSearch(value);
              setPageIndex(0);
            }}
            manualPagination
            pageCount={Math.max(1, Math.ceil(transferHistory.total / PAGE_SIZE))}
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
      <PageHeader title="Transactions" subtitle="Wallet transaction history" />
      <Card>
        <DataTable
          data={superHistory.history}
          columns={superColumns}
          isLoading={superHistory.isLoadingHistory}
          searchPlaceholder="Search transactions..."
        />
      </Card>
    </div>
  );
}
