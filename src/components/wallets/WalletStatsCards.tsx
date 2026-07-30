"use client";

import {
  Users,
  UserCheck,
  Wallet,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
import { WalletBalancesStats } from "@/types/walletBalances";

interface WalletStatsCardsProps {
  stats: WalletBalancesStats;
  isLoading?: boolean;
}

const CARDS = [
  {
    key: "totalWallet",
    label: "Total Wallet Balance",
    description: "Sum of all main wallets",
    icon: Wallet,
    accent: "from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-600",
    value: (s: WalletBalancesStats) => formatCurrency(s.totalWalletBalance),
  },
  {
    key: "commissionWallet",
    label: "Total Commission Wallet",
    description: "Commission wallet balances",
    icon: CircleDollarSign,
    accent: "from-blue-500/15 via-blue-500/5 to-transparent text-blue-600",
    value: (s: WalletBalancesStats) => formatCurrency(s.totalCommissionWallet),
  },
  {
    key: "commissionEarned",
    label: "Total Commission Earned",
    description: "Lifetime commission earned",
    icon: TrendingUp,
    accent: "from-orange-500/15 via-orange-500/5 to-transparent text-orange-600",
    value: (s: WalletBalancesStats) => formatCurrency(s.totalCommissionEarned),
  },
  {
    key: "users",
    label: "Users Count",
    description: "Users in current result set",
    icon: Users,
    accent: "from-indigo-500/15 via-indigo-500/5 to-transparent text-indigo-600",
    value: (s: WalletBalancesStats) => s.usersCount.toLocaleString("en-IN"),
  },
  {
    key: "active",
    label: "Active Users",
    description: "Currently active accounts",
    icon: UserCheck,
    accent: "from-purple-500/15 via-purple-500/5 to-transparent text-purple-600",
    value: (s: WalletBalancesStats) => s.activeUsers.toLocaleString("en-IN"),
  },
] as const;

export function WalletStatsCards({ stats, isLoading }: WalletStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {CARDS.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, delay: index * 0.05 }}
            whileHover={{ y: -3, scale: 1.01 }}
            className={cn(
              "rounded-2xl border border-border bg-gradient-to-br p-5 shadow-sm transition-shadow hover:shadow-md",
              card.accent
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {card.label}
                </p>
                <p className="mt-1 text-[11px] text-muted/90">{card.description}</p>
              </div>
              <span className="rounded-xl bg-card/90 p-2.5 shadow-sm">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            </div>
            {isLoading ? (
              <div className="h-8 w-28 animate-pulse rounded-lg bg-muted/25" />
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
