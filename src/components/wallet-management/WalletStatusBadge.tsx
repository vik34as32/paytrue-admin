"use client";

import { cn } from "@/lib/utils";

interface WalletStatusBadgeProps {
  status: string;
  className?: string;
}

function resolveStatus(status: string): {
  label: string;
  className: string;
} {
  const key = status.toUpperCase();
  if (key === "ACTIVE") {
    return {
      label: "Active",
      className:
        "bg-emerald-100 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300",
    };
  }
  if (key === "SUSPENDED" || key === "BLOCKED") {
    return {
      label: key === "BLOCKED" ? "Blocked" : "Blocked",
      className:
        "bg-red-100 text-red-700 ring-red-200/70 dark:bg-red-900/30 dark:text-red-300",
    };
  }
  if (key === "INACTIVE") {
    return {
      label: "Inactive",
      className:
        "bg-gray-100 text-gray-600 ring-gray-200/70 dark:bg-gray-800 dark:text-gray-300",
    };
  }
  return {
    label: status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    className:
      "bg-amber-100 text-amber-700 ring-amber-200/70 dark:bg-amber-900/30 dark:text-amber-300",
  };
}

export function WalletStatusBadge({
  status,
  className,
}: WalletStatusBadgeProps) {
  const resolved = resolveStatus(status || "PENDING");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
        resolved.className,
        className
      )}
    >
      {resolved.label}
    </span>
  );
}

interface WalletVerificationBadgeProps {
  status: string;
  className?: string;
}

export function WalletVerificationBadge({
  status,
  className,
}: WalletVerificationBadgeProps) {
  if (!status?.trim()) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-muted ring-1 ring-border",
          className
        )}
      >
        —
      </span>
    );
  }

  const key = status.toUpperCase();
  const styles =
    key === "VERIFIED"
      ? "bg-emerald-100 text-emerald-700 ring-emerald-200/70"
      : key === "REJECTED"
        ? "bg-red-100 text-red-700 ring-red-200/70"
        : "bg-amber-100 text-amber-700 ring-amber-200/70";

  const label =
    key === "VERIFIED"
      ? "Verified"
      : key === "REJECTED"
        ? "Rejected"
        : "Pending";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}
