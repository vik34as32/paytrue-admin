"use client";

import { useMemo } from "react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { WalletRoleBadge } from "@/components/wallet-management/WalletRoleBadge";
import { WalletStatusBadge } from "@/components/wallet-management/WalletStatusBadge";
import {
  WalletActionButtons,
  WalletRowAction,
} from "@/components/wallet-management/WalletActionButtons";
import { formatCurrency } from "@/lib/utils";
import {
  WalletSortBy,
  WalletSortOrder,
  WalletUser,
} from "@/types/wallet";

interface WalletTableProps {
  rows: WalletUser[];
  isLoading?: boolean;
  isFetching?: boolean;
  sortBy: WalletSortBy;
  sortOrder: WalletSortOrder;
  onSortChange: (sortBy: WalletSortBy, sortOrder: WalletSortOrder) => void;
  onAction: (action: WalletRowAction, user: WalletUser) => void;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

const SORTABLE = new Set<string>([
  "name",
  "role",
  "mainWallet",
  "commissionWallet",
  "aepsWallet",
  "createdAt",
]);

export function WalletTable({
  rows,
  isLoading,
  sortBy,
  sortOrder,
  onSortChange,
  onAction,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: WalletTableProps) {
  const columns = useMemo<ColumnDef<WalletUser, unknown>[]>(
    () => [
      {
        accessorKey: "userCode",
        header: "User Code",
        enableSorting: false,
        cell: ({ row }) => row.original.userCode || "—",
      },
      {
        accessorKey: "name",
        header: "Name",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {row.original.name || "—"}
          </span>
        ),
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
        enableSorting: false,
        cell: ({ row }) => row.original.mobile || "—",
      },
      {
        accessorKey: "role",
        header: "Role",
        enableSorting: true,
        cell: ({ row }) => <WalletRoleBadge role={row.original.role || ""} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const walletStatus = String(
            row.original.walletStatus || row.original.wallet?.status || ""
          ).toUpperCase();
          const status =
            walletStatus.includes("FROZEN") || walletStatus === "FREEZE"
              ? "FROZEN"
              : row.original.status || "";
          return <WalletStatusBadge status={status} />;
        },
      },
      {
        accessorKey: "mainWallet",
        header: "Main Wallet",
        enableSorting: true,
        meta: { align: "right" as const },
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums text-emerald-700">
            {formatCurrency(row.original.mainWallet || 0)}
          </span>
        ),
      },
      {
        accessorKey: "commissionWallet",
        header: "Commission",
        enableSorting: true,
        meta: { align: "right" as const },
        cell: ({ row }) => formatCurrency(row.original.commissionWallet || 0),
      },
      {
        accessorKey: "aepsWallet",
        header: "AEPS",
        enableSorting: true,
        meta: { align: "right" as const },
        cell: ({ row }) => formatCurrency(row.original.aepsWallet || 0),
      },
      {
        accessorKey: "holdBalance",
        header: "Hold / Lien",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => formatCurrency(row.original.holdBalance || 0),
      },
      {
        accessorKey: "frozenBalance",
        header: "Frozen",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => {
          const amount = row.original.frozenBalance || 0;
          return (
            <span
              className={
                amount > 0
                  ? "font-semibold tabular-nums text-sky-700 dark:text-sky-400"
                  : "tabular-nums"
              }
            >
              {formatCurrency(amount)}
            </span>
          );
        },
      },
      {
        accessorKey: "availableBalance",
        header: "Available",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
            {formatCurrency(row.original.availableBalance || 0)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <WalletActionButtons user={row.original} onAction={onAction} />
        ),
      },
    ],
    [onAction]
  );

  const sorting: SortingState = useMemo(
    () => [{ id: sortBy || "createdAt", desc: sortOrder !== "asc" }],
    [sortBy, sortOrder]
  );

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm dark:border-border dark:bg-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#0F172A] dark:text-foreground">
            Wallet Users
          </p>
          <p className="text-xs text-[#64748B]">
            Manage transfer, freeze, lien and deduct actions per user
          </p>
        </div>
        <span className="rounded-full bg-[#4318FF]/10 px-3 py-1 text-xs font-semibold text-[#4318FF]">
          {total.toLocaleString("en-IN")} users
        </span>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        isLoading={isLoading}
        hideSearch
        manualPagination
        pageIndex={Math.max(0, page - 1)}
        pageCount={Math.max(1, totalPages)}
        onPageChange={(index) => onPageChange(index + 1)}
        pageSize={limit}
        totalRows={total}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={onPageSizeChange}
        manualSorting
        sorting={sorting}
        onSortingChange={(updater) => {
          const next = typeof updater === "function" ? updater(sorting) : updater;
          const first = next[0];
          if (!first || !SORTABLE.has(first.id)) {
            onSortChange("createdAt", "desc");
            return;
          }
          onSortChange(
            first.id as WalletSortBy,
            first.desc ? "desc" : "asc"
          );
        }}
        minTableWidth={1280}
        tone="report"
      />
    </div>
  );
}
