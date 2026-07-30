"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  RefreshCw,
  ShieldX,
  PanelRightOpen,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { VerificationActions } from "@/components/verification/VerificationActions";
import {
  buildDefaultVerificationStats,
  VerificationStatsCards,
} from "@/components/verification/VerificationStatsCards";
import {
  VerificationQuickFilter,
  VerificationQuickFilters,
} from "@/components/verification/VerificationQuickFilters";
import { VerificationEmptyState } from "@/components/verification/VerificationEmptyState";
import { UserVerificationDrawer } from "@/components/verification/UserVerificationDrawer";
import { DocumentThumbStack } from "@/components/verification/DocumentThumbStack";
import { useVerificationWorkflow } from "@/hooks/useVerificationWorkflow";
import { getUserVerificationStatus } from "@/lib/idVerification";
import {
  formatUserTypeLabel,
  getNetworkUserName,
  getUserAadhaarNumber,
  getUserPanNumber,
} from "@/lib/normalizeUser";
import { formatDate } from "@/lib/utils";
import { getAdminUserById, listAdminUsers } from "@/services/adminUsersApi";
import {
  listSuperAdminNetworkUsers,
  SuperAdminNetworkKind,
} from "@/services/superAdminApi";
import { getUserById } from "@/services/userApi";
import { NetworkUserRecord } from "@/types/superAdmin";

type RoleFilter = "MASTER_DISTRIBUTOR" | "DISTRIBUTOR" | "RETAILER";

/** Verification UI shows first name only (no last name). */
function getVerificationDisplayName(user: NetworkUserRecord): string {
  const first = (user.firstName || "").trim();
  if (first) return first;
  const fromFull = (user.name || getNetworkUserName(user) || "").trim();
  if (!fromFull) return "—";
  return fromFull.split(/\s+/)[0] || fromFull;
}

