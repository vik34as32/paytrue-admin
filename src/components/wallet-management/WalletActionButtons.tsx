"use client";

import { memo } from "react";
import {
  ArrowLeftRight,
  Snowflake,
  Lock,
  MinusCircle,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletUser } from "@/types/wallet";

export type WalletRowAction =
  | "view"
  | "transfer"
  | "freeze"
  | "lien"
  | "deduct";

interface WalletActionButtonsProps {
  user: WalletUser;
  onAction: (action: WalletRowAction, user: WalletUser) => void;
}

const ACTIONS: {
  key: Exclude<WalletRowAction, "view">;
  label: string;
  icon: typeof ArrowLeftRight;
  className: string;
}[] = [
  {
    key: "transfer",
    label: "Transfer balance",
    icon: ArrowLeftRight,
    className:
      "border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300",
  },
  {
    key: "freeze",
    label: "Freeze wallet",
    icon: Snowflake,
    className:
      "border-sky-200/80 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300",
  },
  {
    key: "lien",
    label: "Lien amount",
    icon: Lock,
    className:
      "border-amber-200/80 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300",
  },
  {
    key: "deduct",
    label: "Deduct balance",
    icon: MinusCircle,
    className:
      "border-rose-200/80 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300",
  },
];

export const WalletActionButtons = memo(function WalletActionButtons({
  user,
  onAction,
}: WalletActionButtonsProps) {
  const isFrozen =
    String(user.walletStatus || user.wallet?.status || "").toUpperCase() ===
    "FROZEN";

  return (
    <div className="flex h-full w-full items-center justify-center gap-1">
      {ACTIONS.map((action) => {
        const frozen = action.key === "freeze" && isFrozen;
        const Icon = frozen ? Sun : action.icon;
        const label = frozen ? "Unfreeze wallet" : action.label;

        return (
          <button
            key={action.key}
            type="button"
            title={label}
            aria-label={`${label} — ${user.name || user.userCode || "user"}`}
            onClick={(e) => {
              e.stopPropagation();
              onAction(action.key, user);
            }}
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-all active:scale-95",
              frozen
                ? "border-violet-200/80 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-300"
                : action.className
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        );
      })}
    </div>
  );
});
