"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { MailtoLink } from "@/components/common/MailtoLink";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { VerificationActions } from "@/components/verification/VerificationActions";
import { DocumentThumbStack } from "@/components/verification/DocumentThumbStack";
import { NetworkUserRecord } from "@/types/superAdmin";
import {
  getUserVerificationDisplayLabel,
  getUserVerificationStatus,
} from "@/lib/idVerification";
import {
  formatUserTypeLabel,
  getNetworkUserName,
  getUserAadhaarNumber,
  getUserFirstName,
  getUserOutletField,
  getUserOutletId,
  getUserOutletName,
  getUserPanNumber,
} from "@/lib/normalizeUser";
import { formatDate } from "@/lib/utils";

import {
  SuperAdminUserActions,
  SuperAdminUserActionsMenu,
} from "@/components/super-admin/SuperAdminUserActionsMenu";

interface NetworkUserColumnActions {
  onView: (user: NetworkUserRecord) => void;
  onEdit: (user: NetworkUserRecord) => void;
  onDelete: (user: NetworkUserRecord) => void;
  onVerify?: (user: NetworkUserRecord) => void;
  onReject?: (user: NetworkUserRecord) => void;
  onViewVerification?: (user: NetworkUserRecord) => void;
  onViewRejectReason?: (user: NetworkUserRecord) => void;
  onTransfer?: (user: NetworkUserRecord) => void;
  onDeduct?: (user: NetworkUserRecord) => void;
  showVerificationActions?: boolean;
  /** Edit / Delete — Super Admin only */
  showEditDelete?: boolean;
  disabled?: boolean;
}

export type NetworkUserListKind =
  | "RETAILER"
  | "DISTRIBUTOR"
  | "MASTER_DISTRIBUTOR";

function getPhone(user: NetworkUserRecord): string {
  const phone =
    user.mobile ||
    (typeof user.phone === "string" ? user.phone : undefined) ||
    "";
  return phone || "—";
}

function displayName(
  user: NetworkUserRecord,
  kind?: NetworkUserListKind
): string {
  if (kind === "RETAILER") return getUserFirstName(user);
  return getNetworkUserName(user);
}

