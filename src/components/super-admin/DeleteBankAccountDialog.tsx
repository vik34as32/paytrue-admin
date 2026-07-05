"use client";

import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { BankAccountRecord } from "@/types/bankAccount";

interface DeleteBankAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccountRecord | null;
  isDeleting?: boolean;
  onConfirm: () => void;
}

export function DeleteBankAccountDialog({
  isOpen,
  onClose,
  account,
  isDeleting = false,
  onConfirm,
}: DeleteBankAccountDialogProps) {
  const label = account
    ? `${account.bankName} (${account.accountNumber})`
    : "this bank account";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Bank Account"
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isDeleting}>
            Delete
          </Button>
        </div>
      }
    >
      <p className="text-sm text-foreground">
        Are you sure you want to delete{" "}
        <span className="font-semibold">{label}</span>?
      </p>
      <p className="mt-2 text-sm text-muted">
        This account will be soft deleted and removed from the list.
      </p>
    </Modal>
  );
}
