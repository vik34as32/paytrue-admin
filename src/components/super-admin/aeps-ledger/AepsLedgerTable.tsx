"use client";

import { useMemo } from "react";
import { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { AepsLedgerStatusBadge } from "@/components/super-admin/aeps-ledger/AepsLedgerStatusBadge";
import { cn, formatCurrency } from "@/lib/utils";
import { AepsLedgerRecord } from "@/types/super-admin-aeps-ledger";

function moneyCell(
  value: number,
  tone: "muted" | "credit" | "debit" | "focus" = "muted"
) {
  if (!value) {
    return <span className="tabular-nums text-muted">₹0.00</span>;
  }
  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        tone === "credit" && "text-emerald-600",
        tone === "debit" && "text-rose-600",
        tone === "focus" &&
          "inline-block rounded-md bg-emerald-600/15 px-2.5 py-1 font-bold text-emerald-800 dark:text-emerald-300",
        tone === "muted" && "text-foreground"
      )}
    >
      {formatCurrency(value)}
    </span>
  );
}

interface AepsLedgerTableProps {
  rows: AepsLedgerRecord[];
  isLoading?: boolean;
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}

export function AepsLedgerTable({
  rows,
  isLoading,
  pageIndex,
  pageCount,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  sorting,
  onSortingChange,
}: AepsLedgerTableProps) {
  const columns = useMemo<ColumnDef<AepsLedgerRecord, unknown>[]>(
    () => [
      {
        id: "rowNumber",
        header: "#",
        enableSorting: false,
        cell: ({ row }) => {
          const offset = pageIndex * pageSize;
          return offset + row.index + 1;
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Date & Time",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums">
            {row.original.dateTime || "—"}
          </span>
        ),
      },
      {
        id: "retailerName",
        accessorKey: "retailerName",
        header: "Retailer",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.retailerName || "—"}
          </span>
        ),
      },
      {
        id: "retailerCode",
        header: "Retailer Code",
        enableSorting: false,
        cell: ({ row }) => row.original.retailerCode || "—",
      },
      {
        id: "mobile",
        header: "Mobile",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.mobile || "—"}</span>
        ),
      },
      {
        id: "ledgerNo",
        accessorKey: "ledgerNo",
        header: "Ledger No",
        enableSorting: true,
        cell: ({ row }) => (
          <span
            className="max-w-[160px] truncate font-mono text-xs font-medium text-primary"
            title={row.original.ledgerNo}
          >
            {row.original.ledgerNo || "—"}
          </span>
        ),
      },
      {
        id: "referenceId",
        header: "Reference ID",
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className="max-w-[140px] truncate font-mono text-xs"
            title={row.original.referenceId}
          >
            {row.original.referenceId || "—"}
          </span>
        ),
      },
      {
        id: "service",
        header: "Service",
        enableSorting: false,
        cell: ({ row }) => row.original.service || "AEPS",
      },
      {
        id: "description",
        header: "Description",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate" title={row.original.description}>
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => (
          <AepsLedgerStatusBadge status={row.original.status} />
        ),
      },
      {
        id: "openingBalance",
        header: "Opening Balance",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.openingBalance),
      },
      {
        id: "txnAmount",
        accessorKey: "txnAmount",
        header: "Transaction Amount",
        enableSorting: true,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.txnAmount),
      },
      {
        id: "charge",
        header: "Charge",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.charge),
      },
      {
        id: "commission",
        header: "Commission",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.commission, "credit"),
      },
      {
        id: "tds",
        header: "TDS",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.tds, "debit"),
      },
      {
        id: "credit",
        header: "Credit (CR)",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.credit, "credit"),
      },
      {
        id: "debit",
        header: "Debit (DR)",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.debit, "debit"),
      },
      {
        id: "closingBalance",
        accessorKey: "closingBalance",
        header: "Closing Balance",
        enableSorting: true,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.closingBalance, "focus"),
      },
      {
        id: "rrn",
        header: "RRN",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.rrn || "—"}</span>
        ),
      },
      {
        id: "bankName",
        header: "Bank Name",
        enableSorting: false,
        cell: ({ row }) => row.original.bankName || "—",
      },
      {
        id: "remarks",
        header: "Remarks",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="block max-w-[180px] truncate text-muted" title={row.original.remarks}>
            {row.original.remarks || "—"}
          </span>
        ),
      },
    ],
    [pageIndex, pageSize]
  );

  return (
    <DataTable
      data={rows}
      columns={columns}
      isLoading={isLoading}
      hideSearch
      manualPagination
      pageIndex={pageIndex}
      pageCount={pageCount}
      onPageChange={onPageChange}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      onPageSizeChange={onPageSizeChange}
      totalRows={totalRows}
      tone="report"
      stickyHeader
      minTableWidth={1800}
      manualSorting
      sorting={sorting}
      onSortingChange={onSortingChange}
    />
  );
}
