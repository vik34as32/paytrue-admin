"use client";

import { useWalletLiens } from "@/hooks/useWalletLien";
import { WalletLienHistoryTable } from "@/components/wallet-lien/WalletLienHistoryTable";
import { formatCurrency } from "@/lib/utils";

interface WalletLienUserSectionProps {
  userId: string;
}

export function WalletLienUserSection({ userId }: WalletLienUserSectionProps) {
  const { data, isLoading, isError, error } = useWalletLiens(
    { page: 1, limit: 20, userId },
    !!userId
  );

  const items = data?.items ?? [];
  const active = items.find((i) =>
    ["ACTIVE", "PARTIALLY_RELEASED"].includes(i.status.toUpperCase())
  );
  const latest = active || items[0];

  const history = items.flatMap((item) => [
    {
      id: `${item.id}-created`,
      date: item.createdAt,
      action: "APPLY",
      amount: item.lienAmount,
      remainingAmount: item.remainingAmount,
      status: item.status,
      performedBy: item.createdBy,
    },
    ...(item.releasedAt
      ? [
          {
            id: `${item.id}-released`,
            date: item.releasedAt,
            action: "RELEASE",
            amount: item.lienAmount - item.remainingAmount,
            remainingAmount: item.remainingAmount,
            status: item.status,
            performedBy: item.releasedBy,
          },
        ]
      : []),
  ]);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-foreground">Wallet Lien</h3>
      {isLoading ? (
        <div className="h-20 animate-pulse rounded-xl bg-muted/20" />
      ) : isError ? (
        <p className="text-sm text-accent-red">
          {error instanceof Error ? error.message : "Unable to load lien data"}
        </p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric
              label="Main Wallet Balance"
              value={formatCurrency(latest?.mainWalletBalance ?? 0)}
            />
            <Metric
              label="Lien Amount"
              value={formatCurrency(latest?.remainingAmount ?? 0)}
            />
            <Metric
              label="Available Balance"
              value={formatCurrency(latest?.availableBalance ?? 0)}
            />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Wallet Lien History
          </p>
          <WalletLienHistoryTable rows={history} />
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
