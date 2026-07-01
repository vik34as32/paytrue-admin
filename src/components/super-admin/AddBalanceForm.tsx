"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { addBalanceSchema, AddBalanceFormData } from "@/validations";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { addBalance } from "@/store/api/superAdminWalletApi";
import { formatCurrency } from "@/lib/utils";
import { IndianRupee } from "lucide-react";

interface AddBalanceFormProps {
  currentBalance: number;
  onSuccess?: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
}

export function AddBalanceForm({
  currentBalance,
  onSuccess,
  showCancel = false,
  onCancel,
}: AddBalanceFormProps) {
  const dispatch = useAppDispatch();
  const { addBalanceLoading, error } = useAppSelector(
    (state) => state.superAdminWallet
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddBalanceFormData>({
    resolver: zodResolver(addBalanceSchema),
  });

  const enteredAmount = watch("amount") || 0;
  const updatedBalance = currentBalance + (Number(enteredAmount) || 0);

  const onSubmit = async (data: AddBalanceFormData) => {
    const result = await dispatch(addBalance(data));
    if (addBalance.fulfilled.match(result)) {
      toast.success("Balance added successfully");
      reset();
      onSuccess?.();
    } else {
      toast.error((result.payload as string) || "Failed to add balance");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-primary/5 px-4 py-3">
        <p className="text-xs text-muted">Current Balance</p>
        <p className="text-xl font-bold text-primary">
          {formatCurrency(currentBalance)}
        </p>
        {enteredAmount > 0 && (
          <p className="mt-2 text-sm text-muted">
            Updated Balance:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(updatedBalance)}
            </span>
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Amount (₹)"
          type="number"
          placeholder="Enter amount"
          icon={<IndianRupee className="h-4 w-4" />}
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <Textarea
          label="Remarks"
          placeholder="Purpose of this top-up..."
          error={errors.remarks?.message}
          {...register("remarks")}
        />
        <div className="flex justify-end gap-3 pt-2">
          {showCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" isLoading={addBalanceLoading} disabled={addBalanceLoading}>
            Add Balance
          </Button>
        </div>
      </form>
    </div>
  );
}
