"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import { ReportExportBar } from "@/components/tables/ReportExportBar";
import { BankLogoName } from "@/components/common/BankLogoName";
import { cn, formatCurrency } from "@/lib/utils";
import {
  downloadReportExcel,
  downloadReportPdf,
  reportFilename,
} from "@/lib/reportExport";
import { fetchServiceStatement } from "@/services/serviceStatementApi";
import { listAllRetailers } from "@/services/superAdminApi";
import {
  AepsTxnFilter,
  StatementRow,
  StatementServiceTab,
} from "@/types/serviceStatement";

const PAGE_SIZE = 20;

const SERVICE_TABS: { key: StatementServiceTab; label: string }[] = [
  { key: "DMT3", label: "DMT3" },
  { key: "DMT", label: "DMT" },
  { key: "UPI", label: "UPI ATM" },
  { key: "AEPS", label: "AEPS" },
];

const AEPS_SUB_TABS: { key: AepsTxnFilter; label: string }[] = [
  { key: "CASH_WITHDRAWAL", label: "Cash Withdrawal" },
  { key: "CASH_DEPOSIT", label: "Cash Deposit" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "SUCCESS", label: "Success" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REVERSED", label: "Reversed" },
  { value: "REFUNDED", label: "Refunded" },
];

function statusVariant(
  status?: string
): "success" | "pending" | "rejected" | "default" {
  const value = (status || "").toUpperCase();
  if (value === "SUCCESS") return "success";
  if (value === "PENDING" || value === "PROCESSING") return "pending";
  if (value === "FAILED" || value === "REVERSED") return "rejected";
  if (value === "REFUNDED") return "pending";
  return "default";
}

function StatusPill({ status }: { status?: string }) {
  const value = String(status || "—").toUpperCase();
  return (
    <Badge
      variant={statusVariant(value)}
      className="min-w-[5.5rem] justify-center px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
    >
      {value}
    </Badge>
  );
}

function money(value?: number | null, tone?: "credit" | "debit") {
  if (value == null) return <span className="text-muted">—</span>;
  if (!value) return <span className="tabular-nums text-muted">₹0.00</span>;
  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        tone === "credit" && "text-emerald-600",
        tone === "debit" && "text-rose-600"
      )}
    >
      {formatCurrency(value)}
    </span>
  );
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied");
  } catch {
    toast.error("Copy failed");
  }
}

function maskAccount(value?: string | null) {
  if (!value) return "—";
  const digits = value.replace(/\s/g, "");
  // Already masked from API (e.g. XXXXXXXXXXX4142)
  if (/x/i.test(digits)) return digits;
  if (digits.length <= 4) return digits;
  return `XXXXXXXX${digits.slice(-4)}`;
}

