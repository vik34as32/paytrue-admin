"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import { ReportExportBar } from "@/components/tables/ReportExportBar";
import { cn, formatCurrency } from "@/lib/utils";
import {
  downloadReportExcel,
  downloadReportPdf,
  reportFilename,
} from "@/lib/reportExport";
import {
  fetchRetailerWalletLedger,
  fetchWalletLedgerRetailers,
} from "@/services/walletLedgerApi";
import {
  WalletLedgerRetailer,
  WalletLedgerRetailerOption,
  WalletLedgerRow,
  WalletLedgerScope,
} from "@/types/walletLedger";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "SUCCESS", label: "Success" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "FAILED", label: "Failed" },
  { value: "REVERSED", label: "Reversed" },
  { value: "REFUNDED", label: "Refunded" },
];

interface RetailerWalletLedgerViewProps {
  scope: WalletLedgerScope;
  breadcrumb: string;
}

function statusVariant(
  status?: string
): "success" | "pending" | "rejected" | "default" {
  const value = (status || "").toUpperCase();
  if (value === "SUCCESS" || value === "REFUNDED") return "success";
  if (value === "PENDING" || value === "PROCESSING") return "pending";
  if (value === "FAILED" || value === "REVERSED") return "rejected";
  return "default";
}

function moneyCell(value: number, tone: "muted" | "credit" | "debit" | "focus" = "muted") {
  if (!value) {
    return <span className="tabular-nums text-muted">0.00</span>;
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

export function RetailerWalletLedgerView({
  scope,
  breadcrumb,
}: RetailerWalletLedgerViewProps) {
  const [retailers, setRetailers] = useState<WalletLedgerRetailerOption[]>([]);
  const [retailerId, setRetailerId] = useState("");
  const [retailer, setRetailer] = useState<WalletLedgerRetailer | null>(null);
  const [rows, setRows] = useState<WalletLedgerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchWalletLedgerRetailers(scope);
        if (cancelled) return;
        setRetailers(list);
        setRetailerId((current) => current || list[0]?.id || "");
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load retailers"
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const loadLedger = useCallback(async () => {
    if (!retailerId) {
      setRows([]);
      setRetailer(null);
      setTotal(0);
      setPageCount(1);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchRetailerWalletLedger(scope, retailerId, {
        page: pageIndex + 1,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setRows(result.items);
      setRetailer(result.retailer);
      setTotal(result.pagination.total);
      setPageCount(Math.max(1, result.pagination.totalPages));
    } catch (error) {
      setRows([]);
      toast.error(
        error instanceof Error ? error.message : "Failed to load wallet ledger"
      );
    } finally {
      setLoading(false);
    }
  }, [
    scope,
    retailerId,
    pageIndex,
    debouncedSearch,
    status,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  useEffect(() => {
    setPageIndex(0);
  }, [retailerId, debouncedSearch, status, startDate, endDate]);

  const retailerOptions = useMemo(
    () => [
      { value: "", label: "Select retailer" },
      ...retailers.map((r) => ({ value: r.id, label: r.label })),
    ],
    [retailers]
  );

  const columns = useMemo<ColumnDef<WalletLedgerRow, unknown>[]>(
    () => [
      {
        id: "dateTime",
        header: "Date & Time",
        enableSorting: false,
        size: 160,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums">
            {row.original.dateTime || "—"}
          </span>
        ),
      },
      {
        id: "ledgerNo",
        header: "Ledger No",
        enableSorting: false,
        size: 180,
        cell: ({ row }) => (
          <span className="block max-w-[180px] truncate font-mono text-xs" title={row.original.ledgerNo}>
            {row.original.ledgerNo || "—"}
          </span>
        ),
      },
      {
        id: "service",
        header: "Service",
        enableSorting: false,
        cell: ({ row }) => row.original.service || "—",
      },
      {
        id: "description",
        header: "Description",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="block max-w-[180px] truncate" title={row.original.description || ""}>
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        meta: { align: "center" as const },
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {row.original.status === "SUCCESS" ? (
              <CheckCircle2 className="size-3.5" />
            ) : null}
            {row.original.status || "—"}
          </Badge>
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
        header: "Txn Amount",
        enableSorting: false,
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
        header: "Comm.",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.commission),
      },
      {
        id: "tds",
        header: "TDS",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => moneyCell(row.original.tds),
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
        header: "Closing Balance",
        enableSorting: false,
        size: scope === "super_admin" ? 170 : 150,
        meta: { align: "right" as const },
        cell: ({ row }) =>
          moneyCell(
            row.original.closingBalance,
            scope === "super_admin" ? "focus" : "muted"
          ),
      },
    ],
    [scope]
  );

  const toLedgerExportRows = (items: WalletLedgerRow[]) =>
    items.map((row, index) => ({
      "#": index + 1,
      "Date & Time": row.dateTime || row.createdAt || "",
      "Ledger No": row.ledgerNo || "",
      Reference: row.reference || "",
      Service: row.service || "",
      Status: row.status || "",
      Description: row.description || "",
      Opening: row.openingBalance ?? 0,
      Amount: row.txnAmount ?? row.amount ?? 0,
      Charge: row.charge ?? 0,
      Commission: row.commission ?? 0,
      TDS: row.tds ?? 0,
      Credit: row.credit ?? 0,
      Debit: row.debit ?? 0,
      Closing: row.closingBalance ?? 0,
    }));

  const fetchAllLedgerRows = async () => {
    const params = {
      search: debouncedSearch || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
    };
    const first = await fetchRetailerWalletLedger(scope, retailerId, {
      ...params,
      page: 1,
      limit: 100,
    });
    const all = [...first.items];
    for (let page = 2; page <= first.pagination.totalPages; page += 1) {
      const next = await fetchRetailerWalletLedger(scope, retailerId, {
        ...params,
        page,
        limit: first.pagination.limit || 100,
      });
      all.push(...next.items);
    }
    return all;
  };

  const handleExportExcel = async () => {
    if (!retailerId) {
      toast.error("Select a retailer first");
      return;
    }
    setExporting(true);
    try {
      const items = await fetchAllLedgerRows();
      if (!items.length) {
        toast.error("No records available to export");
        return;
      }
      downloadReportExcel(
        toLedgerExportRows(items),
        reportFilename("wallet-ledger"),
        "Wallet Ledger"
      );
      toast.success(`Excel downloaded (${items.length} records)`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export ledger"
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!retailerId) {
      toast.error("Select a retailer first");
      return;
    }
    setExporting(true);
    try {
      const items = await fetchAllLedgerRows();
      if (!items.length) {
        toast.error("No records available to export");
        return;
      }
      const exportRows = toLedgerExportRows(items);
      downloadReportPdf({
        title: "Retailer Wallet Ledger",
        subtitle: retailer?.name
          ? `${retailer.name}${retailer.userCode ? ` · ${retailer.userCode}` : ""}`
          : "Wallet ledger report",
        filename: reportFilename("wallet-ledger"),
        columns: Object.keys(exportRows[0] || {}).map((key) => ({
          key,
          label: key,
        })),
        rows: exportRows,
      });
      toast.success("PDF print dialog opened");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export PDF"
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Retailer Wallet Ledger"
        subtitle="View a retailer's wallet ledger — same statement style as the retailer portal."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadLedger()}
            disabled={loading || !retailerId}
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Select
            label="Retailer"
            value={retailerId}
            onChange={(e) => setRetailerId(e.target.value)}
            options={retailerOptions}
          />
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ledger no, description..."
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
          <Input
            label="From"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {retailer ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-sm">
            <Wallet className="size-4 text-primary" />
            <span className="font-medium">{retailer.name}</span>
            {retailer.userCode ? (
              <span className="text-muted">· {retailer.userCode}</span>
            ) : null}
            <span className="text-muted">· Balance</span>
            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
              {formatCurrency(retailer.walletBalance || 0)}
            </span>
            <span className="text-muted">· {total} entries</span>
          </div>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <ReportExportBar
            loading={exporting || loading}
            onExportExcel={() => void handleExportExcel()}
            onExportPdf={() => void handleExportPdf()}
          />
        </div>
        <DataTable
          data={rows}
          columns={columns}
          isLoading={loading}
          hideSearch
          manualPagination
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          pageSize={PAGE_SIZE}
          totalRows={total}
          minTableWidth={1400}
          tone="report"
          stickyHeader
        />
      </Card>
    </div>
  );
}
