import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/common/Badge";
import { AdminWalletHistoryRecord } from "@/types/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

function parseAmount(value: number | string | undefined): number {
  if (value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function resolveReceiver(record: AdminWalletHistoryRecord): string {
  return (
    record.masterDistributorName ||
    record.recipientName ||
    record.receiverName ||
    "—"
  );
}

function balanceBefore(record: AdminWalletHistoryRecord): number | undefined {
  if (record.previousBalance != null) return parseAmount(record.previousBalance);
  if (record.balanceBefore != null) return parseAmount(record.balanceBefore);
  return undefined;
}

function balanceAfter(record: AdminWalletHistoryRecord): number | undefined {
  if (record.updatedBalance != null) return parseAmount(record.updatedBalance);
  if (record.currentBalance != null) return parseAmount(record.currentBalance);
  if (record.balanceAfter != null) return parseAmount(record.balanceAfter);
  return undefined;
}

export function buildAdminTransferHistoryColumns(): ColumnDef<
  AdminWalletHistoryRecord,
  unknown
>[] {
  return [
    {
      id: "transferId",
      header: "Transfer ID",
      cell: ({ row }) =>
        row.original.transferId ||
        row.original.transactionId ||
        row.original.id ||
        "—",
    },
    {
      id: "receiver",
      header: "Receiver Name",
      cell: ({ row }) => resolveReceiver(row.original),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatCurrency(parseAmount(row.original.amount))}
        </span>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: ({ row }) =>
        row.original.description || row.original.remarks || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        if (!status) return "—";
        const normalized = status.toLowerCase();
        const variant =
          normalized === "success" ||
          normalized === "approved" ||
          normalized === "completed"
            ? "success"
            : normalized === "pending"
              ? "pending"
              : normalized === "rejected" || normalized === "failed"
                ? "rejected"
                : "default";
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      id: "createdDate",
      header: "Created Date",
      cell: ({ row }) =>
        formatDate(row.original.createdAt || row.original.date || ""),
    },
  ];
}

export function buildAdminHistoryColumns(): ColumnDef<
  AdminWalletHistoryRecord,
  unknown
>[] {
  return [
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => row.original.transactionId || row.original.id || "—",
    },
    {
      id: "receiver",
      header: "Receiver",
      cell: ({ row }) => resolveReceiver(row.original),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatCurrency(parseAmount(row.original.amount))}
        </span>
      ),
    },
    {
      id: "balanceBefore",
      header: "Balance Before",
      cell: ({ row }) => {
        const val = balanceBefore(row.original);
        return val !== undefined ? formatCurrency(val) : "—";
      },
    },
    {
      id: "balanceAfter",
      header: "Balance After",
      cell: ({ row }) => {
        const val = balanceAfter(row.original);
        return val !== undefined ? formatCurrency(val) : "—";
      },
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
      cell: ({ row }) => {
        const status = row.original.status;
        if (!status) return "—";
        const normalized = status.toLowerCase();
        const variant =
          normalized === "success" || normalized === "approved"
            ? "success"
            : normalized === "pending"
              ? "pending"
              : normalized === "rejected"
                ? "rejected"
                : "default";
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    { accessorKey: "remarks", header: "Remarks" },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) =>
        formatDate(row.original.createdAt || row.original.date || ""),
    },
  ];
}

export function buildAdminLedgerColumns(): ColumnDef<
  AdminWalletHistoryRecord,
  unknown
>[] {
  return [
    {
      accessorKey: "transactionType",
      header: "Entry",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.transactionType}</Badge>
      ),
    },
    {
      id: "credit",
      header: "Credit",
      cell: ({ row }) => {
        const type = row.original.transactionType?.toUpperCase() || "";
        const isCredit = type.includes("CREDIT") || type.includes("ADD");
        return isCredit ? formatCurrency(parseAmount(row.original.amount)) : "—";
      },
    },
    {
      id: "debit",
      header: "Debit",
      cell: ({ row }) => {
        const type = row.original.transactionType?.toUpperCase() || "";
        const isDebit =
          type.includes("DEBIT") ||
          type.includes("TRANSFER") ||
          type.includes("DEDUCT");
        return isDebit ? formatCurrency(parseAmount(row.original.amount)) : "—";
      },
    },
    {
      id: "balance",
      header: "Balance",
      cell: ({ row }) => {
        const val = balanceAfter(row.original);
        return val !== undefined ? formatCurrency(val) : "—";
      },
    },
    {
      id: "reference",
      header: "Reference",
      cell: ({ row }) =>
        row.original.transactionId || row.original.remarks || row.original.id,
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) =>
        formatDate(row.original.createdAt || row.original.date || ""),
    },
  ];
}