export function SuperAdminServiceStatementView() {
  const [service, setService] = useState<StatementServiceTab>("DMT3");
  const [aepsType, setAepsType] = useState<AepsTxnFilter>("CASH_WITHDRAWAL");
  const [retailers, setRetailers] = useState<
    { value: string; label: string }[]
  >([{ value: "", label: "All retailers" }]);
  const [retailerId, setRetailerId] = useState("");
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listAllRetailers();
        if (cancelled) return;
        setRetailers([
          { value: "", label: "All retailers" },
          ...list.map((r) => ({
            value: r.id,
            label: [
              r.name ||
                [r.firstName, r.lastName].filter(Boolean).join(" ") ||
                "Retailer",
              r.userCode,
            ]
              .filter(Boolean)
              .join(" · "),
          })),
        ]);
      } catch {
        // keep All retailers only
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchServiceStatement({
        page: pageIndex + 1,
        limit: PAGE_SIZE,
        service,
        retailerId: retailerId || undefined,
        status: status || undefined,
        search: debouncedSearch || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortOrder: "desc",
        transactionType:
          service === "AEPS" && aepsType ? aepsType : undefined,
      });
      setRows(result.items);
      setTotal(result.pagination.total);
      setPageCount(Math.max(1, result.pagination.totalPages));
    } catch (error) {
      setRows([]);
      toast.error(
        error instanceof Error ? error.message : "Failed to load statement"
      );
    } finally {
      setLoading(false);
    }
  }, [
    pageIndex,
    service,
    aepsType,
    retailerId,
    status,
    debouncedSearch,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPageIndex(0);
  }, [service, aepsType, retailerId, status, debouncedSearch, fromDate, toDate]);

  const columns = useMemo<ColumnDef<StatementRow, unknown>[]>(() => {
    const baseStart: ColumnDef<StatementRow, unknown>[] = [
      {
        id: "dateTime",
        header: "Date & Time",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums">
            {row.original.dateTime || "—"}
          </span>
        ),
      },
      {
        id: "ledgerNo",
        header: "Txn ID",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex max-w-[200px] items-center gap-1">
            <span
              className="truncate font-mono text-xs font-medium text-primary"
              title={row.original.ledgerNo}
            >
              {row.original.ledgerNo}
            </span>
            <button
              type="button"
              className="shrink-0 rounded p-0.5 text-muted hover:bg-muted hover:text-foreground"
              onClick={() => void copyText(row.original.ledgerNo)}
              aria-label="Copy txn id"
            >
              <Copy className="size-3.5" />
            </button>
          </div>
        ),
      },
      {
        id: "service",
        header: "Service",
        enableSorting: false,
        cell: ({ row }) => {
          const s = String(row.original.service || "").toUpperCase();
          if (s.includes("DMT3")) return "DMT3";
          if (s.includes("AEPS")) return "AEPS";
          if (s.includes("DMT")) return "DMT";
          if (s.includes("UPI")) return "UPI ATM";
          return row.original.service || "—";
        },
      },
    ];

    if (service === "AEPS") {
      return [
        ...baseStart,
        {
          id: "description",
          header: "Description",
          enableSorting: false,
          cell: ({ row }) => (
            <span
              className="block max-w-[200px] truncate"
              title={row.original.description || ""}
            >
              {row.original.description || "—"}
            </span>
          ),
        },
        {
          id: "bank",
          header: "Bank",
          enableSorting: false,
          cell: ({ row }) => {
            const name = row.original.bankName;
            if (!name) return "—";
            const initial = name.trim().charAt(0).toUpperCase() || "B";
            return (
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {initial}
                </span>
                <span className="truncate" title={name}>
                  {name}
                </span>
              </div>
            );
          },
        },
        {
          id: "account",
          header: "Account",
          enableSorting: false,
          cell: ({ row }) => (
            <span className="font-mono text-xs">
              {maskAccount(row.original.accountNumber || row.original.aadhaarMasked)}
            </span>
          ),
        },
        {
          id: "mobile",
          header: "Mobile",
          enableSorting: false,
          cell: ({ row }) => row.original.customerMobile || "—",
        },
        {
          id: "retailer",
          header: "Retailer",
          enableSorting: false,
          cell: ({ row }) => {
            const r = row.original.retailer;
            if (!r) return "—";
            return (
              <div className="min-w-0">
                <p className="truncate font-medium">{r.name}</p>
                <p className="truncate text-xs text-muted">{r.userCode || ""}</p>
              </div>
            );
          },
        },
        {
          id: "txnKind",
          header: "Type",
          enableSorting: false,
          meta: { align: "center" as const },
          cell: ({ row }) => {
            const isCredit =
              row.original.credit > 0 ||
              String(row.original.serviceType || "").includes("DEPOSIT");
            return (
              <Badge variant={isCredit ? "success" : "rejected"}>
                {isCredit ? "Credit" : "Debit"}
              </Badge>
            );
          },
        },
        {
          id: "status",
          header: "Status",
          enableSorting: false,
          meta: { align: "center" as const },
          cell: ({ row }) => (
            <Badge variant={statusVariant(row.original.status)}>
              {row.original.status === "SUCCESS" ? "Success" : row.original.status}
            </Badge>
          ),
        },
        {
          id: "remark",
          header: "Remark",
          enableSorting: false,
          cell: ({ row }) => {
            const msg = row.original.message || row.original.description || "—";
            const failed = ["FAILED", "REVERSED"].includes(row.original.status);
            return (
              <span
                className={cn(
                  "block max-w-[180px] truncate text-sm",
                  failed ? "text-rose-600" : "text-emerald-700"
                )}
                title={msg}
              >
                {msg}
              </span>
            );
          },
        },
        {
          id: "amount",
          header: "Amount",
          enableSorting: false,
          meta: { align: "right" as const },
          cell: ({ row }) => money(row.original.txnAmount),
        },
        {
          id: "charge",
          header: "Charge",
          enableSorting: false,
          meta: { align: "right" as const },
          cell: ({ row }) => money(row.original.charge),
        },
        {
          id: "closing",
          header: "Balance",
          enableSorting: false,
          meta: { align: "right" as const },
          cell: ({ row }) =>
            row.original.closingBalance != null ? (
              <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {formatCurrency(row.original.closingBalance)}
              </span>
            ) : (
              "—"
            ),
        },
      ];
    }

    if (service === "DMT3") {
      return [
        {
          id: "dateTime",
          header: "Date & Time",
          enableSorting: false,
          cell: ({ row }) => (
            <span className="whitespace-nowrap text-sm tabular-nums">
              {row.original.dateTime || "—"}
            </span>
          ),
        },
        {
          id: "ledgerNo",
          header: "Txn ID",
          enableSorting: false,
          cell: ({ row }) => (
            <div className="flex max-w-[200px] items-center gap-1">
              <span
                className="truncate font-mono text-xs font-medium text-primary"
                title={row.original.ledgerNo}
              >
                {row.original.ledgerNo}
              </span>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted hover:bg-muted hover:text-foreground"
                onClick={() => void copyText(row.original.ledgerNo)}
                aria-label="Copy txn id"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          ),
        },
        {
          id: "status",
          header: "Status",
          enableSorting: false,
          meta: { align: "center" as const },
          cell: ({ row }) => <StatusPill status={row.original.status} />,
        },
        {
          id: "mode",
          header: "Mode",
          enableSorting: false,
          cell: ({ row }) => (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">
              {row.original.transferMode || "—"}
            </span>
          ),
        },
        {
          id: "customer",
          header: "Remitter",
          enableSorting: false,
          cell: ({ row }) => (
            <div className="min-w-0">
              <p className="truncate font-medium">
                {row.original.customerName || "—"}
              </p>
              <p className="truncate text-xs text-muted">
                {row.original.customerMobile || ""}
              </p>
            </div>
          ),
        },
        {
          id: "bank",
          header: "Beneficiary",
          enableSorting: false,
          cell: ({ row }) => {
            const name = row.original.bankName;
            const account = maskAccount(row.original.accountNumber);
            if (!name && account === "—") return "—";
            return (
              <div className="flex min-w-0 items-center gap-2.5">
                <BankLogoName
                  bankName={name}
                  ifscCode={row.original.ifscCode}
                  logoOnly
                  logoClassName="h-9 w-9"
                />
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium"
                    title={row.original.beneficiaryName || undefined}
                  >
                    {row.original.beneficiaryName || "Beneficiary"}
                  </p>
                  <p className="truncate font-mono text-xs text-muted">
                    {account}
                  </p>
                </div>
              </div>
            );
          },
        },
        {
          id: "rrn",
          header: "UTR / RRN",
          enableSorting: false,
          cell: ({ row }) => (
            <span className="font-mono text-xs">{row.original.rrn || "—"}</span>
          ),
        },
        {
          id: "amount",
          header: "Amount",
          enableSorting: false,
          meta: { align: "right" as const },
          cell: ({ row }) => money(row.original.txnAmount, "debit"),
        },
        {
          id: "charge",
          header: "Charge",
          enableSorting: false,
          meta: { align: "right" as const },
          cell: ({ row }) => money(row.original.charge),
        },
        {
          id: "commission",
          header: "Comm.",
          enableSorting: false,
          meta: { align: "right" as const },
          cell: ({ row }) => money(row.original.commission, "credit"),
        },
        {
          id: "opening",
          header: "Opening",
          enableSorting: false,
          meta: { align: "right" as const },
          cell: ({ row }) =>
            row.original.openingBalance != null
              ? money(row.original.openingBalance)
              : "—",
        },
        {
          id: "closing",
          header: "Updated Balance",
          enableSorting: false,
          meta: { align: "right" as const },
          cell: ({ row }) =>
            row.original.closingBalance != null ? (
              <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {formatCurrency(row.original.closingBalance)}
              </span>
            ) : (
              "—"
            ),
        },
      ];
    }

    return [
      ...baseStart,
      {
        id: "description",
        header: "Description",
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className="block max-w-[180px] truncate"
            title={row.original.description || ""}
          >
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        id: "retailer",
        header: "Retailer",
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original.retailer;
          if (!r) return "—";
          return (
            <div className="min-w-0">
              <p className="truncate font-medium">{r.name}</p>
              <p className="truncate text-xs text-muted">{r.userCode || ""}</p>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        meta: { align: "center" as const },
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => money(row.original.txnAmount),
      },
      {
        id: "charge",
        header: "Charge",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => money(row.original.charge),
      },
      {
        id: "commission",
        header: "Comm.",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => money(row.original.commission),
      },
      {
        id: "credit",
        header: "Credit",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => money(row.original.credit, "credit"),
      },
      {
        id: "debit",
        header: "Debit",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => money(row.original.debit, "debit"),
      },
      {
        id: "closing",
        header: "Closing",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) =>
          row.original.closingBalance != null
            ? money(row.original.closingBalance)
            : "—",
      },
    ];
  }, [service]);

  const statementQueryBase = useMemo(
    () => ({
      service,
      retailerId: retailerId || undefined,
      status: status || undefined,
      search: debouncedSearch || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sortOrder: "desc" as const,
      transactionType:
        service === "AEPS" && aepsType ? aepsType : undefined,
    }),
    [
      service,
      aepsType,
      retailerId,
      status,
      debouncedSearch,
      fromDate,
      toDate,
    ]
  );

  const dmt3Summary = useMemo(() => {
    if (service !== "DMT3") return null;
    let success = 0;
    let failed = 0;
    let refunded = 0;
    let amountSum = 0;
    for (const row of rows) {
      const s = String(row.status || "").toUpperCase();
      if (s === "SUCCESS") success += 1;
      else if (s === "FAILED") failed += 1;
      else if (s === "REFUNDED") refunded += 1;
      amountSum += Number(row.txnAmount || 0);
    }
    const latestClosing = rows.find((r) => r.closingBalance != null)?.closingBalance;
    return { success, failed, refunded, amountSum, latestClosing };
  }, [service, rows]);

  const toStatementExportRows = (items: StatementRow[]) =>
    items.map((row, index) => ({
      "#": index + 1,
      "Date & Time": row.dateTime || row.createdAt || "",
      "Txn ID": row.ledgerNo || "",
      Reference: row.reference || "",
      Service: row.service || "",
      Status: row.status || "",
      Remitter: row.customerName || "",
      Beneficiary: row.beneficiaryName || "",
      Bank: row.bankName || "",
      Account: row.accountNumber || "",
      "UTR / RRN": row.rrn || "",
      Amount: row.txnAmount ?? row.amount ?? 0,
      Charge: row.charge ?? 0,
      Commission: row.commission ?? 0,
      Opening: row.openingBalance ?? "",
      "Updated Balance": row.closingBalance ?? "",
      Description: row.description || row.message || "",
    }));

  const fetchAllStatementRows = async () => {
    const first = await fetchServiceStatement({
      ...statementQueryBase,
      page: 1,
      limit: 100,
    });
    const all = [...first.items];
    for (let page = 2; page <= first.pagination.totalPages; page += 1) {
      const next = await fetchServiceStatement({
        ...statementQueryBase,
        page,
        limit: first.pagination.limit || 100,
      });
      all.push(...next.items);
    }
    return all;
  };

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const items = await fetchAllStatementRows();
      if (!items.length) {
        toast.error("No records available to export");
        return;
      }
      downloadReportExcel(
        toStatementExportRows(items),
        reportFilename(`service-statement-${service.toLowerCase()}`),
        "Service Statement"
      );
      toast.success(`Excel downloaded (${items.length} records)`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export Excel"
      );
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportLoading(true);
      const items = await fetchAllStatementRows();
      if (!items.length) {
        toast.error("No records available to export");
        return;
      }
      const exportRows = toStatementExportRows(items);
      downloadReportPdf({
        title: `${service === "UPI" ? "UPI ATM" : service} Statement`,
        subtitle:
          service === "AEPS" && aepsType
            ? aepsType === "CASH_WITHDRAWAL"
              ? "Cash Withdrawal"
              : "Cash Deposit"
            : service === "DMT3"
              ? "Finzeng DMT3 payout transactions"
              : "Service transactions report",
        filename: reportFilename(`service-statement-${service.toLowerCase()}`),
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
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Super Admin"
        title="Service Statements"
        subtitle="Live DMT3 / DMT / UPI ATM / AEPS transaction reports with balances and status."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {service === "DMT3" && dmt3Summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Total Transactions
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {total.toLocaleString("en-IN")}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Page {pageIndex + 1} of {pageCount}
            </p>
          </Card>
          <Card className="border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              This Page Status
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {dmt3Summary.success} Success
              </span>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                {dmt3Summary.failed} Failed
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {dmt3Summary.refunded} Refunded
              </span>
            </div>
          </Card>
          <Card className="border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Page Amount
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {formatCurrency(dmt3Summary.amountSum)}
            </p>
            <p className="mt-0.5 text-xs text-muted">{rows.length} rows on this page</p>
          </Card>
          <Card className="border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Latest Updated Balance
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
              {dmt3Summary.latestClosing != null
                ? formatCurrency(dmt3Summary.latestClosing)
                : "—"}
            </p>
            <p className="mt-0.5 text-xs text-muted">From newest txn on page</p>
          </Card>
        </div>
      ) : null}

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="md:col-span-2">
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Txn ID, remitter, UTR, reference..."
            />
          </div>
          <Input
            label="Start Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          {service === "DMT3" ? (
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_OPTIONS}
            />
          ) : (
            <Select
              label="Retailer"
              value={retailerId}
              onChange={(e) => setRetailerId(e.target.value)}
              options={retailers}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {SERVICE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setService(tab.key);
                if (tab.key === "AEPS") setAepsType("CASH_WITHDRAWAL");
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                service === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {service === "AEPS" ? (
          <div className="flex flex-wrap gap-2">
            {AEPS_SUB_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setAepsType(tab.key)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                  aepsType === tab.key
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-emerald-600/40 bg-card text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {service !== "DMT3" ? (
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_OPTIONS}
              className="max-w-[180px]"
            />
          ) : null}
          <p className={cn("text-sm text-muted", service !== "DMT3" && "pt-6")}>
            <span className="font-semibold text-foreground">
              {service === "UPI" ? "UPI ATM" : service}
              {service === "AEPS" && aepsType
                ? ` · ${aepsType === "CASH_WITHDRAWAL" ? "Cash Withdrawal" : "Cash Deposit"}`
                : ""}
            </span>{" "}
            · <span className="font-bold text-foreground">{total}</span> total
            entries
          </p>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {service === "DMT3"
                ? "DMT3 Payout Transactions"
                : `${service === "UPI" ? "UPI ATM" : service} Statement`}
            </p>
            <p className="text-xs text-muted">
              {total.toLocaleString("en-IN")} records · showing{" "}
              {rows.length} on this page
            </p>
          </div>
          <ReportExportBar
            loading={exportLoading || loading}
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
          minTableWidth={
            service === "AEPS" ? 1500 : service === "DMT3" ? 1380 : 1200
          }
          tone="report"
          stickyHeader
        />
      </Card>
    </div>
  );
}
