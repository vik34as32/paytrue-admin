"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { VerificationActions } from "@/components/verification/VerificationActions";
import { NetworkUserRecord } from "@/types/superAdmin";
import {
  getUserVerificationDisplayLabel,
  getUserVerificationStatus,
} from "@/lib/idVerification";
import {
  getNetworkUserName,
  getUserAadhaarBackImage,
  getUserAadhaarFrontImage,
  getUserAadhaarNumber,
  getUserCancelledChequeImage,
  getUserDateOfBirth,
  getUserFirstName,
  getUserKycCompletedAt,
  getUserMiniKycStatus,
  getUserOutletField,
  getUserOutletId,
  getUserPanCardImage,
  getUserPanNumber,
  getUserPassbookImage,
  getWalletBalance,
} from "@/lib/normalizeUser";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DocImageCell,
  DocumentStatusCell,
  DistributorCell,
  EmailCell,
  getRecordPhone,
  MasterDistributorCell,
  PhoneCell,
  ProfileCell,
  StatusPill,
} from "@/components/user-management/cells";
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

function monoCell(value: string) {
  return (
    <span
      className="block max-w-[160px] truncate font-mono text-xs text-slate-700 dark:text-foreground"
      title={value !== "—" ? value : undefined}
    >
      {value}
    </span>
  );
}

function textCell(value: string, max = 180) {
  return (
    <span
      className="block truncate text-xs font-medium text-slate-700 dark:text-foreground"
      style={{ maxWidth: max }}
      title={value !== "—" ? value : undefined}
    >
      {value}
    </span>
  );
}

