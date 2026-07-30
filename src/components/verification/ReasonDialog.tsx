"use client";

import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { VerificationInfo } from "@/components/verification/VerificationInfo";
import { UserVerificationInfo } from "@/types/idVerification";

interface ReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  verification?: UserVerificationInfo | null;
}

export function ReasonDialog({
  isOpen,
  onClose,
  verification,
}: ReasonDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rejection Reason"
      subtitle="ID verification was rejected"
      size="md"
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <VerificationInfo
        variant="rejected"
        actor={verification?.rejectedBy}
        at={verification?.rejectedAt}
        reason={verification?.reason}
      />
    </Modal>
  );
}
