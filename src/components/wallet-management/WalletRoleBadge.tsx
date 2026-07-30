"use client";

import { cn } from "@/lib/utils";
import { WalletUserRole } from "@/types/wallet";

const ROLE_STYLES: Record<WalletUserRole, string> = {
  RETAILER: "bg-blue-100 text-blue-700 ring-blue-200/70 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800/40",
  DISTRIBUTOR:
    "bg-orange-100 text-orange-700 ring-orange-200/70 dark:bg-orange-900/30 dark:text-orange-300 dark:ring-orange-800/40",
  MASTER_DISTRIBUTOR:
    "bg-purple-100 text-purple-700 ring-purple-200/70 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-800/40",
  ADMIN:
    "bg-red-100 text-red-700 ring-red-200/70 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800/40",
};

const ROLE_LABELS: Record<string, string> = {
  RETAILER: "Retailer",
  DISTRIBUTOR: "Distributor",
  MASTER_DISTRIBUTOR: "Master Distributor",
  ADMIN: "Admin",
};

interface WalletRoleBadgeProps {
  role: string;
  className?: string;
}

export function WalletRoleBadge({ role, className }: WalletRoleBadgeProps) {
  const style =
    ROLE_STYLES[role as WalletUserRole] ||
    "bg-slate-100 text-slate-700 ring-slate-200/70";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
        style,
        className
      )}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}
