"use client";

export function WalletSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading wallets">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-border bg-muted/20"
          />
        ))}
      </div>
      <div className="h-32 animate-pulse rounded-2xl border border-border bg-muted/15" />
      <div className="h-[420px] animate-pulse rounded-2xl border border-border bg-muted/10" />
    </div>
  );
}

export function WalletDrawerSkeleton() {
  return (
    <div className="space-y-4 p-1" aria-busy="true">
      <div className="flex gap-3">
        <div className="h-14 w-14 animate-pulse rounded-2xl bg-muted/30" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-muted/30" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted/20" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/20" />
      ))}
    </div>
  );
}

export function WalletSelfSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-2xl border border-border bg-muted/20"
        />
      ))}
    </div>
  );
}
