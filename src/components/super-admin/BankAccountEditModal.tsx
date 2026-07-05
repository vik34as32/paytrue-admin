"use client";

import { Modal } from "@/components/modals/Modal";
import { BankAccountForm } from "@/components/super-admin/BankAccountForm";
import { BankAccountRecord } from "@/types/bankAccount";
import { BankAccountFormValues } from "@/validations/bankAccountSchemas";

interface BankAccountEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccountRecord | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (values: BankAccountFormValues) => Promise<boolean>;
}

export function BankAccountEditModal({
  isOpen,
  onClose,
  account,
  isLoading = false,
  isSubmitting = false,
  onSubmit,
}: BankAccountEditModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Bank Account"
      subtitle="Update system bank account details"
      size="lg"
    >
      {isLoading ? (
        <p className="text-sm text-muted">Loading bank account...</p>
      ) : (
        <BankAccountForm
          account={account}
          isOpen={isOpen}
          isSubmitting={isSubmitting}
          submitLabel="Update Bank Account"
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
