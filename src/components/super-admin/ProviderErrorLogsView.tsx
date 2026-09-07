"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  Filter,
  RefreshCw,
  ScrollText,
  Search,
  ServerCrash,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import { Modal } from "@/components/modals/Modal";
import { cn, formatDate } from "@/lib/utils";
import {
  getProviderErrorLogById,
  listProviderErrorLogs,
} from "@/services/providerErrorLogApi";
import {
  ProviderErrorLogRecord,
  ProviderErrorProvider,
  ProviderErrorType,
} from "@/types/providerErrorLog";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const PROVIDER_OPTIONS: { value: "" | ProviderErrorProvider; label: string }[] =
  [
    { value: "", label: "All providers" },
    { value: "NIFI", label: "NIFI" },
    { value: "INSTANTPAY", label: "InstantPay" },
    { value: "FINZENG", label: "Finzeng" },
  ];

const ERROR_TYPE_OPTIONS: { value: "" | ProviderErrorType; label: string }[] = [
  { value: "", label: "All error types" },
  { value: "TIMEOUT", label: "Timeout" },
  { value: "NETWORK", label: "Network" },
  { value: "HTTP_ERROR", label: "HTTP Error" },
  { value: "PROVIDER_FAILURE", label: "Provider Failure" },
];

function providerTone(provider?: string) {
  const value = String(provider || "").toUpperCase();
  if (value === "NIFI") {
    return "bg-indigo-50 text-indigo-800 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300";
  }
  if (value === "INSTANTPAY") {
    return "bg-sky-50 text-sky-800 ring-sky-100 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (value === "FINZENG") {
    return "bg-violet-50 text-violet-800 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-300";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-muted dark:text-foreground";
}

function errorTypeMeta(errorType?: string) {
  const value = String(errorType || "").toUpperCase();
  if (value === "TIMEOUT") {
    return {
      label: "Timeout",
      className:
        "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-300",
      icon: Clock3,
    };
  }
  if (value === "NETWORK") {
    return {
      label: "Network",
      className:
        "bg-orange-50 text-orange-800 ring-orange-100 dark:bg-orange-950/30 dark:text-orange-300",
      icon: WifiOff,
    };
  }
  if (value === "HTTP_ERROR") {
    return {
      label: "HTTP Error",
      className:
        "bg-rose-50 text-rose-800 ring-rose-100 dark:bg-rose-950/30 dark:text-rose-300",
      icon: ServerCrash,
    };
  }
  if (value === "PROVIDER_FAILURE") {
    return {
      label: "Provider Failure",
      className:
        "bg-red-50 text-red-800 ring-red-100 dark:bg-red-950/30 dark:text-red-300",
      icon: ShieldAlert,
    };
  }
  return {
    label: value || "Unknown",
    className:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-muted dark:text-foreground",
    icon: AlertTriangle,
  };
}

function statusCodeTone(code?: number | null) {
  if (!code) return "text-slate-500";
  if (code >= 500) return "text-rose-700 dark:text-rose-400";
  if (code >= 400) return "text-amber-700 dark:text-amber-400";
  return "text-slate-700";
}

function prettyJson(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function copyValue(label: string, value?: string | null) {
  if (!value) {
    toast.error(`${label} not available`);
    return;
  }
  void navigator.clipboard.writeText(value).then(
    () => toast.success(`${label} copied`),
    () => toast.error(`Unable to copy ${label}`)
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  const text = prettyJson(value);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-border">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
          {title}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          onClick={() => copyValue(title, text === "—" ? "" : text)}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>
      <pre className="max-h-72 overflow-auto p-4 text-[12px] leading-relaxed text-emerald-200/90">
        {text}
      </pre>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 dark:border-border dark:bg-card">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 break-all text-sm font-medium text-slate-900 dark:text-foreground",
          mono && "font-mono text-xs"
        )}
        title={display !== "—" ? display : undefined}
      >
        {display}
      </p>
    </div>
  );
}

