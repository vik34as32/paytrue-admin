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

function isWalletFrozen(user: WalletUser): boolean {
  const status = String(
    user.walletStatus || user.wallet?.status || ""
  ).toUpperCase();
  if (status.includes("FROZEN") || status === "FREEZE") return true;
  return (user.frozenBalance || 0) > 0;
}

export const WalletActionButtons = memo(function WalletActionButtons({
  user,
  onAction,
}: WalletActionButtonsProps) {
  const frozen = isWalletFrozen(user);

  return (
    <div className="flex h-full w-full items-center justify-center gap-1">
      <ActionIconButton
        label="Transfer balance"
        className="border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
        onClick={() => onAction("transfer", user)}
        userLabel={user.name || user.userCode || "user"}
      >
        <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={2.25} />
      </ActionIconButton>

      {/* Freeze only when not frozen; Unfreeze only when frozen */}
      {frozen ? (
        <ActionIconButton
          label="Unfreeze wallet"
          className="border-violet-200/80 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-300"
          onClick={() => onAction("freeze", user)}
          userLabel={user.name || user.userCode || "user"}
        >
          <Sun className="h-3.5 w-3.5" strokeWidth={2.25} />
        </ActionIconButton>
      ) : (
        <ActionIconButton
          label="Freeze wallet"
          className="border-sky-200/80 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300"
          onClick={() => onAction("freeze", user)}
          userLabel={user.name || user.userCode || "user"}
        >
          <Snowflake className="h-3.5 w-3.5" strokeWidth={2.25} />
        </ActionIconButton>
      )}

      <ActionIconButton
        label="Lien amount"
        className="border-amber-200/80 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300"
        onClick={() => onAction("lien", user)}
        userLabel={user.name || user.userCode || "user"}
      >
        <Lock className="h-3.5 w-3.5" strokeWidth={2.25} />
      </ActionIconButton>

      <ActionIconButton
        label="Deduct balance"
        className="border-rose-200/80 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300"
        onClick={() => onAction("deduct", user)}
        userLabel={user.name || user.userCode || "user"}
      >
        <MinusCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
      </ActionIconButton>
    </div>
  );
});

function ActionIconButton({
  label,
  className,
  onClick,
  userLabel,
  children,
}: {
  label: string;
  className: string;
  onClick: () => void;
  userLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={`${label} — ${userLabel}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-all active:scale-95",
        className
      )}
    >
      {children}
    </button>
  );
}
