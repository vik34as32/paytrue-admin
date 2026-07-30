"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MinusCircle } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import {
  walletActionAmountSchema,
  WalletActionAmountFormValues,
} from "@/schemas/wallet-action.schema";
import { WalletUser } from "@/types/wallet";
import { WalletUserSummaryCard } from "@/components/wallet-management/WalletUserSummaryCard";

interface WalletDeductActionModalProps {
  open: boolean;
  user: WalletUser | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: WalletActionAmountFormValues) => Promise<void>;
}

export function WalletDeductActionModal({
  open,
  user,
  isSubmitting,
  onClose,
  onSubmit,
}: WalletDeductActionModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WalletActionAmountFormValues>({
    resolver: zodResolver(walletActionAmountSchema),
    defaultValues: { amount: undefined as unknown as number, description: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ amount: undefined as unknown as number, description: "" });
    }
  }, [open, user?.userId, reset]);

  if (!user) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Deduct Balance"
      subtitle="Deduct balance from the selected user using the same deduct API."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="wallet-deduct-action-form"
            variant="danger"
            isLoading={isSubmitting}
            className="gap-2"
          >
            <MinusCircle className="h-4 w-4" />
            Deduct
          </Button>
        </div>
      }
    >
      <form
        id="wallet-deduct-action-form"
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <WalletUserSummaryCard user={user} />
        <Input
          label="Amount (₹)"
          type="number"
          min={1}
          step={1}
          placeholder="Enter amount"
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <Textarea
          label="Description"
          rows={3}
          placeholder="Reason for deduction"
          error={errors.description?.message}
          {...register("description")}
        />
      </form>
    </Modal>
  );
}
