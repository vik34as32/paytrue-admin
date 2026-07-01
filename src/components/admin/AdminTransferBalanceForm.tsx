"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { adminTransferSchema, AdminTransferFormData } from "@/validations";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  adminTransferBalance,
  fetchAdminMasterDistributors,
} from "@/store/api/adminModuleApi";
import {
  resolveAdminPrimaryBalance,
  selectAdminBalance,
} from "@/store/selectors/adminSelectors";
import {
  getNetworkUserId,
  getNetworkUserName,
} from "@/services/adminApi";
import { formatCurrency } from "@/lib/utils";
import { IndianRupee } from "lucide-react";

interface AdminTransferBalanceFormProps {
  onSuccess?: () => void;
}

export function AdminTransferBalanceForm({
  onSuccess,
}: AdminTransferBalanceFormProps) {
  const dispatch = useAppDispatch();
  const balance = useAppSelector(selectAdminBalance);
  const { masterDistributors, transferLoading, error } = useAppSelector(
    (state) => state.adminModule
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdminTransferFormData>({
    resolver: zodResolver(adminTransferSchema),
  });

  useEffect(() => {
    dispatch(fetchAdminMasterDistributors({ page: 1, pageSize: 200 }));
  }, [dispatch]);

  const currentBalance = resolveAdminPrimaryBalance(balance);
  const enteredAmount = watch("amount") || 0;

  const options =
    masterDistributors.data.length > 0
      ? masterDistributors.data.map((md) => ({
          value: getNetworkUserId(md),
          label: `${getNetworkUserName(md)} — ${formatCurrency(md.walletBalance ?? 0)}`,
        }))
      : [{ value: "", label: "No master distributors found" }];

  const onSubmit = async (data: AdminTransferFormData) => {
    const result = await dispatch(
      adminTransferBalance({
        masterDistributorId: data.masterDistributorId,
        amount: data.amount,
        remarks: data.remarks,
      })
    );
    if (adminTransferBalance.fulfilled.match(result)) {
      toast.success("Balance transferred successfully");
      reset();
      onSuccess?.();
    } else {
      toast.error((result.payload as string) || "Transfer failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-primary/5 px-4 py-3">
        <p className="text-xs text-muted">Available Balance</p>
        <p className="text-xl font-bold text-primary">
          {formatCurrency(currentBalance)}
        </p>
        {enteredAmount > 0 && (
          <p className="mt-2 text-sm text-muted">
            Remaining:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(currentBalance - Number(enteredAmount))}
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
        <Select
          label="Master Distributor"
          options={[{ value: "", label: "Select master distributor" }, ...options]}
          error={errors.masterDistributorId?.message}
          {...register("masterDistributorId")}
        />
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
          placeholder="Purpose of transfer..."
          error={errors.remarks?.message}
          {...register("remarks")}
        />
        <Button type="submit" isLoading={transferLoading} disabled={transferLoading}>
          Transfer Balance
        </Button>
      </form>
    </div>
  );
}
