"use client";

import { Modal } from "@/components/modals/Modal";
import { SuperAdminTransferBalanceForm } from "@/components/super-admin/SuperAdminTransferBalanceForm";

interface TransferBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferSuccess?: () => void;
}

export function TransferBalanceModal({
  isOpen,
  onClose,
  onTransferSuccess,
}: TransferBalanceModalProps) {
  const handleSuccess = () => {
    onTransferSuccess?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Balance"
      subtitle="Select role and user to transfer balance"
      size="lg"
    >
      <SuperAdminTransferBalanceForm onSuccess={handleSuccess} />
    </Modal>
  );
}
