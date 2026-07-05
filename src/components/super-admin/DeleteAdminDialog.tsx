"use client";

import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { AdminRecord } from "@/types/superAdmin";
import { getAdminDisplayName } from "@/services/admin";

interface DeleteAdminDialogProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminRecord | null;
  isDeleting?: boolean;
  onConfirm: () => void;
}

export function DeleteAdminDialog({
  isOpen,
  onClose,
  admin,
  isDeleting = false,
  onConfirm,
}: DeleteAdminDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Admin"
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
        <span className="font-semibold">
          {admin ? getAdminDisplayName(admin) : "this admin"}
        </span>
        ?
      </p>
      <p className="mt-2 text-sm text-muted">This action cannot be undone.</p>
    </Modal>
  );
}
