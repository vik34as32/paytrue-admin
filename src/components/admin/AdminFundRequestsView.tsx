"use client";

import { useCallback, useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { AdminFundRequestActionModal } from "@/components/admin/AdminFundRequestActionModal";
import {
  AdminListFilters,
  AdminListFiltersValue,
} from "@/components/admin/AdminListFilters";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  approveAdminFundRequest,
  fetchAdminFundRequests,
  rejectAdminFundRequest,
} from "@/store/api/adminModuleApi";
import { selectAdminFundRequests } from "@/store/selectors/adminSelectors";
import { AdminFundRequestRecord } from "@/types/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

function isPendingStatus(status?: string): boolean {
  return status?.toUpperCase() === "PENDING";
}

function getRequesterName(request: AdminFundRequestRecord): string {
  return (
    request.requesterName ||
    request.userName ||
    request.requesterMobile ||
    "—"
  );
}

function formatUserType(type?: string): string {
  if (!type) return "—";
  return type.replace(/_/g, " ");
}

export function AdminFundRequestsView() {
  const dispatch = useAppDispatch();
  const { data, total, isLoading, error } = useAppSelector(selectAdminFundRequests);
  const { fundRequestActionLoading } = useAppSelector(
    (state) => state.adminModule
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminListFiltersValue>({});
  const [actionRequest, setActionRequest] =
    useState<AdminFundRequestRecord | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  const loadData = useCallback(() => {
    dispatch(
      fetchAdminFundRequests({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: filters.status,
        userType: filters.userType,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
    );
  }, [dispatch, pageIndex, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAction = (
    request: AdminFundRequestRecord,
    type: "approve" | "reject"
  ) => {
    setActionRequest(request);
    setActionType(type);
  };

  const closeAction = () => {
    setActionRequest(null);
  };

  const handleActionSubmit = async (remarks: string) => {
    if (!actionRequest) return;

    const result =
      actionType === "approve"
        ? await dispatch(
            approveAdminFundRequest({
              id: actionRequest.id,
              remarks: remarks || undefined,
            })
          )
        : await dispatch(
            rejectAdminFundRequest({
              id: actionRequest.id,
              remarks,
            })
          );

    const fulfilled =
      actionType === "approve"
        ? approveAdminFundRequest.fulfilled.match(result)
        : rejectAdminFundRequest.fulfilled.match(result);

    if (fulfilled) {
      toast.success(
        actionType === "approve"
          ? "Fund request approved successfully"
          : "Fund request rejected"
      );
      closeAction();
      loadData();
      return;
    }

    toast.error((result.payload as string) || "Action failed");
  };

  const columns: ColumnDef<AdminFundRequestRecord, unknown>[] = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.createdAt || ""),
    },
    {
      id: "requester",
      header: "Requester",
      cell: ({ row }) => (
        <span className="font-medium">{getRequesterName(row.original)}</span>
      ),
    },
    {
      id: "userType",
      header: "User Type",
      cell: ({ row }) => (
        <Badge variant="default">
          {formatUserType(row.original.requesterType || row.original.userType)}
        </Badge>
      ),
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
    { accessorKey: "remarks", header: "User Remarks" },
    { accessorKey: "adminRemarks", header: "Admin Remarks" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) =>
        isPendingStatus(row.original.status) ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Approve fund request"
              disabled={fundRequestActionLoading}
              onClick={() => openAction(row.original, "approve")}
            >
              <Check className="h-4 w-4 text-emerald-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Reject fund request"
              disabled={fundRequestActionLoading}
              onClick={() => openAction(row.original, "reject")}
            >
              <X className="h-4 w-4 text-accent-red" />
            </Button>
          </div>
        ) : (
          <span className="text-sm text-muted">—</span>
        ),
    },
  ];

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Admin"
        title="Fund Requests"
        subtitle="Review and approve fund requests from your network users"
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <Card>
        <CardHeader
          title="Incoming Fund Requests"
          subtitle="Master distributors, distributors, and retailers fund requests"
        />
        <AdminListFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPageIndex(0);
          }}
          showFundRequestStatus
          showUserType
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

      <AdminFundRequestActionModal
        isOpen={!!actionRequest}
        onClose={closeAction}
        request={actionRequest}
        action={actionType}
        isSubmitting={fundRequestActionLoading}
        onSubmit={(remarks) => void handleActionSubmit(remarks)}
      />
    </div>
  );
}
