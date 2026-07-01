"use client";

import { useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchWalletHistory } from "@/store/api/superAdminWalletApi";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { WalletHistoryRecord } from "@/types/superAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function LedgerPage() {
  const dispatch = useAppDispatch();
  const { history, isLoadingHistory, error } = useAppSelector(
    (state) => state.superAdminWallet
  );

  useEffect(() => {
    dispatch(fetchWalletHistory({ page: 1, pageSize: 50 }));
  }, [dispatch]);

  const columns: ColumnDef<WalletHistoryRecord, unknown>[] = [
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => row.original.transactionId || row.original.id,
    },
    {
      accessorKey: "adminName",
      header: "Admin",
      cell: ({ row }) => row.original.adminName || "Super Admin",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "previousBalance",
      header: "Opening Balance",
      cell: ({ row }) => formatCurrency(row.original.previousBalance),
    },
    {
      accessorKey: "currentBalance",
      header: "Closing Balance",
      cell: ({ row }) =>
        formatCurrency(row.original.updatedBalance ?? row.original.currentBalance),
    },
    { accessorKey: "remarks", header: "Remarks" },
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
    {
      accessorKey: "createdAt",
      header: "Date & Time",
      cell: ({ row }) => formatDate(row.original.date || row.original.createdAt || ""),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ledger</h1>
        <p className="text-sm text-muted">Live wallet ledger from API</p>
      </div>
      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}
      <Card>
        <DataTable
          data={history}
          columns={columns}
          isLoading={isLoadingHistory}
          searchPlaceholder="Search ledger..."
        />
      </Card>
    </div>
  );
}
