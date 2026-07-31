"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { DataTable } from "@/components/tables/DataTable";
import { ReportExportBar } from "@/components/tables/ReportExportBar";
import { WalletRoleBadge } from "@/components/wallet-management/WalletRoleBadge";
import { ROUTES } from "@/constants";
import {
  downloadReportExcel,
  downloadReportPdf,
  reportFilename,
} from "@/lib/reportExport";
import { cn, formatCurrency } from "@/lib/utils";
import {
  fetchWalletFreezeLedger,
  fetchWalletHoldLedger,
} from "@/services/walletHoldLedger.service";
import { WalletHoldLedgerRow } from "@/types/walletHoldLedger";
import { WalletUserRole } from "@/types/wallet";

const PAGE_SIZE = 20;

export type HoldFreezeLedgerKind = "hold" | "frozen";

interface WalletHoldFreezeLedgerViewProps {
  kind: HoldFreezeLedgerKind;
  breadcrumb?: string;
}

const META: Record<
  HoldFreezeLedgerKind,
  {
    title: string;
    subtitle: string;
    apiType?: "HOLD";
    slug: string;
  }
> = {
  hold: {
    title: "Hold Amount Ledger",
    subtitle: "Data from GET /wallet/hold/ledger (Super Admin).",
    apiType: "HOLD",
    slug: "hold-amount-ledger",
  },
  frozen: {
    title: "Frozen Amount Ledger",
    subtitle: "Data from GET /wallet/freeze/ledger (Super Admin).",
    slug: "frozen-amount-ledger",
  },
};

function moneyCell(value: number) {
  return (
    <span className="tabular-nums font-medium text-foreground">
      {formatCurrency(value || 0)}
    </span>
  );
}

function typeBadge(type: string) {
  const upper = (type || "").toUpperCase();
  const isFreeze = upper.includes("FREEZE");
  const isUnfreeze = upper === "UNFREEZE";
  const isHold = upper === "HOLD" || upper.includes("HOLD");
  const isRelease = upper === "RELEASE";
  return (
    <Badge
      variant={
        isRelease || isUnfreeze
          ? "success"
          : isFreeze
            ? "pending"
            : isHold
              ? "rejected"
              : "default"
      }
      className={cn(
        isFreeze &&
          !isUnfreeze &&
          "!bg-sky-100 !text-sky-800 dark:!bg-sky-900/40 dark:!text-sky-200",
        isHold &&
          "!bg-rose-100 !text-rose-800 dark:!bg-rose-900/40 dark:!text-rose-200"
      )}
    >
      {upper || "—"}
    </Badge>
  );
}

