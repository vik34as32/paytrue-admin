"use client";

import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN:
    "bg-slate-900 text-white ring-slate-700 dark:bg-slate-100 dark:text-slate-900",
  ADMIN: "bg-red-100 text-red-700 ring-red-200/70 dark:bg-red-900/30 dark:text-red-300",
  MASTER_DISTRIBUTOR:
    "bg-purple-100 text-purple-700 ring-purple-200/70 dark:bg-purple-900/30 dark:text-purple-300",
  DISTRIBUTOR:
    "bg-orange-100 text-orange-700 ring-orange-200/70 dark:bg-orange-900/30 dark:text-orange-300",
  RETAILER:
    "bg-blue-100 text-blue-700 ring-blue-200/70 dark:bg-blue-900/30 dark:text-blue-300",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MASTER_DISTRIBUTOR: "Master Distributor",
  DISTRIBUTOR: "Distributor",
  RETAILER: "Retailer",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:
    "bg-emerald-100 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300",
  INACTIVE:
    "bg-gray-100 text-gray-600 ring-gray-200/70 dark:bg-gray-800 dark:text-gray-300",
  SUSPENDED:
    "bg-red-100 text-red-700 ring-red-200/70 dark:bg-red-900/30 dark:text-red-300",
  BLOCKED:
    "bg-red-100 text-red-700 ring-red-200/70 dark:bg-red-900/30 dark:text-red-300",
  PENDING:
    "bg-amber-100 text-amber-700 ring-amber-200/70 dark:bg-amber-900/30 dark:text-amber-300",
};

interface WalletBadgeProps {
  type: "role" | "status";
  value: string;
  className?: string;
}

export function WalletBadge({ type, value, className }: WalletBadgeProps) {
  const key = (value || "").toUpperCase();

  if (type === "role") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
          ROLE_STYLES[key] || "bg-slate-100 text-slate-700 ring-slate-200",
          className
        )}
      >
        {ROLE_LABELS[key] || value || "—"}
      </span>
    );
  }

  const label =
    key === "SUSPENDED" || key === "BLOCKED"
      ? "Inactive"
      : key
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
        STATUS_STYLES[key] || STATUS_STYLES.PENDING,
        className
      )}
    >
      {key === "ACTIVE" ? "Active" : key === "INACTIVE" ? "Inactive" : label}
    </span>
  );
}