function ActionsCell({
  user,
  actions,
}: {
  user: NetworkUserRecord;
  actions: NetworkUserColumnActions;
}) {
  const status = getUserVerificationStatus(user);
  // Edit / Delete only when explicitly enabled (Super Admin).
  const showEditDelete = actions.showEditDelete === true;

  return (
    <div className="inline-flex w-max flex-nowrap items-center gap-1 whitespace-nowrap">
      {actions.showVerificationActions ? (
        <VerificationActions
          status={status}
          canManage
          compact
          disabled={actions.disabled}
          onVerify={() => actions.onVerify?.(user)}
          onReject={() => actions.onReject?.(user)}
          onViewDetails={() => actions.onViewVerification?.(user)}
          onViewReason={() => actions.onViewRejectReason?.(user)}
        />
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className="!h-8 !w-8 shrink-0 !p-0"
        aria-label="View user"
        disabled={actions.disabled}
        onClick={() => actions.onView(user)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {showEditDelete ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="!h-8 !w-8 shrink-0 !p-0"
            aria-label="Edit user"
            disabled={actions.disabled}
            onClick={() => actions.onEdit(user)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="!h-8 !w-8 shrink-0 !p-0"
            aria-label="Delete user"
            disabled={actions.disabled}
            onClick={() => actions.onDelete(user)}
          >
            <Trash2 className="h-4 w-4 text-accent-red" />
          </Button>
        </>
      ) : null}
    </div>
  );
}

function statusBadge(statusRaw?: string) {
  const status = String(statusRaw || "").toUpperCase();
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
}

/** Admin panel columns for MD / Distributor / Retailer lists (not Super Admin). */
export function createAdminNetworkUserColumns(
  actions: NetworkUserColumnActions,
  options?: {
    userKind?: NetworkUserListKind;
    pageIndex?: number;
    pageSize?: number;
  }
): ColumnDef<NetworkUserRecord, unknown>[] {
  const kind = options?.userKind;
  const isRetailer = kind === "RETAILER";
  const pageIndex = options?.pageIndex ?? 0;
  const pageSize = options?.pageSize ?? 10;

  const columns: ColumnDef<NetworkUserRecord, unknown>[] = [
    {
      id: "srNo",
      header: "Sr No.",
      enableSorting: false,
      size: 72,
      cell: ({ row }) => (
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-slate-100 px-1.5 text-xs font-bold text-slate-700 dark:bg-muted dark:text-foreground">
          {pageIndex * pageSize + row.index + 1}
        </span>
      ),
    },
    {
      id: "profileImage",
      header: "Profile",
      enableSorting: false,
      cell: ({ row }) => <NetworkUserAvatar user={row.original} size="sm" />,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <p className="font-semibold text-slate-900 dark:text-foreground">
            {displayName(row.original, kind)}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {formatUserTypeLabel(row.original.userType || row.original.role)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "userCode",
      header: "User Code",
      cell: ({ row }) => (
        <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:border-primary/30 dark:bg-primary/10 dark:text-primary">
          {row.original.userCode || "—"}
        </span>
      ),
    },
  ];

  if (isRetailer) {
    columns.push({
      id: "outletId",
      header: "Outlet ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-foreground">
          {getUserOutletId(row.original)}
        </span>
      ),
    });
  }

  columns.push(
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <MailtoLink email={row.original.email} />,
    },
    {
      id: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums text-slate-800 dark:text-foreground">
          {getPhone(row.original)}
        </span>
      ),
    },
    {
      id: "documents",
      header: "Documents",
      enableSorting: false,
      cell: ({ row }) => <DocumentThumbStack user={row.original} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => statusBadge(row.original.status),
    },
    {
      id: "verificationStatus",
      header: "Verification",
      cell: ({ row }) => (
        <VerificationBadge
          status={getUserVerificationStatus(row.original)}
          label={getUserVerificationDisplayLabel(row.original)}
        />
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-slate-600 dark:text-muted">
          {formatDate(row.original.createdAt, "dd MMM yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      size: 220,
      cell: ({ row }) => (
        <ActionsCell user={row.original} actions={actions} />
      ),
    }
  );

  return columns;
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
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <MailtoLink email={row.original.email} />,
    },
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
  options?: {
    pageIndex?: number;
    pageSize?: number;
    userKind?: NetworkUserListKind;
  }
): ColumnDef<NetworkUserRecord, unknown>[] {
  const pageIndex = options?.pageIndex ?? 0;
  const pageSize = options?.pageSize ?? 10;
  const kind = options?.userKind;
  const isRetailer = kind === "RETAILER";

  const columns: ColumnDef<NetworkUserRecord, unknown>[] = [
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
            {displayName(row.original, kind)}
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
  ];

  if (isRetailer) {
    columns.push({
      id: "outletId",
      header: "Outlet ID",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {getUserOutletId(row.original)}
        </span>
      ),
    });
  }

  columns.push(
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: true,
      cell: ({ row }) => <MailtoLink email={row.original.email} />,
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
      id: "documents",
      header: "Documents",
      enableSorting: false,
      cell: ({ row }) => <DocumentThumbStack user={row.original} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => statusBadge(row.original.status),
    },
    {
      id: "verificationStatus",
      header: "Verification Status",
      enableSorting: false,
      cell: ({ row }) => (
        <VerificationBadge
          status={getUserVerificationStatus(row.original)}
          label={getUserVerificationDisplayLabel(row.original)}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        const status = getUserVerificationStatus(user);
        const accountStatus = String(user.status || "").toUpperCase();
        // Verified users get full menu; inactive/suspended can open menu to Activate
        const showMoreMenu =
          !actions.showVerificationActions ||
          status === "VERIFIED" ||
          accountStatus === "INACTIVE" ||
          accountStatus === "SUSPENDED";

        return (
          <div className="inline-flex w-max flex-nowrap items-center gap-1.5 whitespace-nowrap">
            {actions.showVerificationActions ? (
              <VerificationActions
                status={status}
                canManage
                compact
                disabled={actions.disabled}
                onVerify={() => actions.onVerify?.(user)}
                onReject={() => actions.onReject?.(user)}
                onViewDetails={() => actions.onViewVerification?.(user)}
                onViewReason={() => actions.onViewRejectReason?.(user)}
                onTransfer={() => actions.onTransfer?.(user)}
                onDeduct={() => actions.onDeduct?.(user)}
              />
            ) : null}
            {showMoreMenu ? (
              <SuperAdminUserActionsMenu user={user} actions={actions} />
            ) : null}
          </div>
        );
      },
    }
  );

  return columns;
}
