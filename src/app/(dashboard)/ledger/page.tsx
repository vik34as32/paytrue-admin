"use client";

import { useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchLedger } from "@/store/slices/ledgerSlice";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { LedgerEntry } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function LedgerPage() {
  const dispatch = useAppDispatch();
  const { entries, isLoading } = useAppSelector((state) => state.ledger);

  useEffect(() => {
    dispatch(fetchLedger({ page: 1, pageSize: 50 }));
  }, [dispatch]);

  const columns: ColumnDef<LedgerEntry, unknown>[] = [
    { accessorKey: "transactionId", header: "Transaction ID" },
    { accessorKey: "fromUserName", header: "Transferred From" },
    { accessorKey: "toUserName", header: "Transferred To" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "openingBalance",
      header: "Opening Balance",
      cell: ({ row }) => formatCurrency(row.original.openingBalance),
    },
    {
      accessorKey: "closingBalance",
      header: "Closing Balance",
      cell: ({ row }) => formatCurrency(row.original.closingBalance),
    },
    { accessorKey: "remarks", header: "Remarks" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status as "success" | "pending" | "rejected"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date & Time",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ledger</h1>
        <p className="text-sm text-muted">Complete balance transfer history</p>
      </div>
      <Card>
        <DataTable
          data={entries?.data || []}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search ledger..."
        />
      </Card>
    </div>
  );
}