const ROLE_OPTIONS = [
  { value: "RETAILER", label: "Retailer" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

interface IdVerificationManagementViewProps {
  breadcrumb: string;
  mode: "admin" | "super_admin";
}

export function IdVerificationManagementView({
  breadcrumb,
  mode,
}: IdVerificationManagementViewProps) {
  const isAdminSession = mode === "admin";
  const [role, setRole] = useState<RoleFilter>("RETAILER");
  const [statusFilter, setStatusFilter] =
    useState<VerificationQuickFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [data, setData] = useState<NetworkUserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [statsSample, setStatsSample] = useState<NetworkUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerUser, setDrawerUser] = useState<NetworkUserRecord | null>(null);
  const [enrichedMap, setEnrichedMap] = useState<
    Record<string, NetworkUserRecord>
  >({});
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPageIndex(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const sortBy = sorting[0]?.id || "createdAt";
  const sortOrder = sorting[0]?.desc === false ? "asc" : "desc";

  const fetchPage = useCallback(
    async (page: number, size: number) => {
      if (isAdminSession) {
        return listAdminUsers({
          role,
          search: search || undefined,
          page,
          pageSize: size,
          sortBy,
          sortOrder,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        });
      }
      return listSuperAdminNetworkUsers(role as SuperAdminNetworkKind, {
        search: search || undefined,
        page,
        pageSize: size,
        sortBy,
        sortOrder,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        startDate: fromDate || undefined,
        endDate: toDate || undefined,
      });
    },
    [isAdminSession, role, search, sortBy, sortOrder, fromDate, toDate]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPage(pageIndex + 1, pageSize);
      setData(result.data);
      setTotal(result.total ?? result.data.length);
    } catch (err) {
      setData([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, pageIndex, pageSize]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await fetchPage(1, 100);
      setStatsSample(result.data);
      setTotal((prev) => prev || result.total || result.data.length);
    } catch {
      setStatsSample([]);
    } finally {
      setStatsLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    let cancelled = false;
    if (!data.length) {
      setEnrichedMap({});
      return;
    }

    setEnriching(true);
    void (async () => {
      const entries = await Promise.all(
        data.map(async (user) => {
          try {
            const detail =
              mode === "admin"
                ? await getAdminUserById(user.id)
                : await getUserById(user.id);
            return [user.id, { ...user, ...detail }] as const;
          } catch {
            return [user.id, user] as const;
          }
        })
      );
      if (cancelled) return;
      const next: Record<string, NetworkUserRecord> = {};
      entries.forEach(([id, record]) => {
        next[id] = record;
      });
      setEnrichedMap(next);
      setEnriching(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [data, mode]);

  const workflow = useVerificationWorkflow(() => {
    void loadData();
    void loadStats();
  });

  const tableRows = useMemo(() => {
    return data.map((user) => enrichedMap[user.id] || user);
  }, [data, enrichedMap]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "ALL") return tableRows;
    return tableRows.filter(
      (user) => getUserVerificationStatus(user) === statusFilter
    );
  }, [tableRows, statusFilter]);

  const statsCounts = useMemo(() => {
    const source = statsSample.length ? statsSample : data;
    let pending = 0;
    let verified = 0;
    let rejected = 0;
    source.forEach((user) => {
      const status = getUserVerificationStatus(user);
      if (status === "VERIFIED") verified += 1;
      else if (status === "REJECTED") rejected += 1;
      else pending += 1;
    });
    return {
      pending,
      verified,
      rejected,
      total: total || source.length,
    };
  }, [statsSample, data, total]);

  const stats = useMemo(
    () => buildDefaultVerificationStats(statsCounts),
    [statsCounts]
  );

  const quickCounts = useMemo(
    () => ({
      ALL: statsCounts.total,
      PENDING: statsCounts.pending,
      VERIFIED: statsCounts.verified,
      REJECTED: statsCounts.rejected,
    }),
    [statsCounts]
  );

  const allVisibleSelected =
    filteredRows.length > 0 &&
    filteredRows.every((user) => selectedIds.has(user.id));

  const toggleAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (
        filteredRows.length > 0 &&
        filteredRows.every((user) => prev.has(user.id))
      ) {
        filteredRows.forEach((user) => next.delete(user.id));
      } else {
        filteredRows.forEach((user) => next.add(user.id));
      }
      return next;
    });
  }, [filteredRows]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearFilters = () => {
    setStatusFilter("ALL");
    setSearchInput("");
    setSearch("");
    setFromDate("");
    setToDate("");
    setPageIndex(0);
  };

  const emptyKind = useMemo(() => {
    if (search && filteredRows.length === 0) return "search" as const;
    if (statusFilter === "PENDING" && filteredRows.length === 0) {
      return "pending" as const;
    }
    return "verification" as const;
  }, [search, statusFilter, filteredRows.length]);

  const columns = useMemo<ColumnDef<NetworkUserRecord, unknown>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        size: 44,
        header: () => (
          <input
            type="checkbox"
            aria-label="Select all visible users"
            className="h-4 w-4 rounded border-border"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${getVerificationDisplayName(row.original)}`}
            className="h-4 w-4 rounded border-border"
            checked={selectedIds.has(row.original.id)}
            onChange={() => toggleOne(row.original.id)}
          />
        ),
      },
      {
        id: "name",
        accessorFn: (row) => getVerificationDisplayName(row),
        header: "User",
        enableSorting: true,
        cell: ({ row }) => (
          <button
            type="button"
            className="flex min-w-[170px] items-center gap-2.5 text-left transition hover:opacity-90"
            onClick={() =>
              setDrawerUser(enrichedMap[row.original.id] || row.original)
            }
          >
            <NetworkUserAvatar user={row.original} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {getVerificationDisplayName(row.original)}
              </p>
              <p className="truncate text-[11px] text-muted">
                {formatUserTypeLabel(
                  row.original.userType || row.original.role
                )}
              </p>
            </div>
          </button>
        ),
      },
      {
        accessorKey: "userCode",
        header: "Code",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
            {row.original.userCode || "—"}
          </span>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-[150px] space-y-0.5">
            <p className="truncate text-sm text-foreground">
              {row.original.email || "—"}
            </p>
            <p className="text-xs text-muted">
              {row.original.mobile ||
                (typeof row.original.phone === "string"
                  ? row.original.phone
                  : "—")}
            </p>
          </div>
        ),
      },
      {
        id: "kycIds",
        header: "Aadhaar / PAN",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-[130px] space-y-0.5 font-mono text-[11px]">
            <p className="text-foreground">
              {getUserAadhaarNumber(row.original)}
            </p>
            <p className="text-muted">{getUserPanNumber(row.original)}</p>
          </div>
        ),
      },
      {
        id: "documents",
        header: "Documents",
        enableSorting: false,
        cell: ({ row }) => (
          <DocumentThumbStack
            user={row.original}
            loading={enriching && !enrichedMap[row.original.id]}
          />
        ),
      },
      {
        id: "verificationStatus",
        accessorFn: (row) => getUserVerificationStatus(row),
        header: "Status",
        enableSorting: true,
        cell: ({ row }) => (
          <VerificationBadge status={getUserVerificationStatus(row.original)} />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        enableSorting: true,
        cell: ({ row }) =>
          row.original.createdAt
            ? formatDate(row.original.createdAt, "dd MMM yyyy")
            : "—",
      },
      {
        id: "actions",
        enableSorting: false,
        header: "Actions",
        meta: { align: "right" as const },
        cell: ({ row }) => {
          const status = getUserVerificationStatus(row.original);
          return (
            <div className="inline-flex flex-nowrap items-center justify-end gap-1.5 whitespace-nowrap">
              <VerificationActions
                status={status}
                canManage
                compact
                disabled={workflow.isBusy}
                onVerify={() => workflow.openVerify(row.original)}
                onReject={() => workflow.openReject(row.original)}
                onViewDetails={() =>
                  setDrawerUser(enrichedMap[row.original.id] || row.original)
                }
                onViewReason={() =>
                  setDrawerUser(enrichedMap[row.original.id] || row.original)
                }
                onTransfer={() => workflow.openTransfer(row.original)}
                onDeduct={() => workflow.openDeduct(row.original)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Open details drawer"
                className="!h-8 !shrink-0 !rounded-lg !px-2"
                onClick={() =>
                  setDrawerUser(enrichedMap[row.original.id] || row.original)
                }
              >
                <PanelRightOpen className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [
      allVisibleSelected,
      selectedIds,
      workflow,
      toggleAllVisible,
      toggleOne,
      enriching,
      enrichedMap,
    ]
  );

  return (
    <div className="page-container space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          breadcrumb={breadcrumb}
          title="ID Verification Management"
          subtitle="Professional verification dashboard for Retailer, Distributor & Master Distributor"
          action={
            <Button
              type="button"
              variant="outline"
              disabled={isLoading || statsLoading}
              onClick={() => {
                void loadData();
                void loadStats();
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          }
        />
      </motion.div>

      <VerificationStatsCards
        stats={stats}
        isLoading={statsLoading && !statsSample.length}
        activeKey={statusFilter}
        onSelect={(key) => {
          setStatusFilter(key as VerificationQuickFilter);
          setPageIndex(0);
        }}
      />

      <Card className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <VerificationQuickFilters
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPageIndex(0);
            }}
            counts={quickCounts}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled
              title="Coming soon"
              aria-disabled
            >
              <CheckCircle2 className="h-4 w-4" />
              Bulk Verify
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled
              title="Coming soon"
              aria-disabled
            >
              <ShieldX className="h-4 w-4" />
              Bulk Reject
            </Button>
            {selectedIds.size > 0 ? (
              <span className="self-center text-xs text-muted">
                {selectedIds.size} selected
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as RoleFilter);
              setPageIndex(0);
              setSelectedIds(new Set());
            }}
            options={ROLE_OPTIONS}
          />
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPageIndex(0);
            }}
          />
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setPageIndex(0);
            }}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={clearFilters}
            >
              Reset filters
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {error}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {!isLoading && filteredRows.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <VerificationEmptyState
                kind={emptyKind}
                onClear={clearFilters}
              />
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <DataTable
                data={filteredRows}
                columns={columns}
                isLoading={isLoading}
                searchPlaceholder="Search name, email, mobile, user code..."
                searchValue={searchInput}
                onSearch={(value) => setSearchInput(value)}
                manualPagination={statusFilter === "ALL"}
                pageCount={Math.max(1, Math.ceil((total || 0) / pageSize))}
                pageIndex={pageIndex}
                onPageChange={setPageIndex}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPageIndex(0);
                }}
                manualSorting
                sorting={sorting}
                onSortingChange={setSorting}
                tone="network"
                stickyHeader
                minTableWidth={1280}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {workflow.dialogs}

      <UserVerificationDrawer
        isOpen={!!drawerUser}
        onClose={() => setDrawerUser(null)}
        user={drawerUser}
        mode={mode}
        onUpdated={() => {
          void loadData();
          void loadStats();
        }}
      />
    </div>
  );
}