/** Shared extended columns for Retailer / Distributor / MD lists. */
function buildExtendedDetailColumns(
  kind?: NetworkUserListKind
): ColumnDef<NetworkUserRecord, unknown>[] {
  const isRetailer = kind === "RETAILER";

  const columns: ColumnDef<NetworkUserRecord, unknown>[] = [
    {
      id: "address",
      header: "Address",
      enableSorting: false,
      cell: ({ row }) => textCell(getUserOutletField(row.original, "address"), 200),
    },
    {
      id: "district",
      header: "District",
      enableSorting: false,
      cell: ({ row }) => textCell(getUserOutletField(row.original, "district"), 120),
    },
    {
      id: "city",
      header: "City",
      enableSorting: false,
      cell: ({ row }) => textCell(getUserOutletField(row.original, "city"), 120),
    },
    {
      id: "pincode",
      header: "Pincode",
      enableSorting: false,
      cell: ({ row }) => monoCell(getUserOutletField(row.original, "pincode")),
    },
    {
      id: "latitude",
      header: "Latitude",
      enableSorting: false,
      cell: ({ row }) => monoCell(getUserOutletField(row.original, "latitude")),
    },
    {
      id: "longitude",
      header: "Longitude",
      enableSorting: false,
      cell: ({ row }) => monoCell(getUserOutletField(row.original, "longitude")),
    },
  ];

  if (isRetailer) {
    columns.push(
      {
        id: "miniKycStatus",
        header: "Mini KYC Status",
        enableSorting: false,
        cell: ({ row }) => {
          const value = getUserMiniKycStatus(row.original);
          if (value === "—") return <span className="text-xs text-slate-400">—</span>;
          return <StatusPill status={value} />;
        },
      },
      {
        id: "dateOfBirth",
        header: "Date of Birth",
        enableSorting: false,
        cell: ({ row }) => {
          const raw = getUserDateOfBirth(row.original);
          if (raw === "—") return <span className="text-xs text-slate-400">—</span>;
          return (
            <span className="whitespace-nowrap text-xs font-medium text-slate-700">
              {formatDate(raw, "dd MMM yyyy")}
            </span>
          );
        },
      },
      {
        id: "kycCompletedAt",
        header: "KYC Completed At",
        enableSorting: false,
        cell: ({ row }) => {
          const raw = getUserKycCompletedAt(row.original);
          if (!raw) return <span className="text-xs text-slate-400">—</span>;
          return (
            <span className="whitespace-nowrap text-xs font-medium text-slate-700">
              {formatDate(raw, "dd MMM yyyy, HH:mm")}
            </span>
          );
        },
      }
    );
  }

  columns.push(
    {
      id: "aadhaarNumber",
      header: "Aadhaar Number",
      enableSorting: false,
      cell: ({ row }) => monoCell(getUserAadhaarNumber(row.original)),
    },
    {
      id: "aadhaarFrontImage",
      header: "Aadhaar Front",
      enableSorting: false,
      cell: ({ row }) => (
        <DocImageCell
          src={getUserAadhaarFrontImage(row.original)}
          label="Aadhaar Front"
        />
      ),
    },
    {
      id: "aadhaarBackImage",
      header: "Aadhaar Back",
      enableSorting: false,
      cell: ({ row }) => (
        <DocImageCell
          src={getUserAadhaarBackImage(row.original)}
          label="Aadhaar Back"
        />
      ),
    },
    {
      id: "panNumber",
      header: "PAN Number",
      enableSorting: false,
      cell: ({ row }) => monoCell(getUserPanNumber(row.original)),
    },
    {
      id: "panCardImage",
      header: "PAN Image",
      enableSorting: false,
      cell: ({ row }) => (
        <DocImageCell
          src={getUserPanCardImage(row.original)}
          label="PAN Card"
        />
      ),
    },
    {
      id: "passbookImage",
      header: "Passbook Image",
      enableSorting: false,
      cell: ({ row }) => (
        <DocImageCell
          src={getUserPassbookImage(row.original)}
          label="Passbook"
        />
      ),
    },
    {
      id: "cancelledChequeImage",
      header: "Cancelled Cheque",
      enableSorting: false,
      cell: ({ row }) => (
        <DocImageCell
          src={getUserCancelledChequeImage(row.original)}
          label="Cancelled Cheque"
        />
      ),
    },
    {
      id: "walletBalance",
      header: "Wallet Balance",
      enableSorting: false,
      meta: { align: "right" as const },
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-slate-900 dark:text-foreground">
          {formatCurrency(getWalletBalance(row.original))}
        </span>
      ),
    }
  );

  return columns;
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
  const showEditDelete = actions.showEditDelete === true;
  const name = getNetworkUserName(user);

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
        />
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className="!h-9 !w-9 shrink-0 !rounded-lg !border !border-slate-200 !bg-white !p-0 text-slate-600 shadow-sm hover:!bg-slate-50 dark:!border-border dark:!bg-card"
        aria-label={`View profile for ${name}`}
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
            className="!h-9 !w-9 shrink-0 !rounded-lg !border !border-slate-200 !bg-white !p-0 text-slate-600 shadow-sm hover:!bg-slate-50 dark:!border-border dark:!bg-card"
            aria-label={`Edit user ${name}`}
            disabled={actions.disabled}
            onClick={() => actions.onEdit(user)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="!h-9 !w-9 shrink-0 !rounded-lg !border !border-slate-200 !bg-white !p-0 shadow-sm hover:!bg-rose-50 dark:!border-border dark:!bg-card"
            aria-label={`Delete user ${name}`}
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
  const showHierarchy = kind === "RETAILER" || kind === "DISTRIBUTOR";

  const columns: ColumnDef<NetworkUserRecord, unknown>[] = [
    {
      id: "profile",
      header: "User",
      enableSorting: false,
      size: 260,
      cell: ({ row }) => <ProfileCell user={row.original} kind={kind} />,
    },
  ];

  if (isRetailer) {
    columns.push({
      id: "outletId",
      header: "Outlet ID",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-foreground">
          {getUserOutletId(row.original)}
        </span>
      ),
    });
  }

  columns.push(
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <EmailCell
          email={row.original.email}
          name={displayName(row.original, kind)}
        />
      ),
    },
    {
      id: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <PhoneCell
          phone={getRecordPhone(row.original)}
          name={displayName(row.original, kind)}
        />
      ),
    },
    {
      id: "documents",
      header: "Documents",
      enableSorting: false,
      cell: ({ row }) => <DocumentStatusCell user={row.original} />,
    }
  );

  if (showHierarchy) {
    if (kind === "RETAILER") {
      columns.push(
        {
          id: "masterDistributor",
          header: "Master Distributor",
          enableSorting: false,
          size: 200,
          cell: ({ row }) => <MasterDistributorCell user={row.original} />,
        },
        {
          id: "distributor",
          header: "Distributor",
          enableSorting: false,
          size: 200,
          cell: ({ row }) => <DistributorCell user={row.original} />,
        }
      );
    } else {
      columns.push({
        id: "masterDistributor",
        header: "Master Distributor",
        enableSorting: false,
        size: 220,
        cell: ({ row }) => <MasterDistributorCell user={row.original} />,
      });
    }
  }

  columns.push(...buildExtendedDetailColumns(kind));

  columns.push(
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusPill status={row.original.status} />,
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
        <span className="whitespace-nowrap text-xs font-medium text-slate-500">
          {formatDate(row.original.createdAt, "dd MMM yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      meta: { align: "center" as const },
      size: 160,
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
  return createAdminNetworkUserColumns(actions);
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
  const kind = options?.userKind;
  const isRetailer = kind === "RETAILER";
  const showHierarchy = kind === "RETAILER" || kind === "DISTRIBUTOR";

  const columns: ColumnDef<NetworkUserRecord, unknown>[] = [
    {
      id: "profile",
      header: "User",
      enableSorting: true,
      accessorKey: "name",
      size: 280,
      cell: ({ row }) => <ProfileCell user={row.original} kind={kind} />,
    },
  ];

  if (isRetailer) {
    columns.push({
      id: "outletId",
      header: "Outlet ID",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-foreground">
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
      cell: ({ row }) => (
        <EmailCell
          email={row.original.email}
          name={displayName(row.original, kind)}
        />
      ),
    },
    {
      id: "phone",
      accessorKey: "mobile",
      header: "Phone",
      enableSorting: true,
      cell: ({ row }) => (
        <PhoneCell
          phone={getRecordPhone(row.original)}
          name={displayName(row.original, kind)}
        />
      ),
    },
    {
      id: "documents",
      header: "Documents",
      enableSorting: false,
      cell: ({ row }) => <DocumentStatusCell user={row.original} />,
    }
  );

  if (showHierarchy) {
    if (kind === "RETAILER") {
      columns.push(
        {
          id: "masterDistributor",
          header: "Master Distributor",
          enableSorting: false,
          size: 200,
          cell: ({ row }) => <MasterDistributorCell user={row.original} />,
        },
        {
          id: "distributor",
          header: "Distributor",
          enableSorting: false,
          size: 200,
          cell: ({ row }) => <DistributorCell user={row.original} />,
        }
      );
    } else {
      columns.push({
        id: "masterDistributor",
        header: "Master Distributor",
        enableSorting: false,
        size: 220,
        cell: ({ row }) => <MasterDistributorCell user={row.original} />,
      });
    }
  }

  columns.push(...buildExtendedDetailColumns(kind));

  columns.push(
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <StatusPill status={row.original.status} />,
    },
    {
      id: "verificationStatus",
      header: "Verification",
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
      meta: { align: "center" as const },
      cell: ({ row }) => {
        const user = row.original;
        const status = getUserVerificationStatus(user);
        const accountStatus = String(user.status || "").toUpperCase();
        const showMoreMenu =
          !actions.showVerificationActions ||
          status === "VERIFIED" ||
          accountStatus === "INACTIVE" ||
          accountStatus === "SUSPENDED";
        const name = displayName(user, kind);

        return (
          <div className="inline-flex w-max flex-nowrap items-center justify-center gap-1.5 whitespace-nowrap">
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
              <SuperAdminUserActionsMenu
                user={user}
                actions={actions}
                ariaLabel={`More actions for ${name}`}
              />
            ) : null}
          </div>
        );
      },
    }
  );

  return columns;
}
