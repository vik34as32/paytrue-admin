"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2,
  XCircle,
  Wallet,
  UserRound,
  BadgeIndianRupee,
  MessageSquareText,
} from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { AdminFundRequestRecord } from "@/types/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

type ActionFormValues = {
  remarks: string;
};

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

  const validationSchema = useMemo(
    () =>
      z.object({
        remarks: z
          .string()
          .trim()
          .min(3, "Remarks are required (minimum 3 characters)"),
      }),
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActionFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: { remarks: "" },
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ remarks: "" });
    }
  }, [isOpen, action, reset]);

  const handleFormSubmit = handleSubmit((values) => {
    onSubmit(values.remarks.trim());
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => undefined : onClose}
      title={isReject ? "Reject Fund Request" : "Approve Fund Request"}
      subtitle={
        isReject
          ? "Add remarks before rejecting this request"
          : "Add remarks before approving — amount will move from your wallet"
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
            {isReject ? (
              <>
                <XCircle className="h-4 w-4" />
                Reject Request
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Approve Request
              </>
            )}
          </Button>
        </div>
      }
    >
      {request ? (
        <div className="space-y-5">
          <div
            className={`relative overflow-hidden rounded-2xl border p-5 ${
              isReject
                ? "border-accent-red/20 bg-gradient-to-br from-accent-red/10 via-card to-card"
                : "border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    isReject
                      ? "bg-accent-red/15 text-accent-red"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {isReject ? (
                    <XCircle className="h-6 w-6" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Request Amount
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isReject ? "text-accent-red" : "text-primary"
                    }`}
                  >
                    {formatCurrency(request.amount)}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  (request.status?.toLowerCase() as
                    | "pending"
                    | "success"
                    | "rejected"
                    | "default") || "pending"
                }
              >
                {request.status}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <UserRound className="h-3.5 w-3.5" />
                Requester
              </div>
              <p className="font-semibold text-foreground">
                {getRequesterLabel(request)}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {formatUserTypeLabel(request.requesterType || request.userType)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <BadgeIndianRupee className="h-3.5 w-3.5" />
                Requested On
              </div>
              <p className="font-semibold text-foreground">
                {request.createdAt ? formatDate(request.createdAt) : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {request.requesterMobile || "No mobile"}
              </p>
            </div>
          </div>

          {request.remarks ? (
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <MessageSquareText className="h-3.5 w-3.5" />
                User Remarks
              </div>
              <p className="text-sm text-foreground">{request.remarks}</p>
            </div>
          ) : null}

          {!isReject ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-foreground">
              <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p>
                Approving will deduct{" "}
                <span className="font-semibold">
                  {formatCurrency(request.amount)}
                </span>{" "}
                from your wallet and credit the requester. Ensure you have
                sufficient balance.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-accent-red/20 bg-accent-red/10 px-4 py-3 text-sm text-foreground">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent-red" />
              <p>
                Rejecting will mark this request as rejected. The requester will
                see your remarks.
              </p>
            </div>
          )}

          <Textarea
            label={isReject ? "Rejection Remarks *" : "Approval Remarks *"}
            placeholder={
              isReject
                ? "Explain why this fund request is being rejected..."
                : "Add approval remarks (required)..."
            }
            error={errors.remarks?.message}
            {...register("remarks")}
          />
        </div>
      ) : null}
    </Modal>
  );
}
