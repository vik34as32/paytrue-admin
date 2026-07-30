"use client";

import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";

interface ConfirmWalletLienDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmWalletLienDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  isLoading,
  onClose,
  onConfirm,
}: ConfirmWalletLienDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}
