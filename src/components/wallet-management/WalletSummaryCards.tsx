"use client";

import {
  IndianRupee,
  Users,
  Wallet,
  Lock,
  CircleDollarSign,
  Landmark,
  Snowflake,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
import { WalletListSummary } from "@/types/wallet";
import { WalletCategoryLedgerType } from "@/types/walletCategoryLedger";

interface WalletSummaryCardsProps {
  summary: WalletListSummary;
  isLoading?: boolean;
  onCardClick?: (type: WalletCategoryLedgerType) => void;
}

const CARDS = [
  {
    key: "totalUsers",
    ledgerType: "users" as const,
    label: "Total Users",
    icon: Users,
    accent: "from-blue-500/15 to-blue-500/5 text-blue-600",
    format: (s: WalletListSummary) => s.totalUsers.toLocaleString("en-IN"),
    clickable: true,
  },
  {
    key: "total",
    ledgerType: null,
    label: "Total Balance",
    icon: IndianRupee,
    accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
    format: (s: WalletListSummary) => formatCurrency(s.totalBalance),
    clickable: false,
  },
  {
    key: "main",
    ledgerType: "main" as const,
    label: "Main Wallet",
    icon: Wallet,
    accent: "from-indigo-500/15 to-indigo-500/5 text-indigo-600",
    format: (s: WalletListSummary) => formatCurrency(s.totalMainWalletBalance),
    clickable: true,
  },
  {
    key: "commission",
    ledgerType: "commission" as const,
    label: "Commission Wallet",
    icon: CircleDollarSign,
    accent: "from-orange-500/15 to-orange-500/5 text-orange-600",
    format: (s: WalletListSummary) =>
      formatCurrency(s.totalCommissionWalletBalance),
    clickable: true,
  },
  {
    key: "aeps",
    ledgerType: "aeps" as const,
    label: "AEPS Wallet",
    icon: Landmark,
    accent: "from-teal-500/15 to-teal-500/5 text-teal-600",
    format: (s: WalletListSummary) => formatCurrency(s.totalAepsWalletBalance),
    clickable: true,
  },
  {
    key: "hold",
    ledgerType: "hold" as const,
    label: "Hold Balance",
    icon: Lock,
    accent: "from-rose-500/15 to-rose-500/5 text-rose-600",
    format: (s: WalletListSummary) => formatCurrency(s.totalHoldBalance),
    clickable: true,
  },
  {
    key: "frozen",
    ledgerType: "frozen" as const,
    label: "Frozen Amount",
    icon: Snowflake,
    accent: "from-sky-500/15 to-sky-500/5 text-sky-600",
    format: (s: WalletListSummary) =>
      formatCurrency(s.totalFrozenBalance || 0),
    clickable: true,
  },
] as const;

export function WalletSummaryCards({
  summary,
  isLoading,
  onCardClick,
}: WalletSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1600px]:grid-cols-7">
      {CARDS.map((card, index) => {
        const Icon = card.icon;
        const isClickable = card.clickable && !!card.ledgerType && !!onCardClick;

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={() => {
              if (isClickable && card.ledgerType) {
                onCardClick(card.ledgerType);
              }
            }}
            onKeyDown={(event) => {
              if (
                isClickable &&
                card.ledgerType &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                onCardClick(card.ledgerType);
              }
            }}
            className={cn(
              "rounded-2xl border border-border bg-gradient-to-br p-4 shadow-sm transition",
              card.accent,
              isClickable &&
                "cursor-pointer hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
            {isClickable ? (
              <p className="mt-2 text-[11px] font-medium text-muted">
                View ledger →
              </p>
            ) : null}
          </motion.div>
        );
      })}
    </div>
  );
}
