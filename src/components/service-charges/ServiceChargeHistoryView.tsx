"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import { ServiceChargeStatusBadge } from "@/components/service-charges/ServiceChargeStatusBadge";
import {
  useServiceChargeDetail,
  useServiceChargeHistory,
  useServiceChargePlanHistory,
} from "@/hooks/useServiceCharges";
import {
  formatRoleLabel,
  toHistoryDisplayDate,
} from "@/lib/serviceChargeFormat";
import { cn, formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { FILTER_ROLE_OPTIONS } from "@/schemas/service-charge.schema";
import { ServiceChargeHistoryRecord } from "@/types/serviceCharge";

const PAGE_SIZE = 20;

const HISTORY_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
  { value: "PENDING", label: "Pending" },
  { value: "SKIPPED", label: "Skipped" },
];

interface ServiceChargeHistoryViewProps {
  planId?: string;
}

export function ServiceChargeHistoryView({
  planId,
}: ServiceChargeHistoryViewProps) {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = {
    page: pageIndex + 1,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: status || undefined,
    role: role || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const planQuery = useServiceChargeDetail(planId || null, !!planId);
  const globalHistory = useServiceChargeHistory(params, !planId);
  const planHistory = useServiceChargePlanHistory(planId || null, params, !!planId);

  const query = planId ? planHistory : globalHistory;
  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, query.data?.totalPages ?? 1);

  const columns = useMemo<ColumnDef<ServiceChargeHistoryRecord, unknown>[]>(
    () => [
      {
        id: "executionDate",
        header: "Execution Date",
        cell: ({ row }) => toHistoryDisplayDate(row.original),
      },
      ...(!planId
        ? [
            {
              id: "planName",
              header: "Plan",
              cell: ({
                row,
              }: {
                row: { original: ServiceChargeHistoryRecord };
              }) => row.original.planName || "—",
            } as ColumnDef<ServiceChargeHistoryRecord, unknown>,
          ]
        : []),
      {
        id: "userName",
        header: "User Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.userName || "—"}</span>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => formatRoleLabel(row.original.role),
      },
      {
        id: "amount",
        header: "Amount",
        meta: { align: "right" as const },
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <ServiceChargeStatusBadge status={row.original.status} />
        ),
      },
      {
        id: "billingCycle",
        header: "Billing Cycle",
        cell: ({ row }) => row.original.billingCycle || "—",
      },
      {
        id: "failureReason",
        header: "Failure Reason",
        cell: ({ row }) => (
          <span className="max-w-[220px] truncate block text-muted">
            {row.original.failureReason || "—"}
          </span>
        ),
      },
    ],
    [planId]
  );

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Finance"
        title={
          planId
            ? `${planQuery.data?.planName || "Plan"} · Charge History`
            : "Charge History"
        }
        subtitle="Execution history for service charge plans"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  planId
                    ? `${ROUTES.superAdminServiceCharges}/${planId}`
                    : ROUTES.superAdminServiceCharges
                )
              }
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw
                className={cn("size-4", query.isFetching && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        }
      />

      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Input
            label="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIndex(0);
            }}
            placeholder="User name, plan..."
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPageIndex(0);
            }}
            options={HISTORY_STATUS_OPTIONS}
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPageIndex(0);
            }}
            options={FILTER_ROLE_OPTIONS}
          />
          <Input
            label="From"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPageIndex(0);
            }}
          />
          <Input
            label="To"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPageIndex(0);
            }}
          />
        </div>

        {query.isError ? (
          <div className="mb-4 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {query.error instanceof Error
              ? query.error.message
              : "Failed to load history"}
          </div>
        ) : null}

        {!query.isLoading && rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
            <p className="font-semibold text-foreground">No charge history</p>
            <p className="mt-1 text-sm text-muted">
              Executions will appear here after a plan runs.
            </p>
          </div>
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            isLoading={query.isLoading}
            hideSearch
            manualPagination
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            pageSize={PAGE_SIZE}
            totalRows={total}
            tone="report"
            minTableWidth={1100}
          />
        )}
      </Card>
    </div>
  );
}
