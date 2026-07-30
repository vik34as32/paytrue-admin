"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { VerificationInfo } from "@/components/verification/VerificationInfo";
import { VerificationHistory } from "@/components/verification/VerificationHistory";
import { VerificationSkeleton } from "@/components/verification/VerificationSkeleton";
import { VerificationActions } from "@/components/verification/VerificationActions";
import { VerifyUserDialog } from "@/components/verification/VerifyUserDialog";
import { RejectUserDialog } from "@/components/verification/RejectUserDialog";
import {
  useRejectUser,
  useVerification,
  useVerifyUser,
} from "@/hooks/useIdVerification";
import { getUserVerificationStatus } from "@/lib/idVerification";
import { UserVerificationInfo } from "@/types/idVerification";

interface VerificationCardProps {
  userId: string;
  userName?: string;
  /** Fallback status from list/detail payload while query loads */
  fallbackStatus?: string | null;
  canManage?: boolean;
  onUpdated?: () => void;
  showHistory?: boolean;
}

function StatusIcon({ status }: { status: UserVerificationInfo["status"] }) {
  if (status === "VERIFIED") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
        <CheckCircle2 className="h-6 w-6" aria-hidden />
      </div>
    );
  }
  if (status === "REJECTED") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
        <ShieldAlert className="h-6 w-6" aria-hidden />
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
      <AlertCircle className="h-6 w-6" aria-hidden />
    </div>
  );
}

export function VerificationCard({
  userId,
  userName,
  fallbackStatus,
  canManage = true,
  onUpdated,
  showHistory = true,
}: VerificationCardProps) {
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const query = useVerification(userId, Boolean(userId));
  const verifyMutation = useVerifyUser();
  const rejectMutation = useRejectUser();

  const submitting = verifyMutation.isPending || rejectMutation.isPending;
  const status =
    query.data?.status ||
    getUserVerificationStatus({ verificationStatus: fallbackStatus });

  if (query.isLoading && !query.data) {
    return <VerificationSkeleton />;
  }

  if (query.isError && !query.data) {
    return (
      <Card className="border-accent-red/30 bg-accent-red/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Verification Status
            </h3>
            <p className="mt-1 text-sm text-accent-red">
              {query.error instanceof Error
                ? query.error.message
                : "Failed to load verification"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const info = query.data;

  return (
    <>
      <Card className="overflow-hidden border-border/80 p-0 shadow-[0_12px_40px_-28px_rgba(27,37,89,0.45)]">
        <div className="border-b border-border/70 bg-gradient-to-r from-primary/5 via-card to-[#05CD99]/5 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <StatusIcon status={status} />
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Verification Status
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  Identity document review for this user
                </p>
              </div>
            </div>
            <VerificationBadge status={status} />
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          {status === "VERIFIED" && info ? (
            <VerificationInfo
              variant="verified"
              actor={info.verifiedBy}
              at={info.verifiedAt}
              remark={info.remark}
            />
          ) : null}

          {status === "REJECTED" && info ? (
            <VerificationInfo
              variant="rejected"
              actor={info.rejectedBy}
              at={info.rejectedAt}
              reason={info.reason}
            />
          ) : null}

          {status === "PENDING" ? (
            <>
              <p className="text-sm text-muted">
                Documents are awaiting review. Verify or reject after checking
                KYC images.
              </p>
              <VerificationActions
                status={status}
                canManage={canManage}
                disabled={submitting}
                onVerify={() => setVerifyOpen(true)}
                onReject={() => setRejectOpen(true)}
              />
            </>
          ) : null}

          {showHistory && info?.history?.length ? (
            <div className="border-t border-border/60 pt-4">
              <h4 className="mb-2 text-sm font-bold text-foreground">
                Verification History
              </h4>
              <VerificationHistory items={info.history} />
            </div>
          ) : null}
        </div>
      </Card>

      <VerifyUserDialog
        isOpen={verifyOpen && status === "PENDING"}
        onClose={() => setVerifyOpen(false)}
        userName={userName}
        isSubmitting={verifyMutation.isPending}
        onConfirm={async (remark) => {
          await verifyMutation.mutateAsync({ userId, payload: { remark } });
          setVerifyOpen(false);
          onUpdated?.();
        }}
      />

      <RejectUserDialog
        isOpen={rejectOpen && status === "PENDING"}
        onClose={() => setRejectOpen(false)}
        userName={userName}
        isSubmitting={rejectMutation.isPending}
        onConfirm={async (reason) => {
          await rejectMutation.mutateAsync({ userId, payload: { reason } });
          setRejectOpen(false);
          onUpdated?.();
        }}
      />
    </>
  );
}
