"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import { AdminRecord } from "@/types/superAdmin";
import {
  getAdminDisplayName,
  getAdminBalance,
  getAdminId,
} from "@/services/admin";
import { formatCurrency } from "@/lib/utils";

interface AdminColumnActions {
  onView: (admin: AdminRecord) => void;
  onEdit: (admin: AdminRecord) => void;
  onDelete: (admin: AdminRecord) => void;
  disabled?: boolean;
}

export function createAdminColumns(
  actions: AdminColumnActions
): ColumnDef<AdminRecord, unknown>[] {
  return [
    {
      id: "profileImage",
      header: "Profile",
      cell: ({ row }) => <NetworkUserAvatar user={row.original} size="sm" />,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => getAdminDisplayName(row.original),
    },
    {
      accessorKey: "id",
      header: "Admin ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{getAdminId(row.original)}</span>
      ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "mobile", header: "Mobile" },
    {
      accessorKey: "userType",
      header: "User Type",
      cell: ({ row }) => (
        <Badge variant="default">
          {(row.original.userType || "ADMIN").toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.status || "—"}</Badge>
      ),
    },
    {
      accessorKey: "balance",
      header: "Wallet Balance",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {formatCurrency(getAdminBalance(row.original))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="View admin"
            disabled={actions.disabled}
            onClick={() => actions.onView(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Edit admin"
            disabled={actions.disabled}
            onClick={() => actions.onEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete admin"
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
