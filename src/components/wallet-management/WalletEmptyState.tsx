"use client";

import { Wallet } from "lucide-react";
import { Button } from "@/components/common/Button";

interface WalletEmptyStateProps {
  onReset: () => void;
}

export function WalletEmptyState({ onReset }: WalletEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <Wallet className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-foreground">No wallets found</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">
        No user wallets match your current search or filters. Try adjusting
        filters or clearing the search.
      </p>
      <Button className="mt-5" variant="outline" onClick={onReset}>
        Reset Filters
      </Button>
    </div>
  );
}
