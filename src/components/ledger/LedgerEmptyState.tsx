"use client";

import { Empty, Button } from "antd";
import { Inbox, SearchX, BookOpen } from "lucide-react";

type EmptyVariant = "no-ledger" | "no-search" | "no-transactions";

interface LedgerEmptyStateProps {
  variant?: EmptyVariant;
  onReset?: () => void;
}

const COPY: Record<
  EmptyVariant,
  { title: string; description: string; icon: typeof BookOpen }
> = {
  "no-ledger": {
    title: "No Ledger Found",
    description: "There are no ledger records available for this scope.",
    icon: BookOpen,
  },
  "no-search": {
    title: "No Search Result",
    description: "Try adjusting search keywords or filters.",
    icon: SearchX,
  },
  "no-transactions": {
    title: "No Transactions",
    description: "No wallet transactions match the current criteria.",
    icon: Inbox,
  },
};

export function LedgerEmptyState({
  variant = "no-ledger",
  onReset,
}: LedgerEmptyStateProps) {
  const copy = COPY[variant];
  const Icon = copy.icon;

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/70 px-6 py-14 text-center">
      <Empty
        image={
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>
        }
        description={
          <div>
            <p className="text-base font-semibold text-foreground">{copy.title}</p>
            <p className="mt-1 text-sm text-muted">{copy.description}</p>
          </div>
        }
      >
        {onReset ? (
          <Button onClick={onReset}>Reset Filters</Button>
        ) : null}
      </Empty>
    </div>
  );
}
