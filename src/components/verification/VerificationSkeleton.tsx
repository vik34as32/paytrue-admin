"use client";

export function VerificationSkeleton() {
  return (
    <div
      className="animate-pulse space-y-4 rounded-2xl border border-border bg-card p-5"
      aria-busy="true"
      aria-label="Loading verification"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-5 w-40 rounded-lg bg-muted/30" />
        <div className="h-6 w-20 rounded-full bg-muted/30" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-muted/20" />
        <div className="h-4 w-5/6 rounded bg-muted/20" />
        <div className="h-4 w-2/3 rounded bg-muted/20" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-28 rounded-xl bg-muted/25" />
        <div className="h-10 w-28 rounded-xl bg-muted/25" />
      </div>
    </div>
  );
}
