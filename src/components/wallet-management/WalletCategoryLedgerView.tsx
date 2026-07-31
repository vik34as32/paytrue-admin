"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import { ReportExportBar } from "@/components/tables/ReportExportBar";
import { WalletRoleBadge } from "@/components/wallet-management/WalletRoleBadge";
import { WalletStatusBadge } from "@/components/wallet-management/WalletStatusBadge";
import { WalletHoldFreezeLedgerView } from "@/components/wallet-management/WalletHoldFreezeLedgerView";
import { ROUTES } from "@/constants";
import { WALLET_ROLE_OPTIONS } from "@/schemas/wallet-filter.schema";
import {
  downloadReportExcel,
  downloadReportPdf,
  reportFilename,
} from "@/lib/reportExport";
import { cn, formatCurrency } from "@/lib/utils";
import { fetchWalletUsers } from "@/services/wallet.service";
import { WalletUser, WalletUserRole } from "@/types/wallet";
import {
  isWalletCategoryLedgerType,
  WALLET_CATEGORY_LEDGER_META,
  WalletCategoryLedgerType,
} from "@/types/walletCategoryLedger";

const PAGE_SIZE = 20;
const FETCH_LIMIT = 100;
const MAX_PAGES = 50;

interface WalletCategoryLedgerViewProps {
  scope: "admin" | "super_admin";
  breadcrumb: string;
}

function amountForCategory(
  user: WalletUser,
  type: WalletCategoryLedgerType
): number {
  switch (type) {
    case "main":
      return user.mainWallet || 0;
    case "commission":
      return user.commissionWallet || 0;
    case "aeps":
      return user.aepsWallet || 0;
    case "hold":
      return user.holdBalance || 0;
    case "frozen":
      return user.frozenBalance || 0;
    case "users":
    default:
      return user.totalBalance || 0;
  }
}

function matchesCategory(
  user: WalletUser,
  type: WalletCategoryLedgerType
): boolean {
  if (type === "hold") return (user.holdBalance || 0) > 0;
  if (type === "frozen") return (user.frozenBalance || 0) > 0;
  return true;
}

