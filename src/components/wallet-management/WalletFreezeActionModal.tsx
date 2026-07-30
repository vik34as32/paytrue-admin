"use client";

import { Snowflake, Sun } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { WalletUser } from "@/types/wallet";
import { WalletUserSummaryCard } from "@/components/wallet-management/WalletUserSummaryCard";

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

  const isFrozen =
    String(user.walletStatus || user.wallet?.status || "").toUpperCase() ===
    "FROZEN";

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isFrozen ? "Unfreeze Wallet" : "Freeze Wallet"}
      subtitle={
        isFrozen
          ? "Unfreeze this user wallet so transactions can resume."
          : "Freeze this user wallet to block credits, debits, and transfers."
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
            ? "Wallet is currently frozen. Confirm to restore ACTIVE status."
            : "This will set wallet status to FROZEN. User will not be able to move funds until unfrozen."}
        </div>
      </div>
    </Modal>
  );
}
