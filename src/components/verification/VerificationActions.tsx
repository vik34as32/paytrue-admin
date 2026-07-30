"use client";

import { IdVerificationStatus } from "@/types/idVerification";
import {
  ArrowLeftRight,
  CheckCircle2,
  Eye,
  MinusCircle,
  ShieldX,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface VerificationActionsProps {
  status: IdVerificationStatus;
  canManage: boolean;
  disabled?: boolean;
  compact?: boolean;
  onVerify?: () => void;
  onReject?: () => void;
  onViewDetails?: () => void;
  onViewReason?: () => void;
  onTransfer?: () => void;
  onDeduct?: () => void;
}

function IconActionButton({
  label,
  disabled,
  onClick,
  className,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-all active:scale-95",
        className,
        disabled && "pointer-events-none opacity-50"
      )}
    >
      {children}
    </button>
  );
}

export function VerificationActions({
  status,
  canManage,
  disabled,
  onVerify,
  onReject,
  onViewDetails,
  onViewReason,
  onTransfer,
  onDeduct,
}: VerificationActionsProps) {
  if (status === "PENDING") {
    if (!canManage) return null;
    return (
      <div className="inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap">
        <IconActionButton
          label="Verify user"
          disabled={disabled}
          onClick={onVerify}
          className="border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
        >
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
        </IconActionButton>
        <IconActionButton
          label="Reject user"
          disabled={disabled}
          onClick={onReject}
          className="border-rose-200/80 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300"
        >
          <XCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
        </IconActionButton>
      </div>
    );
  }

  if (status === "VERIFIED") {
    if (onTransfer || onDeduct) {
      return (
        <div className="inline-flex flex-nowrap items-center gap-1.5">
          {onTransfer ? (
            <IconActionButton
              label="Transfer balance"
              disabled={disabled}
              onClick={onTransfer}
              className="border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </IconActionButton>
          ) : null}
          {onDeduct ? (
            <IconActionButton
              label="Deduct balance"
              disabled={disabled}
              onClick={onDeduct}
              className="border-rose-200/80 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300"
            >
              <MinusCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
            </IconActionButton>
          ) : null}
        </div>
      );
    }

    if (!onViewDetails) return null;

    return (
      <IconActionButton
        label="View verification details"
        disabled={disabled}
        onClick={onViewDetails}
        className="border-border bg-white text-foreground hover:bg-muted/40"
      >
        <Eye className="h-3.5 w-3.5" strokeWidth={2.25} />
      </IconActionButton>
    );
  }

  return (
    <IconActionButton
      label="View rejection reason"
      disabled={disabled}
      onClick={onViewReason}
      className="border-border bg-white text-foreground hover:bg-muted/40"
    >
      <ShieldX className="h-3.5 w-3.5" strokeWidth={2.25} />
    </IconActionButton>
  );
}
