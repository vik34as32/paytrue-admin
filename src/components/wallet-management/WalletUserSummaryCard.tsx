"use client";

import { formatCurrency } from "@/lib/utils";
import { WalletUser } from "@/types/wallet";
import { WalletRoleBadge } from "@/components/wallet-management/WalletRoleBadge";

export function WalletUserSummaryCard({ user }: { user: WalletUser }) {
  return (
    <div className="rounded-xl border border-border bg-background/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {user.name || "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {user.userCode || "No code"} · {user.mobile || "—"}
          </p>
        </div>
        <WalletRoleBadge role={user.role} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Metric label="Main" value={user.mainWallet} />
        <Metric label="Commission" value={user.commissionWallet} />
        <Metric label="Hold" value={user.holdBalance} />
        <Metric label="Available" value={user.availableBalance} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-card px-2.5 py-2 ring-1 ring-border/70">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-semibold text-foreground">
        {formatCurrency(value)}
      </p>
    </div>
  );
}