export function WalletHoldFreezeLedgerView({
  kind,
  breadcrumb = "Super Admin",
}: WalletHoldFreezeLedgerViewProps) {
  const router = useRouter();
  const meta = META[kind];
  const backHref = ROUTES.superAdminWalletManagement;

  const [rows, setRows] = useState<WalletHoldLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      350
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedSearch, kind]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = {
        page: pageIndex + 1,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
      };
      const result =
        kind === "frozen"
          ? await fetchWalletFreezeLedger(query)
          : await fetchWalletHoldLedger({
              ...query,
              type: meta.apiType,
            });
      setRows(result.items);
      setTotal(result.pagination.total);
      setPageCount(Math.max(1, result.pagination.totalPages));
    } catch (error) {
      setRows([]);
      setTotal(0);
      setPageCount(1);
      toast.error(
        error instanceof Error ? error.message : "Failed to load ledger"
      );
    } finally {
      setLoading(false);
    }
  }, [pageIndex, debouncedSearch, kind, meta.apiType]);

  useEffect(() => {
    void load();
  }, [load]);

  const isHoldLedger = kind === "hold";

  const columns = useMemo<ColumnDef<WalletHoldLedgerRow, unknown>[]>(
    () => [
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
          <div className="min-w-0">
            <p className="font-semibold text-foreground">
              {row.original.name || "—"}
            </p>
            <p className="font-mono text-xs text-muted">
              {row.original.userCode || "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.phone || "—"}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className="block max-w-[200px] truncate"
            title={row.original.email || ""}
          >
            {row.original.email || "—"}
          </span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        enableSorting: false,
        cell: ({ row }) => (
          <WalletRoleBadge role={row.original.role as WalletUserRole} />
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => typeBadge(row.original.type),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => (
          <span className="font-bold tabular-nums text-foreground">
            {formatCurrency(row.original.amount || 0)}
          </span>
        ),
      },
      ...(isHoldLedger
        ? ([
            {
              id: "openingHoldBalance",
              header: "Opening Hold",
              enableSorting: false,
              meta: { align: "right" as const },
              cell: ({ row }: { row: { original: WalletHoldLedgerRow } }) =>
                moneyCell(row.original.openingHoldBalance),
            },
            {
              id: "closingHoldBalance",
              header: "Closing Hold",
              enableSorting: false,
              meta: { align: "right" as const },
              cell: ({ row }: { row: { original: WalletHoldLedgerRow } }) =>
                moneyCell(row.original.closingHoldBalance),
            },
          ] as ColumnDef<WalletHoldLedgerRow, unknown>[])
        : ([
            {
              id: "openingFreezeBalance",
              header: "Opening Freeze",
              enableSorting: false,
              meta: { align: "right" as const },
              cell: ({ row }: { row: { original: WalletHoldLedgerRow } }) =>
                moneyCell(row.original.openingFreezeBalance),
            },
            {
              id: "closingFreezeBalance",
              header: "Closing Freeze",
              enableSorting: false,
              meta: { align: "right" as const },
              cell: ({ row }: { row: { original: WalletHoldLedgerRow } }) =>
                moneyCell(row.original.closingFreezeBalance),
            },
          ] as ColumnDef<WalletHoldLedgerRow, unknown>[])),
      {
        accessorKey: "openingAvailableBalance",
        header: "Opening Available",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.openingAvailableBalance),
      },
      {
        accessorKey: "closingAvailableBalance",
        header: "Closing Available",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.closingAvailableBalance),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className="block max-w-[180px] truncate"
            title={row.original.reason || ""}
          >
            {row.original.reason || "—"}
          </span>
        ),
      },
      {
        accessorKey: "performedByRole",
        header: "Performed By",
        enableSorting: false,
        cell: ({ row }) =>
          (row.original.performedByRole || "—").replace(/_/g, " "),
      },
      {
        id: "createdAt",
        header: "Date & Time",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums">
            {row.original.dateTime || row.original.createdAt || "—"}
          </span>
        ),
      },
    ],
    [pageIndex, isHoldLedger]
  );

  const toExportRows = (items: WalletHoldLedgerRow[]) =>
    items.map((row, index) => {
      const base = {
        "#": index + 1,
        Name: row.name || "",
        Phone: row.phone || "",
        Email: row.email || "",
        Role: row.role || "",
        "User Code": row.userCode || "",
        Type: row.type || "",
        Amount: row.amount ?? 0,
      };
      if (isHoldLedger) {
        return {
          ...base,
          "Opening Hold": row.openingHoldBalance ?? 0,
          "Closing Hold": row.closingHoldBalance ?? 0,
          "Opening Available": row.openingAvailableBalance ?? 0,
          "Closing Available": row.closingAvailableBalance ?? 0,
          Reason: row.reason || "",
          "Performed By": row.performedByRole || "",
          "Date & Time": row.dateTime || row.createdAt || "",
        };
      }
      return {
        ...base,
        "Opening Freeze": row.openingFreezeBalance ?? 0,
        "Closing Freeze": row.closingFreezeBalance ?? 0,
        "Opening Available": row.openingAvailableBalance ?? 0,
        "Closing Available": row.closingAvailableBalance ?? 0,
        Reason: row.reason || "",
        "Performed By": row.performedByRole || "",
        "Date & Time": row.dateTime || row.createdAt || "",
      };
    });

  const fetchAllForExport = async () => {
    const baseQuery = {
      search: debouncedSearch || undefined,
    };
    const fetchPage = (page: number, limit: number) =>
      kind === "frozen"
        ? fetchWalletFreezeLedger({ page, limit, ...baseQuery })
        : fetchWalletHoldLedger({
            page,
            limit,
            ...baseQuery,
            type: meta.apiType,
          });

    const first = await fetchPage(1, 100);
    const all = [...first.items];
    for (let page = 2; page <= first.pagination.totalPages; page += 1) {
      const next = await fetchPage(page, first.pagination.limit || 100);
      all.push(...next.items);
    }
    return all;
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const items = await fetchAllForExport();
      if (!items.length) {
        toast.error("No records available to export");
        return;
      }
      downloadReportExcel(
        toExportRows(items),
        reportFilename(meta.slug),
        meta.title
      );
      toast.success(`Excel downloaded (${items.length} records)`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Excel export failed"
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const items = await fetchAllForExport();
      if (!items.length) {
        toast.error("No records available to export");
        return;
      }
      const exportRows = toExportRows(items);
      downloadReportPdf({
        title: meta.title,
        subtitle: meta.subtitle,
        filename: reportFilename(meta.slug),
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

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={breadcrumb}
        title={meta.title}
        subtitle={meta.subtitle}
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
            {total.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Ledger Type
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {kind === "frozen" ? "FREEZE" : "HOLD"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, user code..."
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
        data={rows}
        isLoading={loading}
        hideSearch
        manualPagination
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        totalRows={total}
        pageSize={PAGE_SIZE}
        minTableWidth={1500}
        tone="report"
        stickyHeader
      />
    </div>
  );
}
