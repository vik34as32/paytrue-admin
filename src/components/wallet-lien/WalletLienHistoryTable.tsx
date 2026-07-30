"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { WalletLienStatusBadge } from "@/components/wallet-lien/WalletLienStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WalletLienHistoryItem } from "@/types/walletLien";

interface WalletLienHistoryTableProps {
  rows: WalletLienHistoryItem[];
  isLoading?: boolean;
}

export function WalletLienHistoryTable({
  rows,
  isLoading,
}: WalletLienHistoryTableProps) {
  const columns: ColumnDef<WalletLienHistoryItem, unknown>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) =>
        formatDate(getValue<string | null>(), "dd MMM yyyy, HH:mm"),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ getValue }) => getValue<string>() || "—",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue }) => formatCurrency(getValue<number>()),
    },
    {
      accessorKey: "remainingAmount",
      header: "Remaining Amount",
      cell: ({ getValue }) => formatCurrency(getValue<number>()),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <WalletLienStatusBadge status={getValue<string>()} />
      ),
    },
    {
      accessorKey: "performedBy",
      header: "Performed By",
      cell: ({ getValue }) => getValue<string | null>() || "—",
    },
  ];

  return (
    <DataTable
      data={rows}
      columns={columns}
      isLoading={isLoading}
      hideSearch
      pageSize={10}
    />
  );
}
