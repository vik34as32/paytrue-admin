"use client";

import { Card, CardHeader } from "@/components/common/Card";
import { StatCard } from "@/components/cards/StatCard";
import { Button } from "@/components/common/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  buildDynamicBalanceCards,
  resolvePrimaryBalance,
} from "@/lib/walletBalance";
import { Wallet, RefreshCw, AlertCircle } from "lucide-react";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { GRADIENT_CARDS } from "@/constants";

interface WalletBalanceCardsProps {
  /** When false, skip auto-fetch (parent already called useWalletBalance). Default true. */
  autoFetch?: boolean;
}

export function WalletBalanceCards({ autoFetch = false }: WalletBalanceCardsProps) {
  const { balance, isLoading, error, refresh, lastFetchedAt } = useWalletBalance({
    autoFetch,
  });

  const cards = buildDynamicBalanceCards(balance);
  const lastUpdated = balance?.lastUpdated || balance?.updatedAt;

  if (isLoading && !balance) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-border" />
        ))}
      </div>
    );
  }

  if (error && !balance) {
    return (
      <Card className="border-accent-red/20 bg-accent-red/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent-red" />
            <div>
              <p className="font-semibold text-foreground">Failed to load wallet balance</p>
              <p className="mt-1 text-sm text-muted">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Wallet className="h-4 w-4" />
          {lastUpdated ? (
            <span>Last updated: {formatDate(lastUpdated)}</span>
          ) : lastFetchedAt ? (
            <span>Synced {formatDate(new Date(lastFetchedAt).toISOString())}</span>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No balance data returned from API.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <StatCard
              key={card.key}
              title={card.title}
              value={formatCurrency(card.value)}
              gradient={`bg-gradient-to-br ${GRADIENT_CARDS[i % GRADIENT_CARDS.length]}`}
              icon={<Wallet className="h-5 w-5" />}
            />
          ))}
        </div>
      )}

      {error && balance && (
        <p className="text-xs text-accent-red">
          {error}{" "}
          <button type="button" onClick={refresh} className="underline">
            Retry
          </button>
        </p>
      )}
    </div>
  );
}

/** Compact single-card variant for sub-pages (add balance, transfer) */
export function WalletBalanceCard() {
  const { balance, isLoading, error, refresh } = useWalletBalance({
    autoFetch: true,
  });

  const primaryBalance = resolvePrimaryBalance(balance);

  return (
    <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-card">
      <CardHeader
        title="Super Admin Wallet Balance"
        subtitle="Live wallet balance"
        action={
          <Button variant="ghost" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        }
      />
      {isLoading && !balance ? (
        <div className="h-10 w-40 animate-pulse rounded-lg bg-border" />
      ) : error && !balance ? (
        <div className="space-y-2">
          <p className="text-sm text-accent-red">{error}</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            Retry
          </Button>
        </div>
      ) : (
        <p className="text-3xl font-bold text-primary">
          {formatCurrency(primaryBalance)}
        </p>
      )}
    </Card>
  );
}
