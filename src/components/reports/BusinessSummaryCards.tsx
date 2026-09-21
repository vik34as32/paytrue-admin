"use client";

import {
  Banknote,
  CircleDollarSign,
  Hash,
  Percent,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatCompactCurrency, formatCurrency } from "@/lib/businessReport";
import { cn } from "@/lib/utils";
import { BusinessReportSummary } from "@/types/monthlyBusiness";

const CARDS = [
  {
    key: "business",
    label: "Total Business",
    icon: Banknote,
    value: (d: BusinessReportSummary) => formatCompactCurrency(d.totalBusiness),
    hint: (d: BusinessReportSummary) => formatCurrency(d.totalBusiness),
  },
  {
    key: "txns",
    label: "Total Transactions",
    icon: Hash,
    value: (d: BusinessReportSummary) =>
      d.totalTransactions.toLocaleString("en-IN"),
  },
  {
    key: "success",
    label: "Successful Transactions",
    icon: TrendingUp,
    value: (d: BusinessReportSummary) =>
      d.successfulTransactions.toLocaleString("en-IN"),
  },
  {
    key: "failed",
    label: "Failed Transactions",
    icon: TrendingDown,
    value: (d: BusinessReportSummary) =>
      d.failedTransactions.toLocaleString("en-IN"),
  },
  {
    key: "charges",
    label: "Total Charges",
    icon: Percent,
    value: (d: BusinessReportSummary) => formatCompactCurrency(d.totalCharges),
  },
  {
    key: "commission",
    label: "Total Commission",
    icon: CircleDollarSign,
    value: (d: BusinessReportSummary) =>
      formatCompactCurrency(d.totalCommission),
  },
] as const;

interface BusinessSummaryCardsProps {
  data?: BusinessReportSummary | null;
  loading?: boolean;
}

export function BusinessSummaryCards({ data, loading }: BusinessSummaryCardsProps) {
  return (
    <section aria-label="Business summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="rounded-2xl border border-border bg-card p-4 shadow-[0px_4px_24px_rgba(112,144,176,0.08)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {card.label}
              </p>
              <span className="rounded-xl bg-primary/10 p-2 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            </div>
            {loading && !data ? (
              <div className="h-7 w-24 animate-pulse rounded-lg bg-muted/30" />
            ) : (
              <p className="text-xl font-bold tabular-nums text-foreground">
                {data ? card.value(data) : "—"}
              </p>
            )}
            {"hint" in card && data ? (
              <p className={cn("mt-1 text-[11px] text-muted")}>
                {card.hint(data)}
              </p>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
