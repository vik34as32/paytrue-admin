"use client";

import {
  Wallet,
  CircleDollarSign,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
import { WalletSummaryDetail } from "@/types/walletBalances";

interface WalletSummaryCardsProps {
  summary: WalletSummaryDetail;
  className?: string;
}

const CARDS = [
  {
    key: "main",
    label: "Main Wallet",
    icon: Wallet,
    accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:text-emerald-300",
    value: (s: WalletSummaryDetail) => s.mainWallet,
  },
  {
    key: "commission",
    label: "Commission Wallet",
    icon: CircleDollarSign,
    accent: "from-blue-500/20 to-blue-500/5 text-blue-700 dark:text-blue-300",
    value: (s: WalletSummaryDetail) => s.commissionWallet,
  },
  {
    key: "earned",
    label: "Commission Earned",
    icon: TrendingUp,
    accent: "from-orange-500/20 to-orange-500/5 text-orange-700 dark:text-orange-300",
    value: (s: WalletSummaryDetail) => s.totalCommissionEarned,
  },
  {
    key: "available",
    label: "Available Balance",
    icon: IndianRupee,
    accent: "from-purple-500/20 to-purple-500/5 text-purple-700 dark:text-purple-300",
    value: (s: WalletSummaryDetail) =>
      s.availableBalance ?? s.mainWallet - (s.holdBalance ?? 0),
  },
] as const;

export function WalletSummaryCards({
  summary,
  className,
}: WalletSummaryCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2",
        className
      )}
    >
      {CARDS.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.06 }}
            className={cn(
              "rounded-2xl border border-border bg-gradient-to-br p-4 shadow-sm",
              card.accent
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-lg bg-card/80 p-1.5 shadow-sm">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {card.label}
              </p>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(card.value(summary))}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
