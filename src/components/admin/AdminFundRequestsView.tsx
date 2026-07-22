"use client";

import { useCallback, useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { toastBackendSuccess } from "@/lib/toast";
import { getThrownErrorMessage } from "@/lib/api/messages";
import { Check, X, RefreshCw, RotateCcw } from "lucide-react";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { BankLogoName } from "@/components/common/BankLogoName";
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

function formatUserType(type?: string): string {
  if (!type) return "—";
  return type.replace(/_/g, " ");
}

function statusVariant(
  status?: string
): "success" | "pending" | "rejected" | "default" {
  const value = status?.toLowerCase();
  if (value === "approved" || value === "success") return "success";
  if (value === "pending") return "pending";
  if (value === "rejected") return "rejected";
  return "default";
}

function formatOnlyDate(value?: string): string {
  if (!value) return "—";
  try {
    return formatDate(value, "dd MMM yyyy");
  } catch {
    return "—";
  }
}

function formatOnlyTime(value?: string): string {
  if (!value) return "—";
  try {
    return formatDate(value, "hh:mm a");
  } catch {
    return "—";
  }
}

export function AdminFundRequestsView() {
  const dispatch = useAppDispatch();
  const { data, total, isLoading, error } = useAppSelector(
    selectAdminFundRequests
  );
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
        sortBy: filters.sortBy || "createdAt",
        sortOrder: filters.sortOrder || "desc",
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

  const handleResetFilters = () => {
    setFilters({});
    setSearch("");
    setPageIndex(0);
  };

  const handleActionSubmit = async (remarks: string) => {
    if (!actionRequest) return;

    if (!remarks.trim()) {
      toast.error("Remarks are required");
      return;
    }

    const result =
      actionType === "approve"
        ? await dispatch(
            approveAdminFundRequest({
              id: actionRequest.id,
              remarks: remarks.trim(),
            })
          )
        : await dispatch(
            rejectAdminFundRequest({
              id: actionRequest.id,
              remarks: remarks.trim(),
            })
          );

    const fulfilled =
      actionType === "approve"
        ? approveAdminFundRequest.fulfilled.match(result)
        : rejectAdminFundRequest.fulfilled.match(result);

    if (fulfilled) {
      toastBackendSuccess(
        result.payload,
        actionType === "approve"
          ? "Fund request approved successfully"
          : "Fund request rejected"
      );
      closeAction();
      loadData();
      return;
    }

    toast.error(
      getThrownErrorMessage(result.payload, "Action failed")
    );
  };

  const columns: ColumnDef<AdminFundRequestRecord, unknown>[] = [
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => formatOnlyDate(row.original.createdAt),
    },
    {
      id: "time",
      header: "Time",
      cell: ({ row }) => formatOnlyTime(row.original.createdAt),
    },
    {
      id: "firstName",
      header: "First Name",
      cell: ({ row }) =>
        row.original.requesterFirstName ||
        row.original.requesterName?.split(" ")[0] ||
        "—",
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
      id: "userCode",
      header: "User Code",
      cell: ({ row }) => row.original.requesterUserCode || "—",
    },
    {
      id: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="max-w-[180px] truncate block">
          {row.original.requesterEmail || "—"}
        </span>
      ),
    },
    {
      id: "mobile",
      header: "Mobile",
      cell: ({ row }) => row.original.requesterMobile || "—",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "paymentMode",
      header: "Payment Mode",
      cell: ({ row }) => row.original.paymentMode || "—",
    },
    {
      accessorKey: "bankName",
      header: "Bank Name",
      cell: ({ row }) => (
        <BankLogoName
          bankName={row.original.bankName}
          className="min-w-[140px]"
        />
      ),
    },
    {
      accessorKey: "accountHolderName",
      header: "Account Holder",
      cell: ({ row }) => row.original.accountHolderName || "—",
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.accountNumber || "—"}
        </span>
      ),
    },
    {
      id: "imageUrl",
      header: "Image",
      cell: ({ row }) =>
        row.original.imageUrl ? (
          <a
            href={row.original.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
            title="View receipt image"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.original.imageUrl}
              alt="Receipt"
              className="h-10 w-10 rounded-lg border border-border object-cover"
            />
          </a>
        ) : (
          <span className="text-sm text-muted">—</span>
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "remarks",
      header: "User Remarks",
      cell: ({ row }) => row.original.remarks || "—",
    },
    {
      accessorKey: "adminRemarks",
      header: "Admin Remarks",
      cell: ({ row }) => row.original.adminRemarks || "—",
    },
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
              title="Approve"
            >
              <Check className="h-4 w-4 text-emerald-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Reject fund request"
              disabled={fundRequestActionLoading}
              onClick={() => openAction(row.original, "reject")}
              title="Reject"
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
        action={
          <Button
            variant="outline"
            onClick={() => loadData()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="All Fund Requests"
          subtitle="Pending, approved and rejected requests with filters"
          action={
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </Button>
          }
        />
        <AdminListFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPageIndex(0);
          }}
          showStatus={false}
          showFundRequestStatus
          showUserType
          showDateRange
          showSort
        />
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search by requester, remarks..."
          onSearch={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          manualPagination
          pageCount={Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))}
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
