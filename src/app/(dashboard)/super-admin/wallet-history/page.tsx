"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { DataTable } from "@/components/tables/DataTable";
import { ReportExportBar } from "@/components/tables/ReportExportBar";
import {
  SuperAdminListFilters,
  SuperAdminListFiltersValue,
} from "@/components/super-admin/SuperAdminListFilters";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchWalletHistory } from "@/store/api/superAdminWalletApi";
import { getWalletHistory } from "@/services/superAdminWallet";
import { ROUTES, APP_NAME } from "@/constants";
import { WalletHistoryRecord } from "@/types/superAdmin";
import { formatCurrency, cn } from "@/lib/utils";
import {
  downloadReportExcel,
  downloadReportPdf,
  reportFilename,
} from "@/lib/reportExport";
import {
  resolveCurrentBalance,
  resolveHistoryDate,
  resolveHistoryTime,
  resolveTopupAmount,
  resolveUpdatedBalance,
  toWalletHistoryExportRows,
} from "@/lib/walletHistoryFormat";
import { toast } from "sonner";

const PAGE_SIZE = 10;
const ADD_BALANCE_TYPE = "ADD_BALANCE";

function AmountPill({
  value,
  tone,
}: {
  value: number;
  tone: "current" | "topup" | "updated";
}) {
  const toneClass =
    tone === "current"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
      : tone === "topup"
        ? "bg-accent-green/10 text-accent-green"
        : "bg-violet-500/10 text-violet-700 dark:text-violet-300";

  return (
    <span
      className={cn(
        "inline-block rounded-md px-2.5 py-1 text-sm font-semibold whitespace-nowrap",
        toneClass
      )}
    >
      {formatCurrency(value)}
    </span>
  );
}

export default function WalletHistoryPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const { history, isLoadingHistory, error, historyTotal, historySummary } =
    useAppSelector((state) => state.superAdminWallet);

  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState<SuperAdminListFiltersValue>({});
  const [exportLoading, setExportLoading] = useState(false);

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

  const fetchAllFilteredHistory = useCallback(async () => {
    const first = await getWalletHistory({
      page: 1,
      pageSize: 100,
      transactionType: ADD_BALANCE_TYPE,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    const totalPages = Math.max(
      1,
      first.totalPages ??
        Math.ceil((first.total ?? first.data.length) / (first.pageSize || 100))
    );

    const all: WalletHistoryRecord[] = [...first.data];
    for (let page = 2; page <= totalPages; page += 1) {
      const next = await getWalletHistory({
        page,
        pageSize: first.pageSize || 100,
        transactionType: ADD_BALANCE_TYPE,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      all.push(...next.data);
    }

    return { records: all, summary: first.summary ?? historySummary };
  }, [filters.startDate, filters.endDate, historySummary]);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const { records } = await fetchAllFilteredHistory();
      if (records.length === 0) {
        toast.error("No records available to export");
        return;
      }
      downloadReportExcel(
        toWalletHistoryExportRows(records),
        reportFilename("wallet-history"),
        "Wallet History"
      );
      toast.success("Excel downloaded successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export wallet history"
      );
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportLoading(true);
      const { records } = await fetchAllFilteredHistory();
      if (records.length === 0) {
        toast.error("No records available to export");
        return;
      }
      const rows = toWalletHistoryExportRows(records);
      const columns = Object.keys(rows[0] || {}).map((key) => ({
        key,
        label: key,
      }));
      downloadReportPdf({
        title: "Wallet Credit History",
        subtitle: "Virtual balance credits added by Super Admin",
        filename: reportFilename("wallet-history"),
        columns,
        rows,
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

  const columns: ColumnDef<WalletHistoryRecord, unknown>[] = [
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => resolveHistoryDate(row.original),
    },
    {
      id: "time",
      header: "Time",
      cell: ({ row }) => resolveHistoryTime(row.original),
    },
    {
      id: "currentBalance",
      header: "Current Balance",
      cell: ({ row }) => (
        <AmountPill
          value={resolveCurrentBalance(row.original)}
          tone="current"
        />
      ),
    },
    {
      id: "topupBalance",
      header: "Top-up Balance",
      cell: ({ row }) => (
        <AmountPill value={resolveTopupAmount(row.original)} tone="topup" />
      ),
    },
    {
      id: "updatedBalance",
      header: "Updated Balance",
      cell: ({ row }) => (
        <AmountPill
          value={resolveUpdatedBalance(row.original)}
          tone="updated"
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
        subtitle={`${APP_NAME} wallet top-up statement and transaction history`}
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="!p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Current Wallet Balance
          </p>
          <p className="mt-2 text-xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(historySummary?.currentWalletBalance ?? 0)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Total Top-up Amount
          </p>
          <p className="mt-2 text-xl font-bold text-accent-green">
            {formatCurrency(historySummary?.totalTopupAmount ?? 0)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Total Top-up Count
          </p>
          <p className="mt-2 text-xl font-bold text-violet-700 dark:text-violet-300">
            {historySummary?.totalTopupCount ?? historyTotal}
          </p>
        </Card>
      </div>

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
          resultsCount={historyTotal}
          resultsLabel="transactions"
        />
        <ReportExportBar
          className="mb-4"
          loading={exportLoading || isLoadingHistory}
          onExportExcel={() => void handleExportExcel()}
          onExportPdf={() => void handleExportPdf()}
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
          totalRows={historyTotal}
          tone="report"
        />
      </Card>
    </div>
  );
}
