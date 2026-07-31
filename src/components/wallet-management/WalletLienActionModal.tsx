"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Unlock } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { cn, formatCurrency } from "@/lib/utils";
import {
  walletLienActionSchema,
  WalletLienActionFormValues,
} from "@/schemas/wallet-action.schema";
import { WalletUser } from "@/types/wallet";
import { WalletUserSummaryCard } from "@/components/wallet-management/WalletUserSummaryCard";

interface WalletLienActionModalProps {
  open: boolean;
  user: WalletUser | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: WalletLienActionFormValues) => Promise<void>;
}

export function WalletLienActionModal({
  open,
  user,
  isSubmitting,
  onClose,
  onSubmit,
}: WalletLienActionModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WalletLienActionFormValues>({
    resolver: zodResolver(walletLienActionSchema),
    defaultValues: {
      mode: "hold",
      amount: undefined as unknown as number,
      reason: "",
    },
  });

  const mode = watch("mode");

  useEffect(() => {
    if (open) {
      reset({
        mode: "hold",
        amount: undefined as unknown as number,
        reason: "",
      });
    }
  }, [open, user?.userId, reset]);

  if (!user) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Lien Balance"
      subtitle="Hold a particular amount on this wallet, or release an existing hold."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="wallet-lien-action-form"
            isLoading={isSubmitting}
            className="gap-2"
            variant={mode === "release" ? "secondary" : "primary"}
          >
            {mode === "release" ? (
              <Unlock className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {mode === "release" ? "Release Hold" : "Apply Lien"}
          </Button>
        </div>
      }
    >
      <form
        id="wallet-lien-action-form"
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <WalletUserSummaryCard user={user} />

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1 ring-1 ring-border">
          <button
            type="button"
            onClick={() => setValue("mode", "hold")}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition-all",
              mode === "hold"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            Apply Lien
          </button>
          <button
            type="button"
            onClick={() => setValue("mode", "release")}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition-all",
              mode === "release"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            Release Hold
          </button>
        </div>

        <p className="text-xs text-muted">
          Current hold balance:{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(user.holdBalance)}
          </span>
        </p>

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
          label="Reason"
          rows={3}
          placeholder={
            mode === "release"
              ? "Reason for releasing hold"
              : "Reason for applying lien / hold"
          }
          error={errors.reason?.message}
          {...register("reason")}
        />
      </form>
    </Modal>
  );
}
