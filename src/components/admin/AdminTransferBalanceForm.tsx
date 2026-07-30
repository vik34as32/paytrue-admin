"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WalletTransferForm } from "@/components/wallet/WalletTransferForm";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { adminTransferBalance } from "@/store/api/adminModuleApi";
import {
  resolveAdminPrimaryBalance,
  selectAdminBalance,
} from "@/store/selectors/adminSelectors";
import { usePublicNetworkReceivers } from "@/hooks/usePublicNetworkReceivers";
import type { WalletTransferFormData } from "@/validations";

const ADMIN_ROLE_OPTIONS = [
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
];

interface AdminTransferBalanceFormProps {
  onSuccess?: () => void;
}

export function AdminTransferBalanceForm({
  onSuccess,
}: AdminTransferBalanceFormProps) {
  const dispatch = useAppDispatch();
  const [activeRole, setActiveRole] = useState("");
  const balance = useAppSelector(selectAdminBalance);
  const { transferLoading, error } = useAppSelector((state) => state.adminModule);
  const {
    receivers,
    isLoading: isLoadingReceivers,
    error: receiversError,
    reload,
  } = usePublicNetworkReceivers(activeRole);

  const handleSubmit = async (data: WalletTransferFormData) => {
    const result = await dispatch(
      adminTransferBalance({
        receiverId: data.receiverId,
        amount: data.amount,
        description: data.description,
      })
    );

    if (adminTransferBalance.fulfilled.match(result)) {
      toast.success("Balance transferred successfully");
      void reload();
      onSuccess?.();
    } else {
      toast.error((result.payload as string) || "Transfer failed");
    }
  };

  return (
    <WalletTransferForm
      receivers={receivers}
      currentBalance={resolveAdminPrimaryBalance(balance)}
      isLoadingReceivers={isLoadingReceivers}
      isSubmitting={transferLoading}
      error={receiversError || error}
      roleOptions={ADMIN_ROLE_OPTIONS}
      onRoleChange={setActiveRole}
      onSubmit={handleSubmit}
    />
  );
}
