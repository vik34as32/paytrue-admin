"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { DataTable } from "@/components/tables/DataTable";
import { ReportExportBar } from "@/components/tables/ReportExportBar";
import { Badge } from "@/components/common/Badge";
import {
  SuperAdminListFilters,
  SuperAdminListFiltersValue,
} from "@/components/super-admin/SuperAdminListFilters";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminFundRequests } from "@/store/api/superAdminApi";
import { selectFundRequests } from "@/store/selectors/superAdminSelectors";
import { ROUTES } from "@/constants";
import { AdminFundRequest } from "@/types/superAdmin";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  downloadReportExcel,
  downloadReportPdf,
  reportFilename,
} from "@/lib/reportExport";

const PAGE_SIZE = 10;

const FUND_REQUEST_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const EXPORT_COLUMNS = [
  { key: "#", label: "#" },
  { key: "date", label: "Date" },
  { key: "requesterName", label: "Requester" },
  { key: "requesterType", label: "Type" },
  { key: "mobile", label: "Mobile" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "paymentMode", label: "Payment Mode" },
  { key: "bankName", label: "Bank" },
  { key: "utr", label: "UTR / Ref" },
  { key: "remarks", label: "Remarks" },
  { key: "adminName", label: "Admin" },
];

function statusVariant(
  status?: string
): "success" | "pending" | "rejected" | "default" {
  const value = (status || "").toLowerCase();
  if (value === "approved" || value === "success") return "success";
  if (value === "pending") return "pending";
  if (value === "rejected" || value === "failed") return "rejected";
  return "default";
}

function formatRole(value?: string): string {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}

function toExportRows(items: AdminFundRequest[]) {
  return items.map((item, index) => ({
    "#": index + 1,
    date: formatDate(item.createdAt || item.updatedAt || null),
    requesterName: item.requesterName || item.userName || "—",
    requesterType: formatRole(item.requesterType || item.userType),
    mobile: item.requesterMobile || "—",
    amount: formatCurrency(Number(item.amount) || 0),
    status: item.status || "—",
    paymentMode: item.paymentMode || item.fundingMode || "—",
    bankName: item.bankName || "—",
    utr: item.utr || item.reference || item.referenceNumber || "—",
    remarks: item.remarks || "—",
    adminName: item.adminName || "—",
  }));
}

export default function SuperAdminFundRequestsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const { data, total, isLoading, error } = useAppSelector(selectFundRequests);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<SuperAdminListFiltersValue>({});
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      350
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(() => {
    dispatch(
      fetchAdminFundRequests({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: filters.status || undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
    );
  }, [dispatch, pageIndex, debouncedSearch, filters]);

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) return;
    loadData();
  }, [hasSuperAdminWalletAccess, loadData]);

  const handleExportExcel = () => {
    try {
      setExportLoading(true);
      if (!data.length) {
        toast.error("No records available to export");
        return;
      }
      downloadReportExcel(
        toExportRows(data),
        reportFilename("fund-requests"),
        "Fund Requests"
      );
      toast.success("Excel downloaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPdf = () => {
    try {
      setExportLoading(true);
      if (!data.length) {
        toast.error("No records available to export");
        return;
      }
      downloadReportPdf({
        title: "Fund Requests",
        subtitle: "Super Admin fund requests report",
        filename: reportFilename("fund-requests"),
        columns: EXPORT_COLUMNS,
        rows: toExportRows(data),
      });
      toast.success("PDF print dialog opened");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<AdminFundRequest, unknown>[]>(
    () => [
      {
        id: "sr",
        header: "Sr No.",
        enableSorting: false,
        size: 70,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted">
            {pageIndex * PAGE_SIZE + row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums">
            {formatDate(row.original.createdAt || row.original.updatedAt || null)}
          </span>
        ),
      },
      {
        id: "requester",
        header: "Requester",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-semibold text-foreground">
              {row.original.requesterName || row.original.userName || "—"}
            </p>
            <p className="font-mono text-xs text-muted">
              {row.original.requesterUserCode || "—"}
            </p>
          </div>
        ),
      },
      {
        id: "requesterType",
        header: "Type",
        enableSorting: false,
        cell: ({ row }) =>
          formatRole(row.original.requesterType || row.original.userType),
      },
      {
        id: "mobile",
        header: "Mobile",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.requesterMobile || "—"}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
            {formatCurrency(Number(row.original.amount) || 0)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {row.original.status || "—"}
          </Badge>
        ),
      },
      {
        id: "paymentMode",
        header: "Payment Mode",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.paymentMode || row.original.fundingMode || "—",
      },
      {
        id: "bank",
        header: "Bank",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              {row.original.bankName || "—"}
            </p>
            <p className="font-mono text-xs text-muted">
              {row.original.utr ||
                row.original.reference ||
                row.original.referenceNumber ||
                "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className="block max-w-[180px] truncate"
            title={row.original.remarks || ""}
          >
            {row.original.remarks || "—"}
          </span>
        ),
      },
      {
        accessorKey: "adminName",
        header: "Admin",
        enableSorting: false,
        cell: ({ row }) => row.original.adminName || "—",
      },
    ],
    [pageIndex]
  );

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Fund Requests"
        subtitle="All fund requests from GET /super-admin/fund-requests"
        action={
          <Button
            variant="outline"
            onClick={() => loadData()}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        }
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
          showDateRange
          showStatus
          showSort={false}
          statusOptions={FUND_REQUEST_STATUS_OPTIONS}
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          searchPlaceholder="Search name, mobile, UTR..."
          resultsCount={total}
          resultsLabel="requests"
        />

        <ReportExportBar
          className="mb-4"
          loading={exportLoading || isLoading}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
        />

        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          hideSearch
          manualPagination
          pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={PAGE_SIZE}
          totalRows={total}
          minTableWidth={1200}
          tone="report"
          stickyHeader
        />
      </Card>
    </div>
  );
}
