"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { Textarea } from "@/components/common/Textarea";
import {
  VerifyUserFormValues,
  verifyUserSchema,
} from "@/validations/idVerification";

interface VerifyUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  isSubmitting?: boolean;
  onConfirm: (remark?: string) => void | Promise<void>;
}

export function VerifyUserDialog({
  isOpen,
  onClose,
  userName,
  isSubmitting,
  onConfirm,
}: VerifyUserDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VerifyUserFormValues>({
    resolver: zodResolver(verifyUserSchema),
    defaultValues: { remark: "" },
  });

  useEffect(() => {
    if (isOpen) reset({ remark: "" });
  }, [isOpen, reset]);

  const submit = handleSubmit(async (values) => {
    await onConfirm(values.remark?.trim() || undefined);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title="Verify User"
      subtitle={
        userName
          ? `Are you sure you want to verify ${userName}?`
          : "Are you sure you want to verify this user?"
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
            isLoading={isSubmitting}
            disabled={isSubmitting}
            onClick={() => void submit()}
          >
            Confirm Verify
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
        <p className="text-sm text-muted">
          Are you sure you want to verify this user? This marks their ID
          documents as approved.
        </p>
        <Textarea
          label="Verification Remark (optional)"
          placeholder="All documents verified successfully"
          disabled={isSubmitting}
          error={errors.remark?.message}
          aria-label="Verification remark"
          {...register("remark")}
        />
      </form>
    </Modal>
  );
}
