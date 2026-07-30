"use client";

import { Inbox, SearchX, Wallet } from "lucide-react";
import { Button } from "@/components/common/Button";

type EmptyVariant = "no-wallets" | "no-users" | "no-search";

interface WalletEmptyStateProps {
  variant?: EmptyVariant;
  onReset?: () => void;
}

const COPY: Record<
  EmptyVariant,
  { title: string; description: string; icon: typeof Wallet }
> = {
  "no-wallets": {
    title: "No Wallet Found",
    description: "There are no wallet records available right now.",
    icon: Wallet,
  },
  "no-users": {
    title: "No Users",
    description: "No users are available in the current hierarchy scope.",
    icon: Inbox,
  },
  "no-search": {
    title: "No Search Result",
    description: "Try a different search term or reset your filters.",
    icon: SearchX,
  },
};

export function WalletEmptyState({
  variant = "no-wallets",
  onReset,
}: WalletEmptyStateProps) {
  const copy = COPY[variant];
  const Icon = copy.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/70 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <Icon className="h-8 w-8" aria-hidden />
      </div>
      <h3 className="text-lg font-bold text-foreground">{copy.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">{copy.description}</p>
      {onReset ? (
        <Button className="mt-5" variant="outline" onClick={onReset}>
          Reset Filters
        </Button>
      ) : null}
    </div>
  );
}
