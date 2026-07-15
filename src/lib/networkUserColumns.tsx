"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import { NetworkUserRecord } from "@/types/superAdmin";
import {
  formatUserTypeLabel,
  getNetworkUserName,
  getUserAadhaarNumber,
  getUserOutletField,
  getUserOutletName,
  getUserPanNumber,
} from "@/lib/normalizeUser";
import { formatCurrency, formatDate } from "@/lib/utils";

import {
  SuperAdminUserActions,
  SuperAdminUserActionsMenu,
} from "@/components/super-admin/SuperAdminUserActionsMenu";

interface NetworkUserColumnActions {
  onView: (user: NetworkUserRecord) => void;
  onEdit: (user: NetworkUserRecord) => void;
  onDelete: (user: NetworkUserRecord) => void;
  disabled?: boolean;
}

function getPhone(user: NetworkUserRecord): string {
  const phone =
    user.mobile ||
    (typeof user.phone === "string" ? user.phone : undefined) ||
    "";
  return phone || "—";
}

function ActionsCell({
  user,
  actions,
}: {
  user: NetworkUserRecord;
  actions: NetworkUserColumnActions;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        aria-label="View user"
        disabled={actions.disabled}
        onClick={() => actions.onView(user)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Edit user"
        disabled={actions.disabled}
        onClick={() => actions.onEdit(user)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Delete user"
        disabled={actions.disabled}
        onClick={() => actions.onDelete(user)}
      >
        <Trash2 className="h-4 w-4 text-accent-red" />
      </Button>
    </div>
  );
}

/** Compact columns matched to GET /admin/users list payload */
export function createAdminNetworkUserColumns(
  actions: NetworkUserColumnActions
): ColumnDef<NetworkUserRecord, unknown>[] {
  return [
    {
      id: "profileImage",
      header: "Profile",
      cell: ({ row }) => <NetworkUserAvatar user={row.original} size="sm" />,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <p className="font-semibold text-foreground">
            {getNetworkUserName(row.original)}
          </p>
          <p className="text-xs text-muted">
            {formatUserTypeLabel(row.original.userType || row.original.role)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "userCode",
      header: "User Code",
      cell: ({ row }) => (
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {row.original.userCode || "—"}
        </span>
      ),
    },
    { accessorKey: "email", header: "Email" },
    {
      id: "phone",
      header: "Phone",
      cell: ({ row }) => getPhone(row.original),
    },
    {
      id: "walletBalance",
      header: "Wallet",
      meta: { align: "right" as const },
      cell: ({ row }) =>
        typeof row.original.walletBalance === "number"
          ? formatCurrency(row.original.walletBalance)
          : "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = String(row.original.status || "").toUpperCase();
        const variant =
          status === "ACTIVE"
            ? "success"
            : status === "PENDING"
              ? "pending"
              : status === "SUSPENDED"
                ? "suspended"
                : status === "INACTIVE"
                  ? "inactive"
                  : "default";
        return <Badge variant={variant}>{status || "—"}</Badge>;
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
        <ActionsCell user={row.original} actions={actions} />
      ),
    },
  ];
}

export function createNetworkUserColumns(
  actions: NetworkUserColumnActions
): ColumnDef<NetworkUserRecord, unknown>[] {
  return [
    {
      id: "profileImage",
      header: "Profile",
      cell: ({ row }) => <NetworkUserAvatar user={row.original} size="sm" />,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => getNetworkUserName(row.original),
    },
    { accessorKey: "email", header: "Email" },
    {
      id: "mobile",
      header: "Mobile",
      cell: ({ row }) => getPhone(row.original),
    },
    {
      id: "outletName",
      header: "Outlet Name",
      cell: ({ row }) => getUserOutletName(row.original),
    },
    {
      id: "state",
      header: "State",
      cell: ({ row }) => getUserOutletField(row.original, "state"),
    },
    {
      id: "city",
      header: "City",
      cell: ({ row }) => getUserOutletField(row.original, "city"),
    },
    {
      id: "aadhaarNumber",
      header: "Aadhaar Number",
      cell: ({ row }) => getUserAadhaarNumber(row.original),
    },
    {
      id: "panNumber",
      header: "PAN Number",
      cell: ({ row }) => getUserPanNumber(row.original),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.status || "—"}</Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ActionsCell user={row.original} actions={actions} />
      ),
    },
  ];
}

/** Enterprise columns for Super Admin MD / Distributor / Retailer lists */
export function createSuperAdminNetworkUserColumns(
  actions: SuperAdminUserActions,
  options?: { pageIndex?: number; pageSize?: number }
): ColumnDef<NetworkUserRecord, unknown>[] {
  const pageIndex = options?.pageIndex ?? 0;
  const pageSize = options?.pageSize ?? 10;

  return [
    {
      id: "srNo",
      header: "Sr No.",
      enableSorting: false,
      cell: ({ row }) => pageIndex * pageSize + row.index + 1,
    },
    {
      accessorKey: "userCode",
      header: "User Code",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {row.original.userCode || "—"}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex min-w-[150px] items-center gap-2">
          <NetworkUserAvatar user={row.original} size="sm" />
          <span className="font-semibold text-foreground">
            {getNetworkUserName(row.original)}
          </span>
        </div>
      ),
    },
    {
      id: "businessName",
      header: "Business Name",
      enableSorting: false,
      cell: ({ row }) => getUserOutletName(row.original),
    },
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: true,
    },
    {
      id: "phone",
      accessorKey: "mobile",
      header: "Phone",
      enableSorting: true,
      cell: ({ row }) => getPhone(row.original),
    },
    {
      id: "aadhaarNumber",
      header: "Aadhaar Number",
      enableSorting: false,
      cell: ({ row }) => getUserAadhaarNumber(row.original),
    },
    {
      id: "panNumber",
      header: "PAN Number",
      enableSorting: false,
      cell: ({ row }) => getUserPanNumber(row.original),
    },
    {
      id: "walletBalance",
      header: "Wallet Balance",
      enableSorting: false,
      meta: { align: "right" as const },
      cell: ({ row }) =>
        typeof row.original.walletBalance === "number"
          ? formatCurrency(row.original.walletBalance)
          : "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const status = String(row.original.status || "").toUpperCase();
        const variant =
          status === "ACTIVE"
            ? "success"
            : status === "PENDING"
              ? "pending"
              : status === "SUSPENDED"
                ? "suspended"
                : status === "INACTIVE"
                  ? "inactive"
                  : "default";
        return <Badge variant={variant}>{status || "—"}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.createdAt ? formatDate(row.original.createdAt) : "—",
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <SuperAdminUserActionsMenu user={row.original} actions={actions} />
      ),
    },
  ];
}
