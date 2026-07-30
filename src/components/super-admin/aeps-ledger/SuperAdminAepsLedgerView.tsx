"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { SortingState } from "@tanstack/react-table";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { AepsLedgerFilters } from "@/components/super-admin/aeps-ledger/AepsLedgerFilters";
import { AepsLedgerTable } from "@/components/super-admin/aeps-ledger/AepsLedgerTable";
import { AepsLedgerExport } from "@/components/super-admin/aeps-ledger/AepsLedgerExport";
import { AepsLedgerSkeleton } from "@/components/super-admin/aeps-ledger/AepsLedgerSkeleton";
import { useSuperAdminAepsLedger } from "@/hooks/useSuperAdminAepsLedger";
import {
  fetchAllSuperAdminAepsLedger,
  toAepsLedgerExportRows,
} from "@/services/super-admin-aeps-ledger.service";
import { fetchWalletLedgerRetailers } from "@/services/walletLedgerApi";
import { reportFilename } from "@/lib/reportExport";
import { exportToCSV, exportToExcel } from "@/utils/export";
import { cn } from "@/lib/utils";
import {
  AepsLedgerFiltersState,
  AepsLedgerSortBy,
} from "@/types/super-admin-aeps-ledger";

const DEFAULT_FILTERS: AepsLedgerFiltersState = {
  search: "",
  retailerId: "",
  retailerCode: "",
  mobile: "",
  ledgerNo: "",
  referenceId: "",
  rrn: "",
  service: "",
  status: "",
  fromDate: "",
  toDate: "",
};

const SORT_MAP: Record<string, AepsLedgerSortBy> = {
  createdAt: "createdAt",
  retailerName: "retailerName",
  ledgerNo: "ledgerNo",
  txnAmount: "txnAmount",
  amount: "txnAmount",
  closingBalance: "closingBalance",
};

interface SuperAdminAepsLedgerViewProps {
  hasAccess: boolean;
}

export function SuperAdminAepsLedgerView({
  hasAccess,
}: SuperAdminAepsLedgerViewProps) {
  const [filters, setFilters] = useState<AepsLedgerFiltersState>(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [exportLoading, setExportLoading] = useState(false);
  const [retailerOptions, setRetailerOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "", label: "All Retailers" }]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPageIndex(0);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchWalletLedgerRetailers("super_admin");
        if (cancelled) return;
        setRetailerOptions([
          { value: "", label: "All Retailers" },
          ...list.map((r) => ({
            value: r.id,
            label: r.label || r.name,
          })),
        ]);
      } catch {
        // keep All Retailers only
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortBy = SORT_MAP[sorting[0]?.id || "createdAt"] || "createdAt";
  const sortOrder = sorting[0]?.desc === false ? "asc" : "desc";

  const queryParams = useMemo(
    () => ({
      page: pageIndex + 1,
      limit: pageSize,
      search: debouncedSearch || undefined,
      retailerId: filters.retailerId || undefined,
      retailerCode: filters.retailerCode.trim() || undefined,
      mobile: filters.mobile.trim() || undefined,
      ledgerNo: filters.ledgerNo.trim() || undefined,
      referenceId: filters.referenceId.trim() || undefined,
      rrn: filters.rrn.trim() || undefined,
      service: filters.service || undefined,
      status: filters.status || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    }),
    [
      pageIndex,
      pageSize,
      debouncedSearch,
      filters.retailerId,
      filters.retailerCode,
      filters.mobile,
      filters.ledgerNo,
      filters.referenceId,
      filters.rrn,
      filters.service,
      filters.status,
      filters.fromDate,
      filters.toDate,
      sortBy,
      sortOrder,
    ]
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useSuperAdminAepsLedger(queryParams, hasAccess);

  const rows = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, data?.pagination.totalPages ?? 1);

  const handleFiltersChange = (next: AepsLedgerFiltersState) => {
    setFilters(next);
    setPageIndex(0);
  };

  const exportParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      retailerId: filters.retailerId || undefined,
      retailerCode: filters.retailerCode.trim() || undefined,
      mobile: filters.mobile.trim() || undefined,
      ledgerNo: filters.ledgerNo.trim() || undefined,
      referenceId: filters.referenceId.trim() || undefined,
      rrn: filters.rrn.trim() || undefined,
      service: filters.service || undefined,
      status: filters.status || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    }),
    [
      debouncedSearch,
      filters,
      sortBy,
      sortOrder,
    ]
  );

  const handleExport = async (format: "csv" | "excel") => {
    try {
      setExportLoading(true);
      const records = await fetchAllSuperAdminAepsLedger(exportParams);
      if (!records.length) {
        toast.error("No AEPS ledger records to export");
        return;
      }
      const exportRows = toAepsLedgerExportRows(records);
      const filename = reportFilename("aeps-ledger");
      if (format === "excel") {
        exportToExcel(exportRows, filename, "AEPS Ledger");
        toast.success(`Excel downloaded (${records.length} records)`);
      } else {
        exportToCSV(exportRows, filename);
        toast.success(`CSV downloaded (${records.length} records)`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="page-container flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-red/10 text-accent-red">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
          <p className="mt-2 text-sm text-muted">
            AEPS Ledger is restricted to Super Admin only.
          </p>
        </Card>
      </div>
    );
  }

  const showInitialSkeleton = isLoading && !data;

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Super Admin"
        title="AEPS Wallet Ledger"
        subtitle="View and manage all retailer AEPS transactions."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AepsLedgerExport
              loading={exportLoading}
              disabled={isLoading}
              onExportCsv={() => void handleExport("csv")}
              onExportExcel={() => void handleExport("excel")}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={cn("size-4", isFetching && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        }
      />

      <Card>
        <AepsLedgerFilters
          value={filters}
          onChange={handleFiltersChange}
          retailerOptions={retailerOptions}
          resultsCount={total}
        />

        {isError ? (
          <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-6 text-center">
            <p className="text-sm text-accent-red">
              {error instanceof Error
                ? error.message
                : "Failed to load AEPS ledger"}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        ) : showInitialSkeleton ? (
          <AepsLedgerSkeleton />
        ) : !isLoading && rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-base font-semibold text-foreground">
              No AEPS Ledger Found
            </p>
            <p className="mt-1 text-sm text-muted">
              Try adjusting filters or date range. Only AEPS transactions are
              shown here.
            </p>
          </div>
        ) : (
          <AepsLedgerTable
            rows={rows}
            isLoading={isLoading || isFetching}
            pageIndex={pageIndex}
            pageCount={totalPages}
            pageSize={pageSize}
            totalRows={total}
            onPageChange={setPageIndex}
            onPageSizeChange={(limit) => {
              setPageSize(limit);
              setPageIndex(0);
            }}
            sorting={sorting}
            onSortingChange={(updater) => {
              const next =
                typeof updater === "function" ? updater(sorting) : updater;
              const first = next[0];
              if (!first) return;
              if (!SORT_MAP[first.id]) return;
              setSorting([first]);
              setPageIndex(0);
            }}
          />
        )}
      </Card>
    </div>
  );
}
