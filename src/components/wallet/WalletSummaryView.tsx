"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import { ReportExportBar } from "@/components/tables/ReportExportBar";
import { APP_NAME } from "@/constants";
import { cn, formatCurrency } from "@/lib/utils";
import {
  downloadReportExcel,
  downloadReportPdf,
  reportFilename,
} from "@/lib/reportExport";
import {
  formatOperationType,
  formatWalletUserType,
  mergeHeaderTotals,
  resolveActivityDate,
  toWalletSummaryExportRows,
  WALLET_SUMMARY_TAB_LABELS,
} from "@/lib/walletSummaryFormat";
import {
  fetchAllUserWalletSummaryPages,
  fetchNetworkWalletSummaries,
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

const PAGE_SIZE = 20;

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
}: WalletSummaryViewProps) {
  const tabs: WalletSummaryUserType[] =
    scope === "super_admin"
      ? ["ALL", "ADMIN", "MASTER_DISTRIBUTOR", "DISTRIBUTOR", "RETAILER"]
      : ["ALL", "MASTER_DISTRIBUTOR", "DISTRIBUTOR", "RETAILER"];

  const [userType, setUserType] = useState<WalletSummaryUserType>(
    scope === "super_admin" ? "ALL" : "MASTER_DISTRIBUTOR"
  );
  const [users, setUsers] = useState<WalletSummaryUserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [scopeUserCount, setScopeUserCount] = useState(0);

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

  useEffect(() => {
    setPageIndex(0);
    setSelectedUserId("");
  }, [userType]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );

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
    setIsLoading(true);
    setUsersLoading(true);
    setError(null);
    try {
      // Optional single-user drill-down
      if (selectedUserId) {
        const result = await getUserWalletSummary(
          selectedUserId,
          queryParams,
          scope
        );
        setRows(result.data);
        setHeader(result.header ?? null);
        setTotal(result.total);
        return;
      }

      // Network summaries for selected userType tab
      const result = await fetchNetworkWalletSummaries(
        scope,
        userType,
        queryParams
      );
      setRows(result.data);
      setHeader(result.header ?? null);
      setTotal(result.total);
      setScopeUserCount(result.header?.scopeUserCount ?? result.users?.length ?? 0);
      if (result.users && result.users.length > 0) {
        setUsers(result.users);
      } else {
        const list = await fetchWalletSummaryUsers(scope, userType);
        setUsers(list);
        setScopeUserCount(list.length);
      }
    } catch (err) {
      setRows([]);
      setHeader(null);
      setTotal(0);
      setError(
        err instanceof Error ? err.message : "Failed to load wallet summary"
      );
    } finally {
      setIsLoading(false);
      setUsersLoading(false);
    }
  }, [selectedUserId, queryParams, scope, userType]);

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
        id: "targetUser",
        header: "User",
        enableSorting: false,
        meta: { align: "left" as const },
        cell: ({ row }) => {
          const name = row.original.targetUserName;
          if (!name && !selectedUser) return "—";
          return (
            <div className="min-w-0 text-left">
              <p className="truncate font-medium">
                {name || selectedUser?.name || "—"}
              </p>
              <p className="truncate text-xs text-muted">
                {formatWalletUserType(
                  row.original.targetUserRole || selectedUser?.userType
                )}
                {row.original.targetUserCode
                  ? ` · ${row.original.targetUserCode}`
                  : selectedUser?.userCode
                    ? ` · ${selectedUser.userCode}`
                    : ""}
              </p>
            </div>
          );
        },
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
        id: "previousBalance",
        header: "Prev. Balance",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) =>
          row.original.previousBalance != null ? (
            <span className="tabular-nums text-muted">
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
        size: scope === "super_admin" ? 180 : 150,
        meta: { align: "right" as const },
        cell: ({ row }) =>
          row.original.updatedBalance != null ? (
            <span
              className={cn(
                "inline-block rounded-md px-2.5 py-1 font-bold tabular-nums",
                scope === "super_admin"
                  ? "bg-emerald-600/15 text-base text-emerald-800 dark:text-emerald-300"
                  : "bg-emerald-600/10 text-sm text-emerald-700 dark:text-emerald-300"
              )}
            >
              {formatCurrency(row.original.updatedBalance)}
            </span>
          ) : (
            "—"
          ),
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
    ],
    [pageIndex, scope, selectedUser]
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

  const requireData = () => {
    if (rows.length === 0 && !isLoading) {
      toast.error("No wallet summary records to export");
      return false;
    }
    return true;
  };

  const fetchAllExportRecords = async () => {
    let records: WalletSummaryActivityRecord[] = [];

    if (selectedUserId) {
      const packed = await fetchAllUserWalletSummaryPages(
        selectedUserId,
        filterParams,
        scope
      );
      records = packed.records;
    } else {
      const first = await fetchNetworkWalletSummaries(scope, userType, {
        ...filterParams,
        page: 1,
        pageSize: 100,
      });
      records = [...first.data];
      for (let page = 2; page <= first.totalPages; page += 1) {
        const next = await fetchNetworkWalletSummaries(scope, userType, {
          ...filterParams,
          page,
          pageSize: first.pageSize,
        });
        records.push(...next.data);
      }
    }

    return records;
  };

  const handleExportExcel = async () => {
    if (!requireData() && rows.length === 0) return;
    try {
      setExportLoading(true);
      const records = await fetchAllExportRecords();
      if (records.length === 0) {
        toast.error("No records available to export");
        return;
      }
      downloadReportExcel(
        toWalletSummaryExportRows(records),
        reportFilename(`wallet-summary-${userType.toLowerCase()}`),
        "Wallet Summary"
      );
      toast.success("Excel downloaded successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export wallet summary"
      );
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!requireData() && rows.length === 0) return;
    try {
      setExportLoading(true);
      const records = await fetchAllExportRecords();
      if (records.length === 0) {
        toast.error("No records available to export");
        return;
      }
      const exportRows = toWalletSummaryExportRows(records);
      downloadReportPdf({
        title: "Wallet Summary",
        subtitle: `${WALLET_SUMMARY_TAB_LABELS[userType]} network wallet activity`,
        filename: reportFilename(`wallet-summary-${userType.toLowerCase()}`),
        columns: Object.keys(exportRows[0] || {}).map((key) => ({
          key,
          label: key,
        })),
        rows: exportRows,
      });
      toast.success("PDF print dialog opened");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export PDF"
      );
    } finally {
      setExportLoading(false);
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const userOptions = [
    {
      value: "",
      label: usersLoading
        ? "Loading users..."
        : `All users (${scopeUserCount || users.length || 0})`,
    },
    ...users.map((user) => ({
      value: user.id,
      label: [user.name, user.userCode || user.mobile || user.userType]
        .filter(Boolean)
        .join(" · "),
    })),
  ];

  const totals = mergeHeaderTotals(header, rows);
  return (
    <div className="page-container">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Wallet Summary"
        subtitle={`${APP_NAME} — network wallet activity by user type (/wallet/summaries)`}
        action={
          <Button
            variant="outline"
            size="sm"
            disabled={exportLoading || isLoading}
            onClick={() => void loadSummary()}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
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
            placeholder="Reference, user, performer..."
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

        <div className="mb-4 rounded-xl border border-border bg-background/50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <Wallet className="h-4 w-4 text-primary" />
              {selectedUser
                ? selectedUser.name
                : `${WALLET_SUMMARY_TAB_LABELS[userType]} network summary`}
            </span>
            <span className="text-muted">
              Users:{" "}
              {selectedUser
                ? 1
                : header?.scopeUserCount || scopeUserCount || users.length || 0}
            </span>
            <span className="text-muted">
              Records: {total.toLocaleString("en-IN")}
            </span>
            <span className="text-accent-green">
              Credit: {formatCurrency(totals.totalCreditAmount)}
            </span>
            <span className="text-accent-red">
              Deduct: {formatCurrency(totals.totalDeductAmount)}
            </span>
            {selectedUser ? (
              <>
                <span className="text-muted">
                  Code: {selectedUser.userCode || "—"}
                </span>
                <span className="text-muted">
                  Mobile: {selectedUser.mobile || "—"}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <ReportExportBar
          className="mb-4"
          loading={exportLoading || isLoading}
          onExportExcel={() => void handleExportExcel()}
          onExportPdf={() => void handleExportPdf()}
        />

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
          totalRows={total}
          tone="report"
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
