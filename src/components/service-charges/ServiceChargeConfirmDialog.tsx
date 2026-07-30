"use client";

import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";

export type ServiceChargeConfirmAction =
  | "delete"
  | "pause"
  | "resume"
  | "run";

interface ServiceChargeConfirmDialogProps {
  isOpen: boolean;
  action: ServiceChargeConfirmAction | null;
  planName?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const COPY: Record<
  ServiceChargeConfirmAction,
  { title: string; body: string; confirm: string; danger?: boolean }
> = {
  delete: {
    title: "Delete Service Charge Plan",
    body: "This will permanently remove the plan from the schedule. Existing history will remain.",
    confirm: "Delete",
    danger: true,
  },
  pause: {
    title: "Pause Service Charge Plan",
    body: "Scheduled executions will stop until the plan is resumed.",
    confirm: "Pause",
  },
  resume: {
    title: "Resume Service Charge Plan",
    body: "The plan will return to the active schedule.",
    confirm: "Resume",
  },
  run: {
    title: "Run Service Charge Now",
    body: "This will trigger an immediate charge run for all applicable users.",
    confirm: "Run Now",
  },
};

export function ServiceChargeConfirmDialog({
  isOpen,
  action,
  planName,
  isLoading,
  onClose,
  onConfirm,
}: ServiceChargeConfirmDialogProps) {
  if (!action) return null;
  const copy = COPY[action];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={copy.title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={copy.danger ? "danger" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {copy.confirm}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-foreground">
        Are you sure you want to {action === "run" ? "run" : action}{" "}
        <span className="font-semibold">{planName || "this plan"}</span>?
      </p>
      <p className="mt-2 text-sm text-muted">{copy.body}</p>
    </Modal>
  );
}