async function fetchAllWalletUsers(options?: {
  search?: string;
  role?: WalletUserRole | "";
}): Promise<WalletUser[]> {
  const all: WalletUser[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await fetchWalletUsers({
      page,
      limit: FETCH_LIMIT,
      search: options?.search || undefined,
      role: options?.role || undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    all.push(...result.items);
    totalPages = Math.max(1, result.pagination.totalPages || 1);
    page += 1;
  } while (page <= totalPages && page <= MAX_PAGES);

  return all;
}

function displayOrDash(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export function WalletCategoryLedgerView({
  scope,
  breadcrumb,
}: WalletCategoryLedgerViewProps) {
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type");
  const type: WalletCategoryLedgerType | null = isWalletCategoryLedgerType(
    rawType
  )
    ? rawType
    : null;

  // Super Admin hold / freeze ledger uses GET /wallet/hold/ledger
  if (scope === "super_admin" && (type === "hold" || type === "frozen")) {
    return (
      <WalletHoldFreezeLedgerView
        kind={type === "frozen" ? "frozen" : "hold"}
        breadcrumb={breadcrumb}
      />
    );
  }

  return (
    <WalletCategoryBalanceLedgerView
      scope={scope}
      breadcrumb={breadcrumb}
      type={type}
    />
  );
}

function WalletCategoryBalanceLedgerView({
  scope,
  breadcrumb,
  type,
}: WalletCategoryLedgerViewProps & {
  type: WalletCategoryLedgerType | null;
}) {
  const router = useRouter();

  const backHref =
    scope === "super_admin"
      ? ROUTES.superAdminWalletManagement
      : ROUTES.adminWalletManagement;

  const [rows, setRows] = useState<WalletUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<WalletUserRole | "">("");
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      350
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedSearch, type, roleFilter]);

  const load = useCallback(async () => {
    if (!type) return;
    setLoading(true);
    try {
      const users = await fetchAllWalletUsers({
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
      });
      const filtered = users
        .filter((user) => matchesCategory(user, type))
        .filter((user) => (roleFilter ? user.role === roleFilter : true))
        .sort(
          (a, b) => amountForCategory(b, type) - amountForCategory(a, type)
        );
      setRows(filtered);
    } catch (error) {
      setRows([]);
      toast.error(
        error instanceof Error ? error.message : "Failed to load ledger"
      );
    } finally {
      setLoading(false);
    }
  }, [type, debouncedSearch, roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const meta = type ? WALLET_CATEGORY_LEDGER_META[type] : null;
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = useMemo(
    () =>
      rows.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE),
    [rows, pageIndex]
  );

  const totalAmount = useMemo(
    () =>
      type
        ? rows.reduce((sum, user) => sum + amountForCategory(user, type), 0)
        : 0,
    [rows, type]
  );

  const columns = useMemo<ColumnDef<WalletUser, unknown>[]>(() => {
    if (!type) return [];

    if (type === "users") {
      return [
        {
          id: "sr",
          header: "Sr No.",
          enableSorting: false,
          size: 70,
          cell: ({ row }) => (
            <span className="tabular-nums text-muted">
              {pageIndex * PAGE_SIZE + row.index + 1}
            </span>
          ),
        },
        {
          accessorKey: "name",
          header: "Name",
          enableSorting: false,
          cell: ({ row }) => (
            <span className="font-semibold text-foreground">
              {displayOrDash(row.original.name)}
            </span>
          ),
        },
        {
          accessorKey: "email",
          header: "Email",
          enableSorting: false,
          cell: ({ row }) => (
            <span className="block max-w-[220px] truncate" title={row.original.email || ""}>
              {displayOrDash(row.original.email)}
            </span>
          ),
        },
        {
          id: "phone",
          header: "Phone",
          enableSorting: false,
          cell: ({ row }) => (
            <span className="tabular-nums">
              {displayOrDash(row.original.mobile)}
            </span>
          ),
        },
        {
          id: "outletId",
          header: "Outlet ID",
          enableSorting: false,
          cell: ({ row }) => (
            <span className="font-mono text-xs font-semibold">
              {displayOrDash(row.original.outletId)}
            </span>
          ),
        },
        {
          id: "panNumber",
          header: "PAN Number",
          enableSorting: false,
          cell: ({ row }) => (
            <span className="font-mono text-xs uppercase tracking-wide">
              {displayOrDash(row.original.panNumber)}
            </span>
          ),
        },
        {
          id: "aadhaarNumber",
          header: "Aadhaar Number",
          enableSorting: false,
          cell: ({ row }) => (
            <span className="font-mono text-xs tabular-nums">
              {displayOrDash(row.original.aadhaarNumber)}
            </span>
          ),
        },
        {
          accessorKey: "role",
          header: "Role",
          enableSorting: false,
          cell: ({ row }) => <WalletRoleBadge role={row.original.role} />,
        },
      ];
    }

    return [
      {
        id: "sr",
        header: "Sr No.",
        enableSorting: false,
        size: 70,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted">
            {pageIndex * PAGE_SIZE + row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "userCode",
        header: "User Code",
        enableSorting: false,
        cell: ({ row }) => row.original.userCode || "—",
      },
      {
        accessorKey: "name",
        header: "Name",
        enableSorting: false,
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
        enableSorting: false,
        cell: ({ row }) => <WalletRoleBadge role={row.original.role} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => (
          <WalletStatusBadge
            status={row.original.walletStatus || row.original.status}
          />
        ),
      },
      {
        id: "focusAmount",
        header: WALLET_CATEGORY_LEDGER_META[type].amountLabel,
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-block rounded-md px-2.5 py-1 font-bold tabular-nums",
              "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
            )}
          >
            {formatCurrency(amountForCategory(row.original, type))}
          </span>
        ),
      },
    ];
  }, [type, pageIndex]);

  const toExportRows = (items: WalletUser[]) =>
    items.map((user, index) => {
      if (type === "users") {
        return {
          "#": index + 1,
          Name: user.name || "",
          Email: user.email || "",
          Phone: user.mobile || "",
          "Outlet ID": user.outletId || "",
          "PAN Number": user.panNumber || "",
          "Aadhaar Number": user.aadhaarNumber || "",
          Role: user.role || "",
        };
      }
      return {
        "#": index + 1,
        "User Code": user.userCode || "",
        Name: user.name || "",
        Mobile: user.mobile || "",
        Role: user.role || "",
        Status: user.status || "",
        [WALLET_CATEGORY_LEDGER_META[type!].amountLabel]: amountForCategory(
          user,
          type!
        ),
      };
    });

  const handleExportExcel = async () => {
    if (!type || !rows.length) {
      toast.error("No records available to export");
      return;
    }
    setExporting(true);
    try {
      downloadReportExcel(
        toExportRows(rows),
        reportFilename(`wallet-${type}-ledger`),
        meta?.title || "Wallet Ledger"
      );
      toast.success(`Excel downloaded (${rows.length} records)`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Excel export failed"
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!type || !rows.length) {
      toast.error("No records available to export");
      return;
    }
    setExporting(true);
    try {
      const exportRows = toExportRows(rows);
      downloadReportPdf({
        title: meta?.title || "Wallet Ledger",
        subtitle: meta?.subtitle,
        filename: reportFilename(`wallet-${type}-ledger`),
        columns: Object.keys(exportRows[0] || {}).map((key) => ({
          key,
          label: key,
        })),
        rows: exportRows,
      });
      toast.success("PDF print dialog opened");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "PDF export failed"
      );
    } finally {
      setExporting(false);
    }
  };

  if (!type || !meta) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb={breadcrumb}
          title="Wallet Ledger"
          subtitle="Invalid ledger type. Go back to Wallet Management."
          action={
            <Button variant="outline" onClick={() => router.push(backHref)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={breadcrumb}
        title={meta.title}
        subtitle={
          type === "users"
            ? "User details with outlet, PAN and Aadhaar. Filter by role."
            : meta.subtitle
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.push(backHref)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Entries
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {rows.length.toLocaleString("en-IN")}
          </p>
        </div>
        {type !== "users" ? (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {meta.amountLabel} Total
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Role Filter
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {roleFilter
                ? WALLET_ROLE_OPTIONS.find((o) => o.value === roleFilter)
                    ?.label || roleFilter
                : "All"}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
          />
          <Select
            label="Role"
            options={[...WALLET_ROLE_OPTIONS]}
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as WalletUserRole | "")
            }
          />
        </div>
        <ReportExportBar
          loading={exporting || loading}
          onExportExcel={() => void handleExportExcel()}
          onExportPdf={() => void handleExportPdf()}
        />
      </div>

      <DataTable
        columns={columns}
        data={pageRows}
        isLoading={loading}
        hideSearch
        manualPagination
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        totalRows={rows.length}
        pageSize={PAGE_SIZE}
        minTableWidth={type === "users" ? 1200 : 1100}
        tone="report"
        stickyHeader
      />
    </div>
  );
}
