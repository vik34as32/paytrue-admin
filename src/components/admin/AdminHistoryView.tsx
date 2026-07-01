"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import {
  AdminListFilters,
  AdminListFiltersValue,
} from "@/components/admin/AdminListFilters";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  fetchAdminWalletHistory,
  fetchAdminTransferHistory,
} from "@/store/api/adminModuleApi";
import {
  selectAdminWalletHistory,
  selectAdminTransferHistory,
} from "@/store/selectors/adminSelectors";
import { buildAdminHistoryColumns } from "@/lib/adminHistoryColumns";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
];

type HistoryTab = "wallet" | "transfer";

export function AdminHistoryView() {
  const dispatch = useAppDispatch();
  const walletHistory = useAppSelector(selectAdminWalletHistory);
  const transferHistory = useAppSelector(selectAdminTransferHistory);
  const [tab, setTab] = useState<HistoryTab>("wallet");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminListFiltersValue>({});

  const activeHistory = tab === "wallet" ? walletHistory : transferHistory;

  const loadHistory = useCallback(
    (page = pageIndex + 1) => {
      const params = {
        page,
        pageSize,
        search: search || undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      if (tab === "wallet") {
        dispatch(fetchAdminWalletHistory(params));
      } else {
        dispatch(fetchAdminTransferHistory(params));
      }
    },
    [dispatch, tab, pageIndex, pageSize, search, filters]
  );

  useEffect(() => {
    setPageIndex(0);
  }, [tab]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const columns = useMemo(() => buildAdminHistoryColumns(), []);

  const pageCount = Math.max(1, Math.ceil(activeHistory.total / pageSize));

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Admin"
        title="Balance History"
        subtitle="Wallet and transfer transaction history"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant={tab === "wallet" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("wallet")}
        >
          Wallet History
        </Button>
        <Button
          variant={tab === "transfer" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("transfer")}
        >
          Transfer History
        </Button>
      </div>

      <Card>
        <CardHeader
          title={tab === "wallet" ? "Wallet History" : "Transfer History"}
          subtitle={
            tab === "wallet"
              ? "All wallet credits and debits"
              : "Transfers to master distributors"
          }
        />
        {activeHistory.error && (
          <div className="mb-4 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {activeHistory.error}
          </div>
        )}
        <AdminListFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPageIndex(0);
          }}
          showStatus={false}
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
          data={activeHistory.data}
          columns={columns}
          isLoading={activeHistory.isLoading}
          searchPlaceholder="Search history..."
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
    </div>
  );
}
