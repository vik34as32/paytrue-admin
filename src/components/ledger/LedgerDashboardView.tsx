"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Alert, Button, Card } from "antd";
import { Dayjs } from "dayjs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { CommissionAntdProvider as LedgerAntdProvider } from "@/components/commission/CommissionAntdProvider";
import { LedgerStatsCards } from "@/components/ledger/LedgerStatsCards";
import { LedgerTabs } from "@/components/ledger/LedgerTabs";
import { LedgerFilterBar } from "@/components/ledger/LedgerFilterBar";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { LedgerSummary } from "@/components/ledger/LedgerSummary";
import { LedgerDrawer } from "@/components/ledger/LedgerDrawer";
import { LedgerEmptyState } from "@/components/ledger/LedgerEmptyState";
import { LedgerSkeleton } from "@/components/ledger/LedgerSkeleton";
import { useLedger } from "@/hooks/useLedger";
import { LedgerFilters, LedgerRoleTab, LedgerRow } from "@/types/ledger";

const TAB_ROUTES: Record<LedgerRoleTab, string> = {
  ADMIN: "/ledger/admin",
  MASTER_DISTRIBUTOR: "/ledger/master-distributor",
  DISTRIBUTOR: "/ledger/distributor",
  RETAILER: "/ledger/retailer",
};

function tabFromPath(pathname: string): LedgerRoleTab {
  if (pathname.includes("master-distributor")) return "MASTER_DISTRIBUTOR";
  if (pathname.includes("distributor") && !pathname.includes("master"))
    return "DISTRIBUTOR";
  if (pathname.includes("retailer")) return "RETAILER";
  if (pathname.includes("admin")) return "ADMIN";
  return "ADMIN";
}

interface LedgerDashboardViewProps {
  initialTab?: LedgerRoleTab;
}

export function LedgerDashboardView({ initialTab }: LedgerDashboardViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<LedgerRoleTab>(
    initialTab || tabFromPath(pathname)
  );

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [status, setStatus] = useState("");
  const [transactionType, setTransactionType] = useState("ALL");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<LedgerRow | null>(null);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo<LedgerFilters>(
    () => ({
      page,
      limit,
      search: search || undefined,
      role: (roleFilter || tab) as LedgerRoleTab,
      serviceType: serviceType || undefined,
      status: status || undefined,
      transactionType,
      startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
    }),
    [
      page,
      limit,
      search,
      roleFilter,
      tab,
      serviceType,
      status,
      transactionType,
      dateRange,
    ]
  );

  const query = useLedger(filters);

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error(query.error.message || "Failed to load ledger");
    }
  }, [query.isError, query.error]);

  const handleTabChange = useCallback(
    (next: LedgerRoleTab) => {
      setTab(next);
      setPage(1);
      setSelectedRowKeys([]);
      router.push(TAB_ROUTES[next]);
    },
    [router]
  );

  const handleReset = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setRoleFilter("");
    setServiceType("");
    setStatus("");
    setTransactionType("ALL");
    setDateRange(null);
    setPage(1);
    setLimit(20);
  }, []);

  const items = query.data?.items ?? [];
  const stats = query.data?.stats;
  const summary = query.data?.summary;
  const pagination = query.data?.pagination;
  const hasFilters = !!(
    search ||
    roleFilter ||
    serviceType ||
    status ||
    (transactionType && transactionType !== "ALL") ||
    dateRange
  );

  const filteredItems = useMemo(() => {
    if (!serviceType) return items;
    return items.filter(
      (row) =>
        row.serviceType.toUpperCase() === serviceType.toUpperCase() ||
        row.serviceType.toUpperCase().includes(serviceType.toUpperCase())
    );
  }, [items, serviceType]);

  return (
    <LedgerAntdProvider>
      <div className="space-y-6">
        <PageHeader
          breadcrumb="Ledger"
          title="Wallet Ledger"
          subtitle="Track every wallet transaction across the entire hierarchy."
        />

        {query.isLoading && !query.data ? (
          <LedgerSkeleton />
        ) : (
          <>
            <LedgerStatsCards
              stats={
                stats || {
                  totalTransactions: 0,
                  totalCredits: 0,
                  totalDebits: 0,
                  totalCharges: 0,
                  totalCommission: 0,
                  todayTransactions: 0,
                  pendingTransactions: 0,
                  failedTransactions: 0,
                }
              }
              loading={query.isFetching && !query.data}
            />

            <Card className="rounded-2xl shadow-sm" styles={{ body: { paddingTop: 8 } }}>
              <LedgerTabs active={tab} onChange={handleTabChange} />
            </Card>

            <LedgerFilterBar
              search={searchInput}
              onSearchChange={setSearchInput}
              role={roleFilter}
              onRoleChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
              serviceType={serviceType}
              onServiceTypeChange={(v) => {
                setServiceType(v);
                setPage(1);
              }}
              status={status}
              onStatusChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              transactionType={transactionType}
              onTransactionTypeChange={(v) => {
                setTransactionType(v);
                setPage(1);
              }}
              dateRange={dateRange}
              onDateRangeChange={(range) => {
                setDateRange(range);
                setPage(1);
              }}
              onReset={handleReset}
              onRefresh={() => query.refetch()}
              exportRows={filteredItems}
              isFetching={query.isFetching}
            />

            {query.isError && !query.data ? (
              <Alert
                type="error"
                showIcon
                message="Unable to load ledger"
                description={query.error?.message}
                action={
                  <Button size="small" onClick={() => query.refetch()}>
                    Retry
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="min-w-0"
                >
                  {!query.isLoading && filteredItems.length === 0 ? (
                    <LedgerEmptyState
                      variant={hasFilters ? "no-search" : "no-transactions"}
                      onReset={handleReset}
                    />
                  ) : (
                    <LedgerTable
                      rows={filteredItems}
                      loading={query.isFetching}
                      page={pagination?.page || page}
                      limit={pagination?.limit || limit}
                      total={pagination?.total || filteredItems.length}
                      onPageChange={(p, size) => {
                        setPage(p);
                        setLimit(size);
                      }}
                      selectedRowKeys={selectedRowKeys}
                      onSelectChange={setSelectedRowKeys}
                      onView={(row) => {
                        setActiveRow(row);
                        setDrawerOpen(true);
                      }}
                    />
                  )}
                </motion.div>

                <div className="xl:sticky xl:top-24 xl:self-start">
                  <LedgerSummary
                    totalCredit={summary?.totalCredit || 0}
                    totalDebit={summary?.totalDebit || 0}
                    totalCharge={summary?.totalCharge || 0}
                    totalCommission={summary?.totalCommission || 0}
                    netAmount={summary?.netAmount || 0}
                    loading={query.isFetching && !query.data}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <LedgerDrawer
          open={drawerOpen}
          ledgerId={activeRow?.id || null}
          fallbackRow={activeRow}
          onClose={() => {
            setDrawerOpen(false);
            setActiveRow(null);
          }}
        />
      </div>
    </LedgerAntdProvider>
  );
}
