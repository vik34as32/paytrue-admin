"use client";

import { Modal } from "@/components/modals/Modal";
import { AddBalanceForm } from "@/components/super-admin/AddBalanceForm";
import { useRoleAccess } from "@/hooks/useAuth";

interface AddBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
}

export function AddBalanceModal({
  isOpen,
  onClose,
  currentBalance,
}: AddBalanceModalProps) {
  const { user } = useRoleAccess();
  const displayBalance = currentBalance ?? user?.balance ?? 0;

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Balance"
      subtitle="Top up your wallet balance"
      size="md"
    >
      <AddBalanceForm
        currentBalance={displayBalance}
        onSuccess={handleClose}
        showCancel
        onCancel={handleClose}
      />
    </Modal>
  );
}
