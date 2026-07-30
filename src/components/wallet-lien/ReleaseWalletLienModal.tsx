"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import {
  releaseWalletLienSchema,
  ReleaseWalletLienFormValues,
} from "@/schemas/wallet-lien.schema";
import { WalletLienRecord } from "@/types/walletLien";
import { formatCurrency } from "@/lib/utils";

interface ReleaseWalletLienModalProps {
  isOpen: boolean;
  lien: WalletLienRecord | null;
  onClose: () => void;
  onSubmit: (values: {
    amount: number;
    remarks?: string;
  }) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function ReleaseWalletLienModal({
  isOpen,
  lien,
  onClose,
  onSubmit,
  isSubmitting,
}: ReleaseWalletLienModalProps) {
  const maxAmount = lien?.remainingAmount ?? 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReleaseWalletLienFormValues>({
    resolver: zodResolver(releaseWalletLienSchema),
    defaultValues: {
      amount: 0,
      remarks: "",
      maxAmount: 1,
    },
  });

  useEffect(() => {
    if (!isOpen || !lien) return;
    reset({
      amount: lien.remainingAmount,
      remarks: "",
      maxAmount: Math.max(lien.remainingAmount, 0.01),
    });
  }, [isOpen, lien, reset]);

  const amount = Number(watch("amount") || 0);
  const remainingAfter = Math.max(0, maxAmount - (Number.isFinite(amount) ? amount : 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Release Wallet Lien"
      subtitle={lien ? `${lien.userName} · ${lien.userCode || lien.userId}` : undefined}
      size="md"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!lien || isSubmitting}
            onClick={() => {
              if (!lien) return;
              setValue("amount", lien.remainingAmount, { shouldValidate: true });
            }}
          >
            Full Release
          </Button>
          <Button
            type="submit"
            form="release-wallet-lien-form"
            isLoading={isSubmitting}
          >
            Release
          </Button>
        </div>
      }
    >
      {lien ? (
        <form
          id="release-wallet-lien-form"
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            const ok = await onSubmit({
              amount: values.amount,
              remarks: values.remarks,
            });
            if (ok) onClose();
          })}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info label="Original Lien" value={formatCurrency(lien.lienAmount)} />
            <Info
              label="Remaining Amount"
              value={formatCurrency(lien.remainingAmount)}
            />
          </div>

          <Input
            label="Release Amount"
            type="number"
            step="0.01"
            min="0"
            {...register("amount", { valueAsNumber: true })}
            error={errors.amount?.message}
          />

          <Input
            label="Remarks"
            {...register("remarks")}
            error={errors.remarks?.message}
          />

          <input type="hidden" {...register("maxAmount", { valueAsNumber: true })} />

          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Remaining After Release
            </p>
            <p className="mt-1 text-lg font-bold text-primary">
              {formatCurrency(remainingAfter)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Partial release keeps status as Partially Released until fully cleared.
            </p>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
