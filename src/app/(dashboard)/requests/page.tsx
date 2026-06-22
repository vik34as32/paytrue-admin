"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  fetchRequests,
  createBalanceRequest,
  approveBalanceRequest,
  rejectBalanceRequest,
} from "@/store/slices/requestSlice";
import { useRoleAccess } from "@/hooks/useAuth";
import {
  requestAmountSchema,
  requestApprovalSchema,
  requestRejectionSchema,
  RequestAmountFormData,
  RequestApprovalFormData,
  RequestRejectionFormData,
} from "@/validations";
import { DataTable } from "@/components/tables/DataTable";
import { Card, CardHeader } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/modals/Modal";
import { BalanceRequest } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ROLES } from "@/constants";

export default function RequestsPage() {
  const dispatch = useAppDispatch();
  const { requests, isLoading } = useAppSelector((state) => state.requests);
  const { user, canApproveRequests, canRequestBalance } = useRoleAccess();
  const [selectedRequest, setSelectedRequest] = useState<BalanceRequest | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const requestForm = useForm<RequestAmountFormData>({
    resolver: zodResolver(requestAmountSchema),
  });

  const approvalForm = useForm<RequestApprovalFormData>({
    resolver: zodResolver(requestApprovalSchema),
  });

  const rejectionForm = useForm<RequestRejectionFormData>({
    resolver: zodResolver(requestRejectionSchema),
  });

  useEffect(() => {
    dispatch(fetchRequests({ page: 1, pageSize: 50 }));
  }, [dispatch]);

  const handleCreateRequest = async (data: RequestAmountFormData) => {
    if (!user) return;
    const result = await dispatch(
      createBalanceRequest({
        retailerId: user.id,
        amount: data.amount,
        remarks: data.remarks,
      })
    );
    if (createBalanceRequest.fulfilled.match(result)) {
      toast.success("Balance request submitted");
      requestForm.reset();
      dispatch(fetchRequests({ page: 1, pageSize: 50 }));
    }
  };

  const handleApprove = async (data: RequestApprovalFormData) => {
    if (!user || !selectedRequest) return;
    await dispatch(
      approveBalanceRequest({
        requestId: selectedRequest.id,
        approverId: user.id,
        remarks: data.remarks,
      })
    );
    toast.success("Request approved");
    setSelectedRequest(null);
    setAction(null);
    approvalForm.reset();
    dispatch(fetchRequests({ page: 1, pageSize: 50 }));
  };

  const handleReject = async (data: RequestRejectionFormData) => {
    if (!user || !selectedRequest) return;
    await dispatch(
      rejectBalanceRequest({
        requestId: selectedRequest.id,
        rejectorId: user.id,
        reason: data.reason,
      })
    );
    toast.success("Request rejected");
    setSelectedRequest(null);
    setAction(null);
    rejectionForm.reset();
    dispatch(fetchRequests({ page: 1, pageSize: 50 }));
  };

  const columns: ColumnDef<BalanceRequest, unknown>[] = [
    { accessorKey: "id", header: "Request ID" },
    { accessorKey: "retailerName", header: "Retailer" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "approved"
              ? "success"
              : row.original.status === "rejected"
                ? "rejected"
                : "pending"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "currentApproverRole",
      header: "Current Approver",
      cell: ({ row }) => ROLES[row.original.currentApproverRole],
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    ...(canApproveRequests
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: { original: BalanceRequest } }) =>
              row.original.status === "pending" ? (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(row.original);
                      setAction("approve");
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setSelectedRequest(row.original);
                      setAction("reject");
                    }}
                  >
                    Reject
                  </Button>
                </div>
              ) : null,
          } as ColumnDef<BalanceRequest, unknown>,
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Request Management</h1>
        <p className="text-sm text-muted">
          Retailer balance requests with multi-level approval
        </p>
      </div>

      {canRequestBalance && (
        <Card>
          <CardHeader title="Request Balance" subtitle="Submit a new balance request" />
          <form
            onSubmit={requestForm.handleSubmit(handleCreateRequest)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Input
              label="Amount (₹)"
              type="number"
              error={requestForm.formState.errors.amount?.message}
              {...requestForm.register("amount", { valueAsNumber: true })}
            />
            <Input
              label="Remarks"
              error={requestForm.formState.errors.remarks?.message}
              {...requestForm.register("remarks")}
            />
            <div className="sm:col-span-2">
              <Button type="submit">Submit Request</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <DataTable
          data={requests?.data || []}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search requests..."
        />
      </Card>

      <Modal
        isOpen={action === "approve" && !!selectedRequest}
        onClose={() => { setAction(null); setSelectedRequest(null); }}
        title="Approve Request"
      >
        <form onSubmit={approvalForm.handleSubmit(handleApprove)} className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              {...approvalForm.register("verified")}
            />
            I have verified this request
          </label>
          {approvalForm.formState.errors.verified && (
            <p className="text-xs text-accent-red">
              {approvalForm.formState.errors.verified.message}
            </p>
          )}
          <Input
            label="Remarks"
            error={approvalForm.formState.errors.remarks?.message}
            {...approvalForm.register("remarks")}
          />
          <Button type="submit">Confirm Approval</Button>
        </form>
      </Modal>

      <Modal
        isOpen={action === "reject" && !!selectedRequest}
        onClose={() => { setAction(null); setSelectedRequest(null); }}
        title="Reject Request"
      >
        <form onSubmit={rejectionForm.handleSubmit(handleReject)} className="space-y-4">
          <Input
            label="Rejection Reason"
            error={rejectionForm.formState.errors.reason?.message}
            {...rejectionForm.register("reason")}
          />
          <Button type="submit" variant="danger">
            Confirm Rejection
          </Button>
        </form>
      </Modal>
    </div>
  );
}
