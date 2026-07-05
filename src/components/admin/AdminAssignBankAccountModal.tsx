"use client";

import { Modal } from "@/components/modals/Modal";
import { AdminAssignBankAccountForm } from "@/components/admin/AdminAssignBankAccountForm";

interface AdminAssignBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminAssignBankAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminAssignBankAccountModalProps) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Bank Account"
      subtitle="Select a system bank account and assign it to a network user"
      size="lg"
    >
      <AdminAssignBankAccountForm
        isOpen={isOpen}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}
