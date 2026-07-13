"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import { APP_NAME } from "@/constants";
import { cn, formatCurrency } from "@/lib/utils";
import {
  formatOperationType,
  formatWalletUserType,
  mergeHeaderTotals,
  resolveActivityDate,
  resolveActivityTime,
  toWalletSummaryExportRows,
  WALLET_SUMMARY_TAB_LABELS,
} from "@/lib/walletSummaryFormat";
import { openWalletSummaryStatement } from "@/lib/walletSummaryStatement";
import {
  fetchAllUserWalletSummaryPages,
  fetchWalletSummaryUsers,
  getUserWalletSummary,
} from "@/services/walletSummaryApi";
import {
  WalletSummaryActivityRecord,
  WalletSummaryHeader,
  WalletSummaryOperationType,
  WalletSummaryQueryParams,
  WalletSummaryScope,
  WalletSummarySortBy,
  WalletSummaryUserOption,
  WalletSummaryUserType,
} from "@/types/walletSummary";
import { exportToCSV, exportToExcel } from "@/utils/export";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "CREDIT", label: "Credit" },
  { value: "DEDUCT", label: "Deduct" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
  { value: "REVERSED", label: "Reversed" },
  { value: "REFUNDED", label: "Refunded" },
];

const SORT_BY_OPTIONS = [
  { value: "createdAt", label: "Created Date" },
  { value: "amount", label: "Amount" },
  { value: "status", label: "Status" },
  { value: "operationType", label: "Type" },
  { value: "performedByRole", label: "Performed By Role" },
  { value: "reference", label: "Reference" },
];

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

interface WalletSummaryViewProps {
  scope: WalletSummaryScope;
  breadcrumb: string;
  accountName?: string;
  accountEmail?: string;
  accountCity?: string;
  accountState?: string;
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

export function WalletSummaryView({
  scope,
  breadcrumb,
  accountName,
  accountEmail,
  accountCity,
  accountState,
}: WalletSummaryViewProps) {
  const tabs: WalletSummaryUserType[] = [
    "MASTER_DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
  ];

  const [userType, setUserType] =
    useState<WalletSummaryUserType>("MASTER_DISTRIBUTOR");
  const [users, setUsers] = useState<WalletSummaryUserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState<WalletSummaryOperationType>("ALL");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<WalletSummarySortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [rows, setRows] = useState<WalletSummaryActivityRecord[]>([]);
  const [header, setHeader] = useState<WalletSummaryHeader | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPageIndex(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const list = await fetchWalletSummaryUsers(scope, userType);
      setUsers(list);
      setSelectedUserId((prev) =>
        list.some((item) => item.id === prev) ? prev : ""
      );
    } catch (err) {
      setUsers([]);
      setSelectedUserId("");
      toast.error(
        err instanceof Error ? err.message : "Failed to load users"
      );
    } finally {
      setUsersLoading(false);
    }
  }, [scope, userType]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const queryParams = useMemo<WalletSummaryQueryParams>(
    () => ({
      page: pageIndex + 1,
      pageSize: PAGE_SIZE,
      type,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
    }),
    [
      pageIndex,
      type,
      status,
      startDate,
      endDate,
      debouncedSearch,
      sortBy,
      sortOrder,
    ]
  );

