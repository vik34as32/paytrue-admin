"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WalletDeductForm } from "@/components/wallet/WalletDeductForm";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { adminDeductBalance } from "@/store/api/adminModuleApi";
import { usePublicNetworkReceivers } from "@/hooks/usePublicNetworkReceivers";
import type { WalletDeductFormData } from "@/validations";

const ADMIN_ROLE_OPTIONS = [
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
];

interface AdminDeductBalanceFormProps {
  onSuccess?: () => void;
}

export function AdminDeductBalanceForm({
  onSuccess,
}: AdminDeductBalanceFormProps) {
  const dispatch = useAppDispatch();
  const [activeRole, setActiveRole] = useState("");
  const { deductLoading, error } = useAppSelector((state) => state.adminModule);
  const {
    receivers,
    isLoading: isLoadingReceivers,
    error: receiversError,
    reload,
  } = usePublicNetworkReceivers(activeRole);

  const handleSubmit = async (data: WalletDeductFormData) => {
    const result = await dispatch(
      adminDeductBalance({
        receiverId: data.receiverId,
        amount: data.amount,
        description: data.description,
      })
    );

    if (adminDeductBalance.fulfilled.match(result)) {
      toast.success("Balance deducted successfully");
      void reload();
      onSuccess?.();
    } else {
      toast.error((result.payload as string) || "Deduction failed");
    }
  };

  return (
    <WalletDeductForm
      receivers={receivers}
      isLoadingReceivers={isLoadingReceivers}
      isSubmitting={deductLoading}
      error={receiversError || error}
      roleOptions={ADMIN_ROLE_OPTIONS}
      onRoleChange={setActiveRole}
      onSubmit={handleSubmit}
    />
  );
}
