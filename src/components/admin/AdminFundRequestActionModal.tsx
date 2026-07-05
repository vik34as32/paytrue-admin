"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/modals/Modal";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { AdminFundRequestRecord } from "@/types/admin";
import { formatCurrency } from "@/lib/utils";

const actionSchema = z.object({
  remarks: z.string().min(1, "Remarks are required"),
});

const approveSchema = z.object({
  remarks: z.string().optional(),
});

type ActionFormValues = z.infer<typeof actionSchema>;

interface AdminFundRequestActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AdminFundRequestRecord | null;
  action: "approve" | "reject";
  isSubmitting?: boolean;
  onSubmit: (remarks: string) => void;
}

function getRequesterLabel(request: AdminFundRequestRecord | null): string {
  if (!request) return "—";
  return (
    request.requesterName ||
    request.userName ||
    request.requesterMobile ||
    request.requesterId ||
    "User"
  );
}

function formatUserTypeLabel(type?: string): string {
  if (!type) return "—";
  return type.replace(/_/g, " ");
}

export function AdminFundRequestActionModal({
  isOpen,
  onClose,
  request,
  action,
  isSubmitting = false,
  onSubmit,
}: AdminFundRequestActionModalProps) {
  const isReject = action === "reject";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActionFormValues>({
    resolver: zodResolver(isReject ? actionSchema : approveSchema),
    defaultValues: { remarks: "" },
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ remarks: "" });
    }
  }, [isOpen, reset]);

  const handleFormSubmit = handleSubmit((values) => {
    onSubmit(values.remarks?.trim() || "");
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReject ? "Reject Fund Request" : "Approve Fund Request"}
      subtitle={
        request
          ? `${formatCurrency(request.amount)} from ${getRequesterLabel(request)}`
          : undefined
      }
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={isReject ? "danger" : "primary"}
            onClick={() => void handleFormSubmit()}
            isLoading={isSubmitting}
          >
            {isReject ? "Reject Request" : "Approve Request"}
          </Button>
        </div>
      }
    >
      {request && (
        <div className="mb-4 space-y-2 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm">
          <p>
            <span className="text-muted">Requester:</span>{" "}
            <span className="font-medium">{getRequesterLabel(request)}</span>
          </p>
          <p>
            <span className="text-muted">User Type:</span>{" "}
            <span className="font-medium">
              {formatUserTypeLabel(request.requesterType || request.userType)}
            </span>
          </p>
          <p>
            <span className="text-muted">Amount:</span>{" "}
            <span className="font-semibold text-primary">
              {formatCurrency(request.amount)}
            </span>
          </p>
          {request.remarks && (
            <p>
              <span className="text-muted">User Remarks:</span>{" "}
              {request.remarks}
            </p>
          )}
          {!isReject && (
            <p className="text-xs text-muted">
              Approving will deduct this amount from your wallet and credit the
              requester&apos;s wallet.
            </p>
          )}
        </div>
      )}

      <Textarea
        label={isReject ? "Rejection Remarks" : "Approval Remarks (optional)"}
        placeholder={
          isReject
            ? "Reason for rejecting this fund request..."
            : "Optional note for this approval..."
        }
        error={errors.remarks?.message}
        {...register("remarks")}
      />
    </Modal>
  );
}
