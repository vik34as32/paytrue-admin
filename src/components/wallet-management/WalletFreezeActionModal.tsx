"use client";

import { Snowflake, Sun } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { WalletUser } from "@/types/wallet";
import { WalletUserSummaryCard } from "@/components/wallet-management/WalletUserSummaryCard";
import { formatCurrency } from "@/lib/utils";

interface WalletFreezeActionModalProps {
  open: boolean;
  user: WalletUser | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function WalletFreezeActionModal({
  open,
  user,
  isSubmitting,
  onClose,
  onConfirm,
}: WalletFreezeActionModalProps) {
  if (!user) return null;

  const status = String(
    user.walletStatus || user.wallet?.status || ""
  ).toUpperCase();
  const isFrozen =
    status.includes("FROZEN") ||
    status === "FREEZE" ||
    (user.frozenBalance || 0) > 0;

  const freezeAmount =
    user.availableBalance >= 1
      ? user.availableBalance
      : user.mainWallet || 0;
  const unfreezeAmount =
    user.frozenBalance > 0 ? user.frozenBalance : user.mainWallet || 0;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isFrozen ? "Unfreeze Wallet" : "Freeze Wallet"}
      subtitle={
        isFrozen
          ? "Release the frozen amount so the wallet can be used again."
          : "Freeze the full available wallet amount to block credits, debits, and transfers."
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isFrozen ? "primary" : "danger"}
            isLoading={isSubmitting}
            className="gap-2"
            onClick={() => void onConfirm()}
          >
            {isFrozen ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Snowflake className="h-4 w-4" />
            )}
            {isFrozen ? "Unfreeze Wallet" : "Freeze Wallet"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <WalletUserSummaryCard user={user} />
        <div
          className={
            isFrozen
              ? "rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800"
              : "rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800"
          }
        >
          {isFrozen
            ? `This will unfreeze ${formatCurrency(unfreezeAmount)} (full frozen amount) and restore ACTIVE status.`
            : `This will freeze ${formatCurrency(freezeAmount)} (full available balance) and set wallet status to FROZEN.`}
        </div>
      </div>
    </Modal>
  );
}
