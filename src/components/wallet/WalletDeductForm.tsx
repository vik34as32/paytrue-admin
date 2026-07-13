"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IndianRupee, MinusCircle } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { walletDeductSchema, WalletDeductFormData } from "@/validations";
import { formatCurrency } from "@/lib/utils";
import { normalizeTransferAmount } from "@/lib/walletAmount";
import { normalizeTransferRole } from "@/lib/walletTransferOptions";
import type { WalletTransferReceiver } from "@/types/wallet";
import type { WalletTransferRoleOption } from "@/components/wallet/WalletTransferForm";

interface WalletDeductFormProps {
  receivers: WalletTransferReceiver[];
  isLoadingReceivers?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  roleOptions: WalletTransferRoleOption[];
  onRoleChange?: (role: string) => void;
  onSubmit: (data: WalletDeductFormData) => Promise<void>;
}

export function WalletDeductForm({
  receivers,
  isLoadingReceivers = false,
  isSubmitting = false,
  error,
  roleOptions,
  onRoleChange,
  onSubmit,
}: WalletDeductFormProps) {
  const [selectedRole, setSelectedRole] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<WalletDeductFormData>({
    resolver: zodResolver(walletDeductSchema),
    defaultValues: {
      receiverId: "",
      amount: undefined,
      description: "",
    },
  });

  const receiverId = watch("receiverId");
  const enteredAmount = watch("amount") || 0;
  const normalizedRole = normalizeTransferRole(selectedRole);

  const roleReceivers = useMemo(
    () =>
      receivers.filter(
        (receiver) => normalizeTransferRole(receiver.role) === normalizedRole
      ),
    [receivers, normalizedRole]
  );

  const selectedReceiver = useMemo(
    () => receivers.find((receiver) => receiver.id === receiverId),
    [receivers, receiverId]
  );

  const targetBalance = selectedReceiver?.balance ?? 0;

  useEffect(() => {
    setValue("receiverId", "");
  }, [selectedRole, setValue]);

  const userOptions = useMemo(() => {
    if (!selectedRole) {
      return [{ value: "", label: "Select role first" }];
    }
    if (isLoadingReceivers) {
      return [{ value: "", label: "Loading users..." }];
    }
    if (roleReceivers.length === 0) {
      return [{ value: "", label: "No users found" }];
    }
    return [
      { value: "", label: "Select user" },
      ...roleReceivers.map((receiver) => ({
        value: receiver.id,
        label: `${receiver.name} — ${formatCurrency(receiver.balance)}`,
      })),
    ];
  }, [isLoadingReceivers, roleReceivers, selectedRole]);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    onRoleChange?.(role);
  };

  const handleFormSubmit = async (data: WalletDeductFormData) => {
    const amount = normalizeTransferAmount(data.amount);

    if (!selectedReceiver) {
      toast.error("Please select a user to deduct from");
      return;
    }

    if (amount > targetBalance) {
      toast.error(
        `Insufficient user balance. Available: ${formatCurrency(targetBalance)}`
      );
      return;
    }

    await onSubmit({ ...data, amount });
    reset();
    setSelectedRole("");
    onRoleChange?.("");
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Select
          label="Select Role"
          value={selectedRole}
          onChange={(event) => handleRoleSelect(event.target.value)}
          options={[{ value: "", label: "Select role" }, ...roleOptions]}
        />

        <Controller
          name="receiverId"
          control={control}
          render={({ field }) => (
            <Select
              key={selectedRole || "no-role"}
              label="Select User"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={userOptions}
              disabled={!selectedRole || isLoadingReceivers}
              error={errors.receiverId?.message}
            />
          )}
        />

        {selectedReceiver ? (
          <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">{selectedReceiver.name}</p>
            <p className="text-muted">
              {selectedReceiver.roleLabel} · Current balance:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(targetBalance)}
              </span>
            </p>
            {enteredAmount > 0 ? (
              <p className="mt-2 text-muted">
                Balance after deduction:{" "}
                <span className="font-semibold text-accent-red">
                  {formatCurrency(targetBalance - Number(enteredAmount))}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        <Input
          label="Amount to Deduct (₹)"
          type="number"
          step="1"
          min={1}
          placeholder="Enter whole rupees only"
          icon={<IndianRupee className="h-4 w-4" />}
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <Textarea
          label="Description"
          placeholder="Reason for deduction..."
          error={errors.description?.message}
          {...register("description")}
        />
        <Button
          type="submit"
          variant="danger"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          <MinusCircle className="h-4 w-4" />
          Deduct Balance
        </Button>
      </form>
    </div>
  );
}
