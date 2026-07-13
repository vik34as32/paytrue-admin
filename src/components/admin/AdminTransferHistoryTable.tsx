"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import {
  AdminListFilters,
  AdminListFiltersValue,
} from "@/components/admin/AdminListFilters";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminWalletHistory, fetchAdminTransferHistory } from "@/store/api/adminModuleApi";
import {
  selectAdminTransferHistory,
  selectAdminWalletHistory,
} from "@/store/selectors/adminSelectors";
import { buildAdminTransferHistoryColumns } from "@/lib/adminHistoryColumns";
import { AdminWalletHistoryRecord } from "@/types/admin";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
];

interface AdminTransferHistoryTableProps {
  refreshKey?: number;
  title?: string;
  subtitle?: string;
  transactionType?: string;
  searchPlaceholder?: string;
  /** Transfer list (`/wallet/transfers`) vs full wallet history (`/admin/wallet-history`) */
  historyKind?: "transfer" | "wallet";
}

export function AdminTransferHistoryTable({
  refreshKey = 0,
  title = "Transfer History",
  subtitle = "Balance transfers to your master distributors",
  transactionType,
  searchPlaceholder = "Search transfers...",
  historyKind = "transfer",
}: AdminTransferHistoryTableProps) {
  const dispatch = useAppDispatch();
  const transferHistory = useAppSelector(selectAdminTransferHistory);
  const walletHistory = useAppSelector(selectAdminWalletHistory);
  const history = historyKind === "wallet" ? walletHistory : transferHistory;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminListFiltersValue>({});

  const loadHistory = useCallback(
    (page = pageIndex + 1) => {
      const params = {
        page,
        pageSize,
        search: search || undefined,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        transactionType,
      };
      const fetchHistory =
        historyKind === "wallet"
          ? fetchAdminWalletHistory
          : fetchAdminTransferHistory;

      dispatch(fetchHistory(params));
    },
    [dispatch, pageIndex, pageSize, search, filters, transactionType, historyKind]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (refreshKey === 0) return;
    setPageIndex(0);
    loadHistory(1);
  }, [refreshKey, loadHistory]);

  const columns = useMemo<ColumnDef<AdminWalletHistoryRecord, unknown>[]>(
    () => buildAdminTransferHistoryColumns(),
    []
  );

  const pageCount = Math.max(1, Math.ceil(history.total / pageSize));

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadHistory()}
            disabled={history.isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${history.isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />
      {history.error && (
        <div className="mb-4 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {history.error}
        </div>
      )}
      <AdminListFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPageIndex(0);
        }}
        showStatus
        showDateRange
      />
      <div className="mb-4 w-full sm:max-w-[160px]">
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
      <DataTable
        data={history.data}
        columns={columns}
        isLoading={history.isLoading}
        searchPlaceholder={searchPlaceholder}
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
