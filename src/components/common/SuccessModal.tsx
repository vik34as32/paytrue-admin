"use client";

import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { CheckCircle2 } from "lucide-react";

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
}

export function SuccessModal({
  open,
  onOpenChange,
  title = "Success!",
  message = "Operation completed successfully.",
}: SuccessModalProps) {
  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={title}
      subtitle={message}
      size="sm"
      footer={
        <Button type="button" onClick={() => onOpenChange(false)}>
          Continue
        </Button>
      }
    >
      <div className="flex flex-col items-center py-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/10 text-accent-green">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="text-sm text-muted">{message}</p>
      </div>
    </Modal>
  );
}
