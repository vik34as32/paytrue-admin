"use client";

import { useCallback, useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { AdminFundRequestForm } from "@/components/admin/AdminFundRequestForm";
import {
  AdminListFilters,
  AdminListFiltersValue,
} from "@/components/admin/AdminListFilters";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminFundRequests } from "@/store/api/adminModuleApi";
import { selectAdminFundRequests } from "@/store/selectors/adminSelectors";
import { AdminFundRequestRecord } from "@/types/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

export function AdminFundRequestsView() {
  const dispatch = useAppDispatch();
  const { data, total, isLoading, error } = useAppSelector(selectAdminFundRequests);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminListFiltersValue>({});

  const loadData = useCallback(() => {
    dispatch(
      fetchAdminFundRequests({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
    );
  }, [dispatch, pageIndex, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: ColumnDef<AdminFundRequestRecord, unknown>[] = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.createdAt || ""),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.amount)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            (row.original.status?.toLowerCase() as
              | "success"
              | "pending"
              | "rejected") || "default"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: "remarks", header: "Remarks" },
  ];

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Admin"
        title="Fund Requests"
        subtitle="Request balance from super admin and track status"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="New Fund Request"
            subtitle="Submit a request to super admin for wallet top-up"
          />
          <AdminFundRequestForm onSuccess={loadData} />
        </Card>
        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-card">
          <CardHeader
            title="How it works"
            subtitle="Admin cannot add balance directly"
          />
          <ul className="list-inside list-disc space-y-2 text-sm text-muted">
            <li>Submit amount and remarks</li>
            <li>Super admin reviews pending requests</li>
            <li>Approved requests credit your wallet</li>
          </ul>
        </Card>
      </div>
      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}
      <Card>
        <CardHeader title="Fund Request History" />
        <AdminListFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPageIndex(0);
          }}
          showDateRange
        />
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search fund requests..."
          onSearch={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          manualPagination
          pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={PAGE_SIZE}
        />
      </Card>
    </div>
  );
}
