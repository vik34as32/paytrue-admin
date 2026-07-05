"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { BankSelect } from "@/components/common/BankSelect";
import { Button } from "@/components/common/Button";
import {
  bankAccountEmptyDefaults,
  bankAccountFormSchema,
  BankAccountFormValues,
  mapBankAccountToFormValues,
} from "@/validations/bankAccountSchemas";
import { BankAccountRecord } from "@/types/bankAccount";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

interface BankAccountFormProps {
  account?: BankAccountRecord | null;
  isOpen?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: BankAccountFormValues) => Promise<boolean>;
  onCancel?: () => void;
}

export function BankAccountForm({
  account,
  isOpen = true,
  isSubmitting = false,
  submitLabel = "Save Bank Account",
  onSubmit,
  onCancel,
}: BankAccountFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: bankAccountEmptyDefaults,
  });

  useEffect(() => {
    if (!isOpen) {
      reset(bankAccountEmptyDefaults);
      return;
    }
    if (account) {
      reset(mapBankAccountToFormValues(account));
      return;
    }
    reset(bankAccountEmptyDefaults);
  }, [account, isOpen, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    const success = await onSubmit(values);
    if (success && !account) {
      reset(bankAccountEmptyDefaults);
    }
  });

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Account Holder Name"
          placeholder="Enter account holder name"
          error={errors.accountHolderName?.message}
          {...register("accountHolderName")}
        />
        <BankSelect
          label="Bank Name"
          value={watch("bankName") || ""}
          onChange={(bankName) =>
            setValue("bankName", bankName, { shouldValidate: true })
          }
          error={errors.bankName?.message}
          placeholder="Search Indian bank by name..."
        />
        <Input
          label="Account Number"
          placeholder="Enter account number"
          error={errors.accountNumber?.message}
          {...register("accountNumber")}
        />
        <Input
          label="IFSC Code"
          placeholder="e.g. HDFC0001234"
          error={errors.ifscCode?.message}
          {...register("ifscCode")}
        />
        <Input
          label="Branch Name"
          placeholder="Optional"
          error={errors.branchName?.message}
          {...register("branchName")}
        />
        <Input
          label="UPI ID"
          placeholder="Optional"
          error={errors.upiId?.message}
          {...register("upiId")}
        />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={watch("status") || "ACTIVE"}
          onChange={(event) =>
            setValue("status", event.target.value as "ACTIVE" | "INACTIVE")
          }
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
