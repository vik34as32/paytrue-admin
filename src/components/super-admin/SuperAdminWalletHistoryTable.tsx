"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import {
  SuperAdminListFilters,
  SuperAdminListFiltersValue,
} from "@/components/super-admin/SuperAdminListFilters";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchWalletHistory } from "@/store/api/superAdminWalletApi";
import { clearWalletError } from "@/store/slices/superAdminWalletSlice";
import { buildWalletHistoryColumns } from "@/lib/walletHistoryColumns";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
];

interface SuperAdminWalletHistoryTableProps {
  /** Increment to reload history (e.g. after a successful transfer). */
  refreshKey?: number;
  /** When true, resets to page 1 on refreshKey change. Default true. */
  resetPageOnRefresh?: boolean;
}

export function SuperAdminWalletHistoryTable({
  refreshKey = 0,
  resetPageOnRefresh = true,
}: SuperAdminWalletHistoryTableProps) {
  const dispatch = useAppDispatch();
  const { history, isLoadingHistory, error, historyTotal } = useAppSelector(
    (state) => state.superAdminWallet
  );
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<SuperAdminListFiltersValue>({});
  const lastErrorRef = useRef<string | null>(null);

  const loadHistory = useCallback(
    (page = pageIndex + 1) => {
      dispatch(clearWalletError());
      dispatch(
        fetchWalletHistory({
          page,
          pageSize,
          search: search || undefined,
          transactionType: filters.transactionType,
          startDate: filters.startDate,
          endDate: filters.endDate,
        })
      );
    },
    [dispatch, pageIndex, pageSize, search, filters]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (refreshKey === 0) return;
    if (resetPageOnRefresh) {
      setPageIndex(0);
      loadHistory(1);
      return;
    }
    loadHistory();
  }, [refreshKey, resetPageOnRefresh, loadHistory]);

  useEffect(() => {
    if (error && error !== lastErrorRef.current && !isLoadingHistory) {
      lastErrorRef.current = error;
      toast.error(error);
    }
    if (!error) {
      lastErrorRef.current = null;
    }
  }, [error, isLoadingHistory]);

  const columns = useMemo(
    () => buildWalletHistoryColumns(history),
    [history]
  );

  const pageCount = Math.max(1, Math.ceil(historyTotal / pageSize));

  return (
    <Card className="mt-6">
      <CardHeader
        title="Wallet History"
        subtitle="All balance transfers and wallet transactions"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadHistory()}
            disabled={isLoadingHistory}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoadingHistory ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      <SuperAdminListFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPageIndex(0);
        }}
        showStatus={false}
        showDateRange
        showTransactionType
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-[160px]">
          <Select
            label="Page Size"
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageIndex(0);
            }}
            options={PAGE_SIZE_OPTIONS}
          />
        </div>
        <p className="text-sm text-muted">
          {historyTotal} total record{historyTotal === 1 ? "" : "s"}
        </p>
      </div>

      {error && !isLoadingHistory && history.length === 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent-red" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Failed to load wallet history
              </p>
              <p className="mt-1 text-sm text-muted">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadHistory()}>
            Retry
          </Button>
        </div>
      )}

      <DataTable
        data={history}
        columns={columns}
        isLoading={isLoadingHistory}
        searchPlaceholder="Search by transaction ID, receiver, remarks..."
        onSearch={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        manualPagination
        pageCount={pageCount}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={pageSize}
      />
    </Card>
  );
}