  const loadSummary = useCallback(async () => {
    if (!selectedUserId) {
      setRows([]);
      setHeader(null);
      setTotal(0);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getUserWalletSummary(
        selectedUserId,
        queryParams,
        scope
      );
      setRows(result.data);
      setHeader(result.header ?? null);
      setTotal(result.total);
    } catch (err) {
      setRows([]);
      setHeader(null);
      setTotal(0);
      setError(
        err instanceof Error ? err.message : "Failed to load wallet summary"
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId, queryParams, scope]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const sorting: SortingState = useMemo(
    () => [{ id: sortBy, desc: sortOrder === "desc" }],
    [sortBy, sortOrder]
  );

  const columns = useMemo<ColumnDef<WalletSummaryActivityRecord, unknown>[]>(
    () => [
      {
        id: "index",
        header: "#",
        size: 56,
        enableSorting: false,
        meta: { align: "center" as const },
        cell: ({ row }) => (
          <span className="tabular-nums text-muted">
            {pageIndex * PAGE_SIZE + row.index + 1}
          </span>
        ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Date",
        meta: { align: "left" as const },
        cell: ({ row }) => resolveActivityDate(row.original),
      },
      {
        id: "time",
        header: "Time",
        enableSorting: false,
        meta: { align: "left" as const },
        cell: ({ row }) => resolveActivityTime(row.original),
      },
      {
        accessorKey: "reference",
        header: "Reference",
        meta: { align: "left" as const },
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.reference || "—"}
          </span>
        ),
      },
      {
        accessorKey: "operationType",
        header: "Type",
        meta: { align: "center" as const },
        cell: ({ row }) => {
          const op = formatOperationType(row.original.operationType);
          return (
            <Badge variant={op === "CREDIT" ? "success" : op === "DEDUCT" ? "rejected" : "default"}>
              {op}
            </Badge>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Amount",
        meta: { align: "right" as const },
        cell: ({ row }) => {
          const op = formatOperationType(row.original.operationType);
          return (
            <span
              className={cn(
                "inline-block rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums",
                op === "CREDIT"
                  ? "bg-accent-green/10 text-accent-green"
                  : op === "DEDUCT"
                    ? "bg-accent-red/10 text-accent-red"
                    : "bg-primary/10 text-primary"
              )}
            >
              {formatCurrency(row.original.amount)}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        meta: { align: "center" as const },
        cell: ({ row }) =>
          row.original.status ? (
            <Badge variant={statusVariant(row.original.status)}>
              {row.original.status}
            </Badge>
          ) : (
            "—"
          ),
      },
      {
        id: "performedByRole",
        header: "Performed By",
        meta: { align: "left" as const },
        cell: ({ row }) => (
          <div className="min-w-0 text-left">
            <p className="truncate font-medium">
              {row.original.performedByName || "—"}
            </p>
            <p className="truncate text-xs text-muted">
              {formatWalletUserType(row.original.performedByRole)}
              {row.original.performedByCode
                ? ` · ${row.original.performedByCode}`
                : ""}
            </p>
          </div>
        ),
      },
      {
        id: "previousBalance",
        header: "Prev. Balance",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) =>
          row.original.previousBalance != null ? (
            <span className="tabular-nums text-blue-700 dark:text-blue-300">
              {formatCurrency(row.original.previousBalance)}
            </span>
          ) : (
            "—"
          ),
      },
      {
        id: "updatedBalance",
        header: "Updated Balance",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) =>
          row.original.updatedBalance != null ? (
            <span className="tabular-nums text-violet-700 dark:text-violet-300">
              {formatCurrency(row.original.updatedBalance)}
            </span>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        enableSorting: false,
        meta: { align: "left" as const },
        cell: ({ row }) => row.original.remarks || "—",
      },
    ],
    [pageIndex]
  );

  const filterParams = useMemo(
    () => ({
      type,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
    }),
    [type, status, startDate, endDate, debouncedSearch, sortBy, sortOrder]
  );

  const requireUser = () => {
    if (!selectedUserId) {
      toast.error("Select a user to view wallet summary");
      return false;
    }
    return true;
  };

  const handleExport = async (format: "excel" | "csv") => {
    if (!requireUser()) return;
    try {
      setExportLoading(true);
      const { records } = await fetchAllUserWalletSummaryPages(
        selectedUserId,
        filterParams,
        scope
      );
      if (records.length === 0) {
        toast.error("No records available to export");
        return;
      }
      const exportRows = toWalletSummaryExportRows(records);
      const filename = `paytrue-wallet-summary-${selectedUserId.slice(0, 8)}-${new Date()
        .toISOString()
        .slice(0, 10)}`;
      if (format === "excel") {
        exportToExcel(exportRows, filename, "Wallet Summary");
        toast.success("Excel downloaded successfully");
      } else {
        exportToCSV(exportRows, filename);
        toast.success("CSV downloaded successfully");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export wallet summary"
      );
    } finally {
      setExportLoading(false);
    }
  };

  const handlePrintOrPdf = async (mode: "print" | "pdf") => {
    if (!requireUser()) return;
    try {
      setExportLoading(true);
      const { records, header: fullHeader } =
        await fetchAllUserWalletSummaryPages(
          selectedUserId,
          filterParams,
          scope
        );
      openWalletSummaryStatement({
        records,
        header: fullHeader,
        totals: mergeHeaderTotals(fullHeader, records),
        scopeLabel: scope === "super_admin" ? "Super Admin" : "Admin",
        userTypeLabel: WALLET_SUMMARY_TAB_LABELS[userType],
        selectedUserName: selectedUser?.name,
        accountName,
        accountEmail,
        city: accountCity || selectedUser?.city,
        state: accountState || selectedUser?.state,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: debouncedSearch || undefined,
        status: status || undefined,
        type,
      });
      toast.success(
        mode === "pdf"
          ? "PDF view opened — use Print → Save as PDF"
          : "Print dialog opened"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to open statement"
      );
    } finally {
      setExportLoading(false);
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const userOptions = [
    {
      value: "",
      label: usersLoading ? "Loading users..." : "Select user",
    },
    ...users.map((user) => ({
      value: user.id,
      label: `${user.name} (${user.id})`,
    })),
  ];

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Wallet Summary"
        subtitle={`${APP_NAME} — view MD / DD / RT wallet activity via /wallet/summary/:userId`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={exportLoading || isLoading || !selectedUserId}
              onClick={() => void loadSummary()}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exportLoading || !selectedUserId}
              onClick={() => void handleExport("csv")}
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exportLoading || !selectedUserId}
              onClick={() => void handleExport("excel")}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exportLoading || !selectedUserId}
              onClick={() => void handlePrintOrPdf("pdf")}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={exportLoading || !selectedUserId}
              isLoading={exportLoading}
              onClick={() => void handlePrintOrPdf("print")}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab === userType;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setUserType(tab);
                setSelectedUserId("");
                setPageIndex(0);
              }}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted hover:border-primary/30 hover:text-foreground"
              )}
            >
              {WALLET_SUMMARY_TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Select User"
            value={selectedUserId}
            onChange={(event) => {
              setSelectedUserId(event.target.value);
              setPageIndex(0);
            }}
            options={userOptions}
            disabled={usersLoading}
          />
          <Select
            label="Type"
            value={type}
            onChange={(event) => {
              setType(event.target.value as WalletSummaryOperationType);
              setPageIndex(0);
            }}
            options={TYPE_OPTIONS}
          />
          <Select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPageIndex(0);
            }}
            options={STATUS_OPTIONS}
          />
          <Input
            label="Search"
            placeholder="Reference, remarks, performer..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPageIndex(0);
            }}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPageIndex(0);
            }}
          />
          <Select
            label="Sort By"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as WalletSummarySortBy);
              setPageIndex(0);
            }}
            options={SORT_BY_OPTIONS}
          />
          <Select
            label="Order"
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as "asc" | "desc");
              setPageIndex(0);
            }}
            options={SORT_ORDER_OPTIONS}
          />
        </div>

        {selectedUser || header ? (
          <div className="mb-4 rounded-xl border border-border bg-background/50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-2 font-medium text-foreground">
                <Wallet className="h-4 w-4 text-primary" />
                {header?.name || selectedUser?.name || "Selected user"}
              </span>
              <span className="text-muted">
                Code: {header?.userCode || selectedUser?.userCode || "—"}
              </span>
              <span className="text-muted">
                Mobile: {header?.mobile || selectedUser?.mobile || "—"}
              </span>
              <span className="text-muted">
                Type:{" "}
                {formatWalletUserType(
                  header?.userType || selectedUser?.userType || userType
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            Select a {WALLET_SUMMARY_TAB_LABELS[userType].toLowerCase()} to load
            wallet summary from{" "}
            <code className="text-xs">GET /wallet/summary/:userId</code>
          </div>
        )}

        <DataTable
          data={rows}
          columns={columns}
          isLoading={isLoading}
          hideSearch
          manualPagination
          pageCount={pageCount}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={PAGE_SIZE}
          manualSorting
          sorting={sorting}
          onSortingChange={(updater) => {
            const next =
              typeof updater === "function" ? updater(sorting) : updater;
            const first = next[0];
            if (!first) return;
            const allowed: WalletSummarySortBy[] = [
              "createdAt",
              "amount",
              "status",
              "operationType",
              "performedByRole",
              "reference",
            ];
            const nextSortBy = allowed.includes(first.id as WalletSummarySortBy)
              ? (first.id as WalletSummarySortBy)
              : "createdAt";
            setSortBy(nextSortBy);
            setSortOrder(first.desc ? "desc" : "asc");
            setPageIndex(0);
          }}
        />
      </Card>
    </div>
  );
}
