"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { addBalanceSchema, AddBalanceFormData } from "@/validations";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { submitAdminFundRequest } from "@/store/api/adminModuleApi";
import { clearAdminModuleError } from "@/store/slices/adminModuleSlice";
import { IndianRupee } from "lucide-react";

interface AdminFundRequestFormProps {
  onSuccess?: () => void;
}

export function AdminFundRequestForm({ onSuccess }: AdminFundRequestFormProps) {
  const dispatch = useAppDispatch();
  const { fundRequestLoading, error } = useAppSelector(
    (state) => state.adminModule
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddBalanceFormData>({
    resolver: zodResolver(addBalanceSchema),
  });

  const onSubmit = async (data: AddBalanceFormData) => {
    dispatch(clearAdminModuleError());
    const result = await dispatch(
      submitAdminFundRequest({
        amount: data.amount,
        remarks: data.remarks,
      })
    );
    if (submitAdminFundRequest.fulfilled.match(result)) {
      toast.success("Fund request submitted successfully");
      reset();
      onSuccess?.();
    } else {
      toast.error((result.payload as string) || "Failed to submit request");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}
      <Input
        label="Amount (₹)"
        type="number"
        placeholder="Enter requested amount"
        icon={<IndianRupee className="h-4 w-4" />}
        error={errors.amount?.message}
        {...register("amount", { valueAsNumber: true })}
      />
      <Textarea
        label="Remarks"
        placeholder="Reason for fund request..."
        error={errors.remarks?.message}
        {...register("remarks")}
      />
      <Button
        type="submit"
        isLoading={fundRequestLoading}
        disabled={fundRequestLoading}
      >
        Submit Fund Request
      </Button>
    </form>
  );
}
