"use client";

import { cn } from "@/lib/utils";
import {
  normalizeVerificationStatus,
  verificationStatusLabel,
} from "@/lib/idVerification";
import { IdVerificationStatus } from "@/types/idVerification";

interface VerificationBadgeProps {
  status?: IdVerificationStatus | string | null;
  /** Override label — use API status text when available */
  label?: string | null;
  className?: string;
}

/** Pending = yellow outline; Verified = green solid; Rejected = red solid */
export function VerificationBadge({
  status,
  label: labelOverride,
  className,
}: VerificationBadgeProps) {
  const normalized = normalizeVerificationStatus(status);
  const label =
    (labelOverride && labelOverride.trim()) ||
    verificationStatusLabel(normalized);

  const styles: Record<IdVerificationStatus, string> = {
    PENDING:
      "border border-amber-400 bg-transparent text-amber-700 ring-1 ring-amber-200/60 dark:border-amber-500 dark:text-amber-300 dark:ring-amber-800/40",
    VERIFIED:
      "border border-transparent bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 dark:bg-emerald-500",
    REJECTED:
      "border border-transparent bg-rose-600 text-white shadow-sm shadow-rose-600/20 dark:bg-rose-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        styles[normalized],
        className
      )}
      aria-label={`Verification status: ${label}`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          normalized === "PENDING" && "bg-amber-500",
          normalized === "VERIFIED" && "bg-white",
          normalized === "REJECTED" && "bg-white"
        )}
      />
      {label}
    </span>
  );
}
