"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  ShieldX,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface VerificationStatItem {
  key: string;
  label: string;
  count: number;
  trend: string;
  icon: LucideIcon;
  tone: "amber" | "emerald" | "rose" | "indigo";
}

const TONE_STYLES: Record<
  VerificationStatItem["tone"],
  { card: string; icon: string; value: string }
> = {
  amber: {
    card: "border-amber-200/80 from-amber-50/90 to-white dark:border-amber-800/40 dark:from-amber-950/40 dark:to-card",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300",
    value: "text-amber-700 dark:text-amber-300",
  },
  emerald: {
    card: "border-emerald-200/80 from-emerald-50/90 to-white dark:border-emerald-800/40 dark:from-emerald-950/40 dark:to-card",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300",
    value: "text-emerald-700 dark:text-emerald-300",
  },
  rose: {
    card: "border-rose-200/80 from-rose-50/90 to-white dark:border-rose-800/40 dark:from-rose-950/40 dark:to-card",
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300",
    value: "text-rose-700 dark:text-rose-300",
  },
  indigo: {
    card: "border-indigo-200/80 from-indigo-50/90 to-white dark:border-indigo-800/40 dark:from-indigo-950/40 dark:to-card",
    icon: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300",
    value: "text-indigo-700 dark:text-indigo-300",
  },
};

interface VerificationStatsCardsProps {
  stats: VerificationStatItem[];
  isLoading?: boolean;
  onSelect?: (key: string) => void;
  activeKey?: string;
}

export function buildDefaultVerificationStats(counts: {
  pending: number;
  verified: number;
  rejected: number;
  total: number;
}): VerificationStatItem[] {
  return [
    {
      key: "PENDING",
      label: "Pending Verification",
      count: counts.pending,
      trend: "Awaiting document review",
      icon: Clock3,
      tone: "amber",
    },
    {
      key: "VERIFIED",
      label: "Verified Users",
      count: counts.verified,
      trend: "Identity approved",
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      key: "REJECTED",
      label: "Rejected Users",
      count: counts.rejected,
      trend: "Needs resubmission",
      icon: ShieldX,
      tone: "rose",
    },
    {
      key: "ALL",
      label: "Total Users",
      count: counts.total,
      trend: "In selected role scope",
      icon: Users,
      tone: "indigo",
    },
  ];
}

export function VerificationStatsCards({
  stats,
  isLoading,
  onSelect,
  activeKey,
}: VerificationStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[118px] animate-pulse rounded-2xl border border-border bg-muted/20"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const styles = TONE_STYLES[stat.tone];
        const Icon = stat.icon;
        const active = activeKey === stat.key;
        return (
          <motion.button
            key={stat.key}
            type="button"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, delay: index * 0.05 }}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect?.(stat.key)}
            className={cn(
              "rounded-2xl border bg-gradient-to-br p-4 text-left shadow-sm transition-shadow hover:shadow-md",
              styles.card,
              active && "ring-2 ring-primary/40"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {stat.label}
                </p>
                <p className={cn("mt-2 text-3xl font-bold tabular-nums", styles.value)}>
                  {stat.count.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-[11px] text-muted">{stat.trend}</p>
              </div>
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl",
                  styles.icon
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
