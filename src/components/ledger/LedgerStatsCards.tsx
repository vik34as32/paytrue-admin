"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeIndianRupee,
  CircleDollarSign,
  Clock3,
  Percent,
  Receipt,
  TriangleAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
import { LedgerStats } from "@/types/ledger";

interface LedgerStatsCardsProps {
  stats: LedgerStats;
  loading?: boolean;
}

const CARDS = [
  {
    key: "total",
    label: "Total Transactions",
    icon: Receipt,
    accent: "from-indigo-500/15 to-transparent text-indigo-600",
    value: (s: LedgerStats) => s.totalTransactions.toLocaleString("en-IN"),
    trend: (s: LedgerStats) => s.creditTrend,
  },
  {
    key: "credits",
    label: "Total Credits",
    icon: ArrowDownLeft,
    accent: "from-emerald-500/15 to-transparent text-emerald-600",
    value: (s: LedgerStats) => formatCurrency(s.totalCredits),
    trend: (s: LedgerStats) => s.creditTrend,
  },
  {
    key: "debits",
    label: "Total Debits",
    icon: ArrowUpRight,
    accent: "from-rose-500/15 to-transparent text-rose-600",
    value: (s: LedgerStats) => formatCurrency(s.totalDebits),
    trend: (s: LedgerStats) => s.debitTrend,
  },
  {
    key: "charges",
    label: "Total Charges",
    icon: BadgeIndianRupee,
    accent: "from-amber-500/15 to-transparent text-amber-600",
    value: (s: LedgerStats) => formatCurrency(s.totalCharges),
  },
  {
    key: "commission",
    label: "Total Commission",
    icon: Percent,
    accent: "from-violet-500/15 to-transparent text-violet-600",
    value: (s: LedgerStats) => formatCurrency(s.totalCommission),
  },
  {
    key: "today",
    label: "Today's Transactions",
    icon: CircleDollarSign,
    accent: "from-sky-500/15 to-transparent text-sky-600",
    value: (s: LedgerStats) => s.todayTransactions.toLocaleString("en-IN"),
  },
  {
    key: "pending",
    label: "Pending Transactions",
    icon: Clock3,
    accent: "from-orange-500/15 to-transparent text-orange-600",
    value: (s: LedgerStats) => s.pendingTransactions.toLocaleString("en-IN"),
  },
  {
    key: "failed",
    label: "Failed Transactions",
    icon: TriangleAlert,
    accent: "from-red-500/15 to-transparent text-red-600",
    value: (s: LedgerStats) => s.failedTransactions.toLocaleString("en-IN"),
  },
] as const;

export function LedgerStatsCards({ stats, loading }: LedgerStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card, index) => {
        const Icon = card.icon;
        const trend =
          "trend" in card && card.trend ? card.trend(stats) : undefined;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            whileHover={{ y: -3, scale: 1.01 }}
            className={cn(
              "rounded-2xl border border-border bg-gradient-to-br p-4 shadow-sm hover:shadow-md",
              card.accent
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {card.label}
              </p>
              <span className="rounded-xl bg-card/90 p-2 shadow-sm">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            </div>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded-lg bg-muted/25" />
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {card.value(stats)}
                </p>
                {typeof trend === "number" && trend !== 0 ? (
                  <p
                    className={cn(
                      "mt-1 text-xs font-medium",
                      trend > 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {trend > 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted">Live ledger metrics</p>
                )}
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
