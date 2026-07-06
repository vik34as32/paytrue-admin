"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { DataTable } from "@/components/tables/DataTable";
import {
  SuperAdminListFilters,
  SuperAdminListFiltersValue,
} from "@/components/super-admin/SuperAdminListFilters";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchWalletHistory } from "@/store/api/superAdminWalletApi";
import { ROUTES } from "@/constants";
import { WalletHistoryRecord } from "@/types/superAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;
const ADD_BALANCE_TYPE = "ADD_BALANCE";

function HighlightAmount({ value }: { value: number }) {
  return (
    <span className="inline-block rounded-md bg-accent-green/10 px-2.5 py-1 text-sm font-semibold text-accent-green">
      {formatCurrency(value)}
    </span>
  );
}

export default function WalletHistoryPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const { history, isLoadingHistory, error, historyTotal } = useAppSelector(
    (state) => state.superAdminWallet
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState<SuperAdminListFiltersValue>({});

  const loadHistory = useCallback(() => {
    dispatch(
      fetchWalletHistory({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        transactionType: ADD_BALANCE_TYPE,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
    );
  }, [dispatch, pageIndex, filters.startDate, filters.endDate]);

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    loadHistory();
  }, [hasSuperAdminWalletAccess, router, loadHistory]);

  const columns: ColumnDef<WalletHistoryRecord, unknown>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) =>
        formatDate(row.original.date || row.original.createdAt || ""),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <HighlightAmount value={row.original.amount} />,
    },
    {
      accessorKey: "previousBalance",
      header: "Previous Balance",
      cell: ({ row }) => formatCurrency(row.original.previousBalance),
    },
    {
      id: "updatedBalance",
      header: "Updated Balance",
      cell: ({ row }) => (
        <HighlightAmount
          value={
            row.original.updatedBalance ?? row.original.currentBalance ?? 0
          }
        />
      ),
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => row.original.remarks || "—",
    },
  ];

  if (!hasSuperAdminWalletAccess) return null;

  const pageCount = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE));

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Wallet History"
        subtitle="Add balance transactions for super admin wallet"
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <Card>
        <SuperAdminListFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPageIndex(0);
          }}
          showStatus={false}
          showDateRange
          showTransactionType={false}
          resultsCount={history.length}
        />
        <DataTable
          data={history}
          columns={columns}
          isLoading={isLoadingHistory}
          hideSearch
          manualPagination
          pageCount={pageCount}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={PAGE_SIZE}
        />
      </Card>
    </div>
  );
}
