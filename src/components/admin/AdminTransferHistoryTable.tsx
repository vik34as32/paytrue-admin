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
import { fetchAdminTransferHistory } from "@/store/api/adminModuleApi";
import { selectAdminTransferHistory } from "@/store/selectors/adminSelectors";
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
}

export function AdminTransferHistoryTable({
  refreshKey = 0,
  title = "Transfer History",
  subtitle = "Balance transfers to your master distributors",
}: AdminTransferHistoryTableProps) {
  const dispatch = useAppDispatch();
  const transferHistory = useAppSelector(selectAdminTransferHistory);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminListFiltersValue>({});

  const loadHistory = useCallback(
    (page = pageIndex + 1) => {
      dispatch(
        fetchAdminTransferHistory({
          page,
          pageSize,
          search: search || undefined,
          status: filters.status,
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
    setPageIndex(0);
    loadHistory(1);
  }, [refreshKey, loadHistory]);

  const columns = useMemo<ColumnDef<AdminWalletHistoryRecord, unknown>[]>(
    () => buildAdminTransferHistoryColumns(),
    []
  );

  const pageCount = Math.max(1, Math.ceil(transferHistory.total / pageSize));

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
            disabled={transferHistory.isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${transferHistory.isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />
      {transferHistory.error && (
        <div className="mb-4 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {transferHistory.error}
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
        data={transferHistory.data}
        columns={columns}
        isLoading={transferHistory.isLoading}
        searchPlaceholder="Search transfers..."
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
