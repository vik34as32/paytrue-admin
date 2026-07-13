"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IndianRupee } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { walletTransferSchema, WalletTransferFormData } from "@/validations";
import { formatCurrency } from "@/lib/utils";
import { normalizeTransferAmount } from "@/lib/walletAmount";
import { normalizeTransferRole } from "@/lib/walletTransferOptions";
import type { WalletTransferReceiver } from "@/types/wallet";

export interface WalletTransferRoleOption {
  value: string;
  label: string;
}

interface WalletTransferFormProps {
  receivers: WalletTransferReceiver[];
  currentBalance: number;
  isLoadingReceivers?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  roleOptions: WalletTransferRoleOption[];
  showBalance?: boolean;
  onRoleChange?: (role: string) => void;
  onSubmit: (data: WalletTransferFormData) => Promise<void>;
}

export function WalletTransferForm({
  receivers,
  currentBalance,
  isLoadingReceivers = false,
  isSubmitting = false,
  error,
  roleOptions,
  showBalance = true,
  onRoleChange,
  onSubmit,
}: WalletTransferFormProps) {
  const [selectedRole, setSelectedRole] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<WalletTransferFormData>({
    resolver: zodResolver(walletTransferSchema),
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

  const handleFormSubmit = async (data: WalletTransferFormData) => {
    const amount = normalizeTransferAmount(data.amount);

    if (amount > currentBalance) {
      toast.error(
        `Insufficient wallet balance. Available: ${formatCurrency(currentBalance)}`
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
      {showBalance ? (
        <div className="rounded-xl bg-primary/5 px-4 py-3">
          <p className="text-xs text-muted">Available Balance</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(currentBalance)}
          </p>
          {enteredAmount > 0 ? (
            <p className="mt-2 text-sm text-muted">
              Remaining:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(currentBalance - Number(enteredAmount))}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

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
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">{selectedReceiver.name}</p>
            <p className="text-muted">
              {selectedReceiver.roleLabel} · Current balance:{" "}
              {formatCurrency(selectedReceiver.balance)}
            </p>
          </div>
        ) : null}

        <Input
          label="Amount (₹)"
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
          placeholder="Purpose of transfer..."
          error={errors.description?.message}
          {...register("description")}
        />
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          Transfer Balance
        </Button>
      </form>
    </div>
  );
}
