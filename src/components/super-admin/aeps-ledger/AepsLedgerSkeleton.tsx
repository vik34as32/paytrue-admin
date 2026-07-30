"use client";

export function AepsLedgerSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="h-12 bg-muted/70" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-t border-border bg-card px-4 py-3"
          >
            <div className="h-4 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
