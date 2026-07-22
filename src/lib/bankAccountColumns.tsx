"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { BankLogoName } from "@/components/common/BankLogoName";
import { Button } from "@/components/common/Button";
import { BankAccountRecord } from "@/types/bankAccount";
import { formatDate } from "@/lib/utils";

interface BankAccountColumnActions {
  onView: (account: BankAccountRecord) => void;
  onEdit: (account: BankAccountRecord) => void;
  onDelete: (account: BankAccountRecord) => void;
  disabled?: boolean;
}

export function createBankAccountListColumns(): ColumnDef<
  BankAccountRecord,
  unknown
>[] {
  return createBankAccountColumns({
    onView: () => undefined,
    onEdit: () => undefined,
    onDelete: () => undefined,
    disabled: true,
  }).filter((column) => column.id !== "actions");
}

export function createBankAccountColumns(
  actions: BankAccountColumnActions
): ColumnDef<BankAccountRecord, unknown>[] {
  return [
    {
      accessorKey: "accountHolderName",
      header: "Account Holder",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.accountHolderName || "—"}</span>
      ),
    },
    {
      accessorKey: "bankName",
      header: "Bank",
      cell: ({ row }) => (
        <BankLogoName
          bankName={row.original.bankName}
          ifscCode={row.original.ifscCode}
          className="min-w-[140px]"
        />
      ),
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.accountNumber || "—"}</span>
      ),
    },
    {
      accessorKey: "ifscCode",
      header: "IFSC",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.ifscCode || "—"}</span>
      ),
    },
    {
      accessorKey: "branchName",
      header: "Branch",
      cell: ({ row }) => row.original.branchName || "—",
    },
    {
      accessorKey: "upiId",
      header: "UPI ID",
      cell: ({ row }) => row.original.upiId || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || (row.original.isActive ? "ACTIVE" : "INACTIVE");
        return (
          <Badge
            variant={
              status.toUpperCase() === "ACTIVE"
                ? "success"
                : status.toUpperCase() === "INACTIVE"
                  ? "default"
                  : "default"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) =>
        row.original.createdAt ? formatDate(row.original.createdAt) : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="View bank account"
            disabled={actions.disabled}
            onClick={() => actions.onView(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Edit bank account"
            disabled={actions.disabled}
            onClick={() => actions.onEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete bank account"
            disabled={actions.disabled}
            onClick={() => actions.onDelete(row.original)}
          >
            <Trash2 className="h-4 w-4 text-accent-red" />
          </Button>
        </div>
      ),
    },
  ];
}
