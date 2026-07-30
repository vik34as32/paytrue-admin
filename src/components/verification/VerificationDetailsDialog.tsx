"use client";

import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { VerificationInfo } from "@/components/verification/VerificationInfo";
import { VerificationHistory } from "@/components/verification/VerificationHistory";
import { UserVerificationInfo } from "@/types/idVerification";

interface VerificationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  verification?: UserVerificationInfo | null;
}

export function VerificationDetailsDialog({
  isOpen,
  onClose,
  verification,
}: VerificationDetailsDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verification Details"
      subtitle="Approved identity verification"
      size="md"
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <VerificationInfo
          variant="verified"
          actor={verification?.verifiedBy}
          at={verification?.verifiedAt}
          remark={verification?.remark}
        />
        {verification?.history?.length ? (
          <div>
            <h4 className="mb-2 text-sm font-bold text-foreground">History</h4>
            <VerificationHistory items={verification.history} />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
