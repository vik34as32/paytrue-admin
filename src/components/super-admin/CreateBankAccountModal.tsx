"use client";

import { Modal } from "@/components/modals/Modal";
import { BankAccountForm } from "@/components/super-admin/BankAccountForm";
import { BankAccountFormValues } from "@/validations/bankAccountSchemas";

interface CreateBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting?: boolean;
  onSubmit: (values: BankAccountFormValues) => Promise<boolean>;
}

export function CreateBankAccountModal({
  isOpen,
  onClose,
  isSubmitting = false,
  onSubmit,
}: CreateBankAccountModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Bank Account"
      subtitle="Add a system bank account for fund deposits"
      size="lg"
    >
      <BankAccountForm
        isOpen={isOpen}
        isSubmitting={isSubmitting}
        submitLabel="Add Bank Account"
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
