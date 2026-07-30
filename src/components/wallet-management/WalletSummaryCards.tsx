"use client";

import {
  IndianRupee,
  Users,
  Wallet,
  Lock,
  CircleDollarSign,
  Landmark,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
import { WalletListSummary } from "@/types/wallet";

interface WalletSummaryCardsProps {
  summary: WalletListSummary;
  isLoading?: boolean;
}

const CARDS = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: Users,
    accent: "from-blue-500/15 to-blue-500/5 text-blue-600",
    format: (s: WalletListSummary) => s.totalUsers.toLocaleString("en-IN"),
  },
  {
    key: "total",
    label: "Total Balance",
    icon: IndianRupee,
    accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
    format: (s: WalletListSummary) => formatCurrency(s.totalBalance),
  },
  {
    key: "main",
    label: "Main Wallet",
    icon: Wallet,
    accent: "from-indigo-500/15 to-indigo-500/5 text-indigo-600",
    format: (s: WalletListSummary) => formatCurrency(s.totalMainWalletBalance),
  },
  {
    key: "commission",
    label: "Commission Wallet",
    icon: CircleDollarSign,
    accent: "from-orange-500/15 to-orange-500/5 text-orange-600",
    format: (s: WalletListSummary) =>
      formatCurrency(s.totalCommissionWalletBalance),
  },
  {
    key: "aeps",
    label: "AEPS Wallet",
    icon: Landmark,
    accent: "from-teal-500/15 to-teal-500/5 text-teal-600",
    format: (s: WalletListSummary) => formatCurrency(s.totalAepsWalletBalance),
  },
  {
    key: "hold",
    label: "Hold Balance",
    icon: Lock,
    accent: "from-rose-500/15 to-rose-500/5 text-rose-600",
    format: (s: WalletListSummary) => formatCurrency(s.totalHoldBalance),
  },
] as const;

export function WalletSummaryCards({
  summary,
  isLoading,
}: WalletSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {CARDS.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className={cn(
              "rounded-2xl border border-border bg-gradient-to-br p-4 shadow-sm",
              card.accent
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {card.label}
              </p>
              <span className="rounded-xl bg-card/80 p-2 shadow-sm">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            {isLoading ? (
              <div className="h-7 w-28 animate-pulse rounded-lg bg-muted/25" />
            ) : (
              <p className="text-xl font-bold tracking-tight text-foreground">
                {card.format(summary)}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
