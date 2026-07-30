"use client";

export function WalletLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-border bg-muted/20"
          />
        ))}
      </div>
      <div className="h-14 animate-pulse rounded-2xl border border-border bg-muted/15" />
      <div className="h-[420px] animate-pulse rounded-2xl border border-border bg-muted/10" />
    </div>
  );
}

export function WalletTableOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-card/60 backdrop-blur-[1px]">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading wallets…
      </div>
    </div>
  );
}
