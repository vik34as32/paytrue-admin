"use client";

import {
  Lock,
  Unlock,
  BadgeIndianRupee,
  CircleDollarSign,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
import { WalletLienSummaryStats } from "@/types/walletLien";

interface WalletLienStatsCardsProps {
  stats: WalletLienSummaryStats;
  loading?: boolean;
}

const CARDS = [
  {
    key: "active",
    label: "Total Active Liens",
    icon: Lock,
    accent: "from-amber-500/15 to-transparent text-amber-700",
    value: (s: WalletLienSummaryStats) =>
      s.totalActiveLiens.toLocaleString("en-IN"),
  },
  {
    key: "released",
    label: "Total Released Liens",
    icon: Unlock,
    accent: "from-emerald-500/15 to-transparent text-emerald-700",
    value: (s: WalletLienSummaryStats) =>
      s.totalReleasedLiens.toLocaleString("en-IN"),
  },
  {
    key: "amount",
    label: "Total Lien Amount",
    icon: BadgeIndianRupee,
    accent: "from-blue-500/15 to-transparent text-blue-700",
    value: (s: WalletLienSummaryStats) => formatCurrency(s.totalLienAmount),
  },
  {
    key: "hold",
    label: "Total Available Balance Under Hold",
    icon: CircleDollarSign,
    accent: "from-violet-500/15 to-transparent text-violet-700",
    value: (s: WalletLienSummaryStats) =>
      formatCurrency(s.totalAvailableBalanceUnderHold),
  },
] as const;

export function WalletLienStatsCards({
  stats,
  loading,
}: WalletLienStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={cn(
              "rounded-2xl border border-border bg-gradient-to-br p-5 shadow-sm",
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
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {card.value(stats)}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
