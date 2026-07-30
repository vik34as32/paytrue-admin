"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { Textarea } from "@/components/common/Textarea";
import {
  RejectUserFormValues,
  rejectUserSchema,
} from "@/validations/idVerification";

interface RejectUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  isSubmitting?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
}

export function RejectUserDialog({
  isOpen,
  onClose,
  userName,
  isSubmitting,
  onConfirm,
}: RejectUserDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectUserFormValues>({
    resolver: zodResolver(rejectUserSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (isOpen) reset({ reason: "" });
  }, [isOpen, reset]);

  const submit = handleSubmit(async (values) => {
    await onConfirm(values.reason.trim());
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title="Reject User"
      subtitle={
        userName
          ? `Are you sure you want to reject ${userName}? Provide a reason below.`
          : "Are you sure you want to reject this user? Rejection reason is required."
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            onClick={() => void submit()}
          >
            Reject User
          </Button>
        </div>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Textarea
          label="Reason"
          placeholder="PAN image is blurred"
          disabled={isSubmitting}
          error={errors.reason?.message}
          aria-label="Rejection reason"
          aria-required="true"
          {...register("reason")}
        />
        <p className="text-xs text-muted">Minimum 10 characters required.</p>
      </form>
    </Modal>
  );
}
