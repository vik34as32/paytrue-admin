"use client";

import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { NetworkUserRecord } from "@/types/superAdmin";
import { getNetworkUserName } from "@/store/selectors/superAdminSelectors";

interface DeleteNetworkUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: NetworkUserRecord | null;
  isDeleting?: boolean;
  onConfirm: () => void;
}

export function DeleteNetworkUserDialog({
  isOpen,
  onClose,
  user,
  isDeleting = false,
  onConfirm,
}: DeleteNetworkUserDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete User"
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
          {user ? getNetworkUserName(user) : "this user"}
        </span>
        ?
      </p>
      <p className="mt-2 text-sm text-muted">
        This action cannot be undone.
      </p>
    </Modal>
  );
}
