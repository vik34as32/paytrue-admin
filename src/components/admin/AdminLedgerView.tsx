"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import {
  AdminListFilters,
  AdminListFiltersValue,
} from "@/components/admin/AdminListFilters";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminWalletHistory } from "@/store/api/adminModuleApi";
import { selectAdminWalletHistory } from "@/store/selectors/adminSelectors";
import { buildAdminLedgerColumns } from "@/lib/adminHistoryColumns";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
];

export function AdminLedgerView() {
  const dispatch = useAppDispatch();
  const walletHistory = useAppSelector(selectAdminWalletHistory);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminListFiltersValue>({});

  const loadLedger = useCallback(
    (page = pageIndex + 1) => {
      dispatch(
        fetchAdminWalletHistory({
          page,
          pageSize,
          search: search || undefined,
          startDate: filters.startDate,
          endDate: filters.endDate,
        })
      );
    },
    [dispatch, pageIndex, pageSize, search, filters]
  );

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const columns = useMemo(() => buildAdminLedgerColumns(), []);
  const pageCount = Math.max(1, Math.ceil(walletHistory.total / pageSize));

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Admin"
        title="Wallet Ledger"
        subtitle="Credit, debit, and running balance entries"
      />

      <Card>
        <CardHeader title="Ledger Entries" />
        {walletHistory.error && (
          <div className="mb-4 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {walletHistory.error}
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
          data={walletHistory.data}
          columns={columns}
          isLoading={walletHistory.isLoading}
          searchPlaceholder="Search ledger..."
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
