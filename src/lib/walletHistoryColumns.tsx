import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/common/Badge";
import { WalletHistoryRecord } from "@/types/superAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";

const KNOWN_COLUMN_KEYS = new Set([
  "id",
  "transactionId",
  "transactionType",
  "receiverName",
  "adminName",
  "recipientName",
  "receiverRole",
  "receiverEmail",
  "amount",
  "previousBalance",
  "balanceBefore",
  "currentBalance",
  "updatedBalance",
  "balanceAfter",
  "status",
  "remarks",
  "createdAt",
  "date",
  "updatedAt",
  "adminId",
]);

const CURRENCY_KEYS = new Set([
  "amount",
  "previousbalance",
  "balancebefore",
  "currentbalance",
  "updatedbalance",
  "balanceafter",
]);

const DATE_KEYS = new Set(["createdat", "updatedat", "date"]);

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatCellValue(key: string, value: string | number): string {
  const lower = key.toLowerCase();
  if (typeof value === "number" && CURRENCY_KEYS.has(lower)) {
    return formatCurrency(value);
  }
  if (DATE_KEYS.has(lower) && typeof value === "string") {
    return formatDate(value);
  }
  return String(value);
}

function resolveReceiverName(record: WalletHistoryRecord): string {
  if (
    record.transactionType === "ADD_BALANCE" &&
    !record.adminId &&
    !record.receiverName &&
    !record.adminName
  ) {
    return "Super Admin Wallet";
  }
  if (record.receiverName || record.adminName || record.recipientName) {
    return (
      record.receiverName ||
      record.adminName ||
      record.recipientName ||
      "—"
    );
  }
  if (record.adminId) {
    return record.adminId;
  }
  return "—";
}

function resolveBalanceBefore(record: WalletHistoryRecord): number | undefined {
  if (typeof record.balanceBefore === "number") return record.balanceBefore;
  if (typeof record.previousBalance === "number") return record.previousBalance;
  return undefined;
}

function resolveBalanceAfter(record: WalletHistoryRecord): number | undefined {
  if (typeof record.balanceAfter === "number") return record.balanceAfter;
  if (typeof record.updatedBalance === "number") return record.updatedBalance;
  if (typeof record.currentBalance === "number") return record.currentBalance;
  return undefined;
}

function getExtraColumnKeys(records: WalletHistoryRecord[]): string[] {
  const extras = new Set<string>();
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      if (
        !KNOWN_COLUMN_KEYS.has(key) &&
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        extras.add(key);
      }
    }
  }
  return Array.from(extras).sort();
}

function truncateId(id: string | undefined, visible = 8): string {
  if (!id) return "—";
  if (id.length <= visible) return id;
  return `${id.slice(0, visible)}...`;
}

function resolveTransferRecipient(record: WalletHistoryRecord): {
  name: string;
  role?: string;
} {
  const name =
    record.receiverName ||
    record.adminName ||
    record.recipientName ||
    record.adminId ||
    "—";
  return { name, role: record.receiverRole };
}

function HighlightAmount({ value }: { value: number }) {
  return (
    <span className="inline-block rounded-md bg-accent-green/10 px-2.5 py-1 text-sm font-semibold text-accent-green">
      {formatCurrency(value)}
    </span>
  );
}

export function buildTransferBalanceColumns(): ColumnDef<
  WalletHistoryRecord,
  unknown
>[] {
  return [
    {
      id: "createdAt",
      header: "Date",
      cell: ({ row }) =>
        formatDate(row.original.createdAt || row.original.date || ""),
    },
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => {
        const fullId = row.original.transactionId || row.original.id;
        return (
          <span className="font-mono text-sm" title={fullId}>
            {truncateId(fullId)}
          </span>
        );
      },
    },
    {
      id: "transferredTo",
      header: "Transferred To",
      cell: ({ row }) => {
        const { name, role } = resolveTransferRecipient(row.original);
        return (
          <div className="min-w-[140px]">
            <span className="font-medium text-foreground">{name}</span>
            {role ? (
              <span className="ml-1.5 text-sm text-muted">({role})</span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Transfer Amount",
      cell: ({ row }) => <HighlightAmount value={row.original.amount} />,
    },
    {
      id: "balanceBefore",
      header: "Balance Before",
      cell: ({ row }) => {
        const value = resolveBalanceBefore(row.original);
        return value !== undefined ? formatCurrency(value) : "—";
      },
    },
    {
      id: "balanceAfter",
      header: "Balance After",
      cell: ({ row }) => {
        const value = resolveBalanceAfter(row.original);
        return value !== undefined ? formatCurrency(value) : "—";
      },
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => row.original.remarks || "—",
    },
  ];
}

export function buildWalletHistoryColumns(
  records: WalletHistoryRecord[]
): ColumnDef<WalletHistoryRecord, unknown>[] {
  const baseColumns: ColumnDef<WalletHistoryRecord, unknown>[] = [
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => row.original.transactionId || row.original.id || "—",
    },
    {
      accessorKey: "transactionType",
      header: "Transaction Type",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.transactionType}</Badge>
      ),
    },
    // {
    //   id: "receiverName",
    //   header: "Receiver Name",
    //   cell: ({ row }) => resolveReceiverName(row.original),
    // },
    // {
    //   accessorKey: "receiverRole",
    //   header: "Receiver Role",
    //   cell: ({ row }) => row.original.receiverRole || "—",
    // },
    // {
    //   accessorKey: "receiverEmail",
    //   header: "Receiver Email",
    //   cell: ({ row }) => row.original.receiverEmail || "—",
    // },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      id: "balanceBefore",
      header: "Balance Before",
      cell: ({ row }) => {
        const value = resolveBalanceBefore(row.original);
        return value !== undefined ? formatCurrency(value) : "—";
      },
    },
    {
      id: "balanceAfter",
      header: "Balance After",
      cell: ({ row }) => {
        const value = resolveBalanceAfter(row.original);
        return value !== undefined ? formatCurrency(value) : "—";
      },
    },
   {
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const status = "success";

    if (!status) return "—";

    return (
      <Badge
        variant={status.toLowerCase() === "success" ? "success" : "default"}
      >
        {status}
      </Badge>
    );
  },
},
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => row.original.remarks || "—",
    },
    {
      id: "createdAt",
      header: "Created Date",
      cell: ({ row }) =>
        formatDate(row.original.createdAt || row.original.date || ""),
    },
  ];

  const extraKeys = getExtraColumnKeys(records);
  const extraColumns: ColumnDef<WalletHistoryRecord, unknown>[] = extraKeys.map(
    (key) => ({
      accessorKey: key,
      header: formatLabel(key),
      cell: ({ row }) => {
        const value = row.original[key as keyof WalletHistoryRecord];
        if (value === undefined || value === null || value === "") return "—";
        if (typeof value === "string" || typeof value === "number") {
          return formatCellValue(key, value);
        }
        return "—";
      },
    })
  );

  return [...baseColumns, ...extraColumns];
}
