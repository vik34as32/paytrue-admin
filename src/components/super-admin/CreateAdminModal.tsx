"use client";

import { Modal } from "@/components/modals/Modal";
import { CreateAdminForm } from "@/components/forms/CreateAdminForm";

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateAdminModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAdminModalProps) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Admin"
      subtitle="Register a new administrator with login credentials"
      size="lg"
    >
      <CreateAdminForm
        variant="modal"
        isOpen={isOpen}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}
