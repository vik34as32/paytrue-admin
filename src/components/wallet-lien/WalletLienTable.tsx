"use client";

import { useMemo } from "react";
import { ColumnDef, SortingState, OnChangeFn } from "@tanstack/react-table";
import { Eye, Unlock } from "lucide-react";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/common/Button";
import { WalletLienStatusBadge } from "@/components/wallet-lien/WalletLienStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WalletLienRecord } from "@/types/walletLien";

interface WalletLienTableProps {
  rows: WalletLienRecord[];
  isLoading?: boolean;
  searchValue: string;
  onSearch: (value: string) => void;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onView: (row: WalletLienRecord) => void;
  onRelease: (row: WalletLienRecord) => void;
}

export function WalletLienTable({
  rows,
  isLoading,
  searchValue,
  onSearch,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
  sorting,
  onSortingChange,
  onView,
  onRelease,
}: WalletLienTableProps) {
  const columns = useMemo<ColumnDef<WalletLienRecord, unknown>[]>(
    () => [
      {
        id: "user",
        accessorKey: "userName",
        header: "User",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{row.original.userName}</p>
            <p className="text-xs text-muted">
              {row.original.userCode || row.original.userId}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
        cell: ({ getValue }) => getValue<string | null>() || "—",
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ getValue }) =>
          String(getValue<string>() || "—")
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase()),
      },
      {
        accessorKey: "mainWalletBalance",
        header: "Main Wallet Balance",
        meta: { align: "right" as const },
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums">
            {formatCurrency(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: "remainingAmount",
        header: "Lien Amount",
        meta: { align: "right" as const },
        cell: ({ getValue }) => (
          <span className="block text-right font-semibold tabular-nums text-amber-700">
            {formatCurrency(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: "availableBalance",
        header: "Available Balance",
        meta: { align: "right" as const },
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums">
            {formatCurrency(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <WalletLienStatusBadge status={getValue<string>()} />
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Created By",
        cell: ({ getValue }) => getValue<string | null>() || "—",
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ getValue }) =>
          formatDate(getValue<string | null>(), "dd MMM yyyy, HH:mm"),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const canRelease = ["ACTIVE", "PARTIALLY_RELEASED"].includes(
            row.original.status.toUpperCase()
          );
          return (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => onView(row.original)}
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
              {canRelease ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  onClick={() => onRelease(row.original)}
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Release
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [onView, onRelease]
  );

  return (
    <DataTable
      data={rows}
      columns={columns}
      isLoading={isLoading}
      searchPlaceholder="Search user, mobile, user code…"
      searchValue={searchValue}
      onSearch={onSearch}
      manualPagination
      pageIndex={pageIndex}
      pageCount={pageCount}
      pageSize={pageSize}
      onPageChange={onPageChange}
      pageSizeOptions={[10, 20, 50]}
      onPageSizeChange={onPageSizeChange}
      manualSorting
      sorting={sorting}
      onSortingChange={onSortingChange}
      stickyHeader
      tone="network"
      minTableWidth={1100}
    />
  );
}