export function ProviderErrorLogsView() {
  const [rows, setRows] = useState<ProviderErrorLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [provider, setProvider] = useState<"" | ProviderErrorProvider>("");
  const [errorType, setErrorType] = useState<"" | ProviderErrorType>("");
  const [service, setService] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selected, setSelected] = useState<ProviderErrorLogRecord | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listProviderErrorLogs({
        page: pageIndex + 1,
        pageSize,
        provider,
        errorType,
        service,
        endpoint,
        transactionId,
        referenceId,
        statusCode: statusCode.trim() ? Number(statusCode) : "",
        dateFrom,
        dateTo,
      });
      setRows(result.data);
      setTotal(result.total);
    } catch (err) {
      setRows([]);
      setTotal(0);
      setError(
        err instanceof Error ? err.message : "Failed to load provider error logs"
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    pageIndex,
    pageSize,
    provider,
    errorType,
    service,
    endpoint,
    transactionId,
    referenceId,
    statusCode,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openDetail = async (row: ProviderErrorLogRecord) => {
    setSelected(row);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const full = await getProviderErrorLogById(row.id);
      setSelected(full);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load log details"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const resetFilters = () => {
    setProvider("");
    setErrorType("");
    setService("");
    setEndpoint("");
    setTransactionId("");
    setReferenceId("");
    setStatusCode("");
    setDateFrom("");
    setDateTo("");
    setPageIndex(0);
  };

  const pageStats = useMemo(() => {
    const byProvider: Record<string, number> = {};
    for (const row of rows) {
      const key = String(row.provider || "OTHER").toUpperCase();
      byProvider[key] = (byProvider[key] || 0) + 1;
    }
    return {
      total,
      pageCount: rows.length,
      nifi: byProvider.NIFI || 0,
      instantpay: byProvider.INSTANTPAY || 0,
      finzeng: byProvider.FINZENG || 0,
    };
  }, [rows, total]);

  const columns = useMemo<ColumnDef<ProviderErrorLogRecord, unknown>[]>(
    () => [
      {
        id: "createdAt",
        header: "When",
        cell: ({ row }) => (
          <div className="min-w-[140px]">
            <p className="text-[13px] font-semibold text-slate-900 dark:text-foreground">
              {formatDate(row.original.createdAt, "dd MMM yyyy")}
            </p>
            <p className="text-[11px] text-slate-500">
              {formatDate(row.original.createdAt, "HH:mm:ss")}
            </p>
          </div>
        ),
      },
      {
        id: "provider",
        header: "Provider",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1",
              providerTone(row.original.provider)
            )}
          >
            {row.original.provider || "—"}
          </span>
        ),
      },
      {
        id: "service",
        header: "Service",
        cell: ({ row }) => (
          <div className="min-w-[140px] max-w-[200px]">
            <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-foreground">
              {row.original.service || "—"}
            </p>
            <p
              className="truncate font-mono text-[11px] text-slate-500"
              title={row.original.endpoint || undefined}
            >
              {row.original.endpoint || "—"}
            </p>
          </div>
        ),
      },
      {
        id: "errorType",
        header: "Error Type",
        cell: ({ row }) => {
          const meta = errorTypeMeta(row.original.errorType);
          const Icon = meta.icon;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                meta.className
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
          );
        },
      },
      {
        id: "statusCode",
        header: "HTTP",
        cell: ({ row }) => (
          <span
            className={cn(
              "font-mono text-sm font-bold tabular-nums",
              statusCodeTone(row.original.statusCode)
            )}
          >
            {row.original.statusCode ?? "—"}
          </span>
        ),
      },
      {
        id: "refs",
        header: "References",
        cell: ({ row }) => (
          <div className="min-w-[160px] max-w-[220px] space-y-1 text-[11px]">
            <p className="truncate">
              <span className="font-semibold text-slate-400">Txn:</span>{" "}
              <span className="font-mono text-slate-700 dark:text-foreground">
                {row.original.transactionId || "—"}
              </span>
            </p>
            <p className="truncate">
              <span className="font-semibold text-slate-400">Ref:</span>{" "}
              <span className="font-mono text-slate-700 dark:text-foreground">
                {row.original.referenceId || "—"}
              </span>
            </p>
          </div>
        ),
      },
      {
        id: "message",
        header: "Message",
        cell: ({ row }) => {
          const message =
            row.original.message || row.original.errorMessage || "—";
          return (
            <p
              className="max-w-[280px] truncate text-[13px] text-slate-700 dark:text-foreground"
              title={message !== "—" ? message : undefined}
            >
              {message}
            </p>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        meta: { align: "center" as const },
        cell: ({ row }) => (
          <button
            type="button"
            aria-label="View log details"
            onClick={() => void openDetail(row.original)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-border dark:bg-card dark:text-foreground"
          >
            <Eye className="h-3.5 w-3.5" />
            Details
          </button>
        ),
      },
    ],
    []
  );

  const detail = selected;
  const detailErrorMeta = errorTypeMeta(detail?.errorType);
  const DetailErrorIcon = detailErrorMeta.icon;

  return (
    <div className="page-container space-y-5">
      <PageHeader
        breadcrumb="Dashboard / Operations / Logs"
        title="Provider Error Logs"
        subtitle="Failed NIFI, InstantPay & Finzeng API calls — client-ready audit trail (retained 7 days)"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadData()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-sm dark:border-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Operations transparency</p>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Only failed provider calls are stored. Successful responses are
                never logged. Use this view when sharing incident timelines with
                clients or internal support.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-400/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Failures only
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-100 ring-1 ring-amber-400/20">
              <Clock3 className="h-3.5 w-3.5" />
              Auto-expire 7 days
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total logs", value: pageStats.total, hint: "Matching filters" },
          { label: "NIFI (page)", value: pageStats.nifi, hint: "Current page" },
          {
            label: "InstantPay (page)",
            value: pageStats.instantpay,
            hint: "Current page",
          },
          {
            label: "Finzeng (page)",
            value: pageStats.finzeng,
            hint: "Current page",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-border dark:bg-card"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-foreground">
              {card.value}
            </p>
            <p className="text-[11px] text-slate-500">{card.hint}</p>
          </div>
        ))}
      </div>

      <Card className="space-y-4 border-slate-200 p-4 shadow-sm dark:border-border sm:p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-foreground">
          <Filter className="h-4 w-4 text-slate-500" />
          Filters
        </div>

        <div className="flex flex-wrap gap-2">
          {PROVIDER_OPTIONS.map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => {
                setProvider(opt.value);
                setPageIndex(0);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                provider === opt.value
                  ? "bg-slate-900 text-white dark:bg-primary"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-border dark:bg-card dark:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Error Type"
            value={errorType}
            options={ERROR_TYPE_OPTIONS}
            onChange={(e) => {
              setErrorType(e.target.value as "" | ProviderErrorType);
              setPageIndex(0);
            }}
          />
          <Input
            label="Service"
            placeholder="e.g. AEPS, DMT"
            value={service}
            onChange={(e) => setService(e.target.value)}
          />
          <Input
            label="Endpoint"
            placeholder="/api/..."
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          />
          <Input
            label="HTTP Status"
            placeholder="e.g. 500"
            value={statusCode}
            onChange={(e) => setStatusCode(e.target.value.replace(/\D/g, ""))}
          />
          <Input
            label="Transaction ID"
            placeholder="Txn / order id"
            icon={<Search className="h-4 w-4" />}
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
          />
          <Input
            label="Reference ID"
            placeholder="Provider reference"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
          />
          <Input
            label="From Date"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPageIndex(0);
            }}
          />
          <Input
            label="To Date"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPageIndex(0);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              setPageIndex(0);
              void loadData();
            }}
            disabled={isLoading}
          >
            <Search className="h-4 w-4" />
            Apply
          </Button>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </Card>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-accent-red/30 dark:bg-accent-red/10 dark:text-accent-red">
          {error}
        </div>
      ) : null}

      <DataTable
        data={rows}
        columns={columns}
        hideSearch
        isLoading={isLoading}
        stickyHeader
        minTableWidth={1100}
        manualPagination
        pageIndex={pageIndex}
        pageCount={Math.max(1, Math.ceil(total / pageSize))}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        totalRows={total}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
      />

      <Modal
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
        title="Provider Error Detail"
        subtitle="Shareable incident snapshot for support & client communication"
        size="2xl"
        headerVariant="brand"
        headerBadge="Error log"
        headerIcon={<ScrollText className="h-5 w-5" />}
      >
        {detailLoading && !detail ? (
          <div className="space-y-3 py-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-muted"
              />
            ))}
          </div>
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1",
                  providerTone(detail.provider)
                )}
              >
                {detail.provider || "Provider"}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                  detailErrorMeta.className
                )}
              >
                <DetailErrorIcon className="h-3.5 w-3.5" />
                {detailErrorMeta.label}
              </span>
              {detailLoading ? (
                <span className="text-xs text-slate-500">Refreshing…</span>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-border dark:bg-muted/20">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Error message
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900 dark:text-foreground">
                {detail.message || detail.errorMessage || "—"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Log ID" value={detail.id} mono />
              <DetailField
                label="Created"
                value={formatDate(detail.createdAt)}
              />
              <DetailField
                label="Expires"
                value={formatDate(detail.expiresAt)}
              />
              <DetailField label="Service" value={detail.service} />
              <DetailField label="Endpoint" value={detail.endpoint} mono />
              <DetailField
                label="HTTP Method"
                value={detail.method || detail.httpMethod}
              />
              <DetailField label="Status Code" value={detail.statusCode} />
              <DetailField
                label="Duration (ms)"
                value={detail.durationMs}
              />
              <DetailField label="Error Code" value={detail.errorCode} mono />
              <DetailField
                label="Transaction ID"
                value={detail.transactionId}
                mono
              />
              <DetailField
                label="Reference ID"
                value={detail.referenceId}
                mono
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <JsonBlock
                title="Request payload"
                value={detail.requestPayload ?? detail.requestBody}
              />
              <JsonBlock
                title="Response payload"
                value={detail.responsePayload ?? detail.responseBody}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
