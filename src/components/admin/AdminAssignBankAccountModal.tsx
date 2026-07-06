"use client";

import { Modal } from "@/components/modals/Modal";
import { AdminAssignBankAccountForm } from "@/components/admin/AdminAssignBankAccountForm";
import { BankAccountRecord } from "@/types/bankAccount";

interface AdminAssignBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  bankAccounts?: BankAccountRecord[];
  isLoadingBanks?: boolean;
}

export function AdminAssignBankAccountModal({
  isOpen,
  onClose,
  onSuccess,
  bankAccounts,
  isLoadingBanks,
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
        bankAccounts={bankAccounts}
        isLoadingBanks={isLoadingBanks}
      />
    </Modal>
  );
}
