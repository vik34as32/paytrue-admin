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
  confirmQuestion?: string;
  onConfirm: () => void;
}

export function DeleteNetworkUserDialog({
  isOpen,
  onClose,
  user,
  isDeleting = false,
  confirmQuestion = "Are you sure you want to delete this user?",
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
            No, Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isDeleting}>
            Yes, Delete
          </Button>
        </div>
      }
    >
      <p className="text-sm text-foreground">
        {confirmQuestion}{" "}
        <span className="font-semibold">
          {user ? getNetworkUserName(user) : ""}
        </span>
      </p>
      <p className="mt-2 text-sm text-muted">
        This will soft-delete the user. If they still have an active downline,
        deletion will be blocked.
      </p>
    </Modal>
  );
}
