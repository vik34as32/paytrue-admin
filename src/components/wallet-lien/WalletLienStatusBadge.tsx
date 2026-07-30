"use client";

import { cn } from "@/lib/utils";

interface WalletLienStatusBadgeProps {
  status: string;
  className?: string;
}

export function WalletLienStatusBadge({
  status,
  className,
}: WalletLienStatusBadgeProps) {
  const key = (status || "ACTIVE").toUpperCase();

  const styles =
    key === "ACTIVE"
      ? "bg-amber-100 text-amber-800 ring-amber-200/70 dark:bg-amber-900/30 dark:text-amber-300"
      : key === "PARTIALLY_RELEASED"
        ? "bg-blue-100 text-blue-800 ring-blue-200/70 dark:bg-blue-900/30 dark:text-blue-300"
        : key === "RELEASED"
          ? "bg-emerald-100 text-emerald-800 ring-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "bg-slate-100 text-slate-700 ring-slate-200/70";

  const label =
    key === "PARTIALLY_RELEASED"
      ? "Partially Released"
      : key
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

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
