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
  if (value === "SUCCESS" || value === "REFUNDED") return "success";
  if (value === "PENDING" || value === "PROCESSING") return "pending";
  if (value === "FAILED" || value === "REVERSED") return "rejected";
  return "default";
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
  if (digits.length <= 4) return digits;
  return `XXXXXXXX${digits.slice(-4)}`;
}

export function SuperAdminServiceStatementView() {
  const [service, setService] = useState<StatementServiceTab>("AEPS");
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

  const toStatementExportRows = (items: StatementRow[]) =>
    items.map((row, index) => ({
      "#": index + 1,
      "Date & Time": row.dateTime || row.createdAt || "",
      "Txn ID": row.ledgerNo || "",
      Reference: row.reference || "",
      Service: row.service || "",
      Status: row.status || "",
      Retailer: row.retailer?.name || "",
      Amount: row.txnAmount ?? row.amount ?? 0,
      Charge: row.charge ?? 0,
      Commission: row.commission ?? 0,
      TDS: row.tds ?? 0,
      Credit: row.credit ?? 0,
      Debit: row.debit ?? 0,
      Closing: row.closingBalance ?? "",
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
        title="Reports"
        subtitle="DMT, UPI ATM aur AEPS statements — retailer portal jaisa view."
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

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="md:col-span-2">
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, reference, description, service..."
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
          <Select
            label="Retailer"
            value={retailerId}
            onChange={(e) => setRetailerId(e.target.value)}
            options={retailers}
          />
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
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
            className="max-w-[180px]"
          />
          <p className="pt-6 text-sm text-muted">
            <span className="font-semibold text-foreground">
              {service === "UPI" ? "UPI ATM" : service}
              {service === "AEPS" && aepsType
                ? ` · ${aepsType === "CASH_WITHDRAWAL" ? "Cash Withdrawal" : "Cash Deposit"}`
                : ""}
            </span>{" "}
            · {total} entries
          </p>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3 sm:px-5">
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
          minTableWidth={service === "AEPS" ? 1500 : 1200}
          tone="report"
          stickyHeader
        />
      </Card>
    </div>
  );
}
