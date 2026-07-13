"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { WalletDeductForm } from "@/components/wallet/WalletDeductForm";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  adminDeductBalance,
  fetchAdminDistributors,
  fetchAdminMasterDistributors,
  fetchAdminRetailers,
} from "@/store/api/adminModuleApi";
import {
  adminNetworkUserToReceiver,
  normalizeTransferRole,
} from "@/lib/walletTransferOptions";
import type { WalletDeductFormData } from "@/validations";

const ADMIN_ROLE_OPTIONS = [
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
];

const LIST_PARAMS = { page: 1, pageSize: 100 };

interface AdminDeductBalanceFormProps {
  onSuccess?: () => void;
}

export function AdminDeductBalanceForm({ onSuccess }: AdminDeductBalanceFormProps) {
  const dispatch = useAppDispatch();
  const [activeRole, setActiveRole] = useState("");
  const { masterDistributors, distributors, retailers, deductLoading, error } =
    useAppSelector((state) => state.adminModule);

  useEffect(() => {
    if (!activeRole) return;

    switch (normalizeTransferRole(activeRole)) {
      case "MASTER_DISTRIBUTOR":
        dispatch(fetchAdminMasterDistributors(LIST_PARAMS));
        break;
      case "DISTRIBUTOR":
        dispatch(fetchAdminDistributors(LIST_PARAMS));
        break;
      case "RETAILER":
        dispatch(fetchAdminRetailers(LIST_PARAMS));
        break;
      default:
        break;
    }
  }, [activeRole, dispatch]);

  const receivers = useMemo(() => {
    switch (normalizeTransferRole(activeRole)) {
      case "MASTER_DISTRIBUTOR":
        return masterDistributors.data
          .map((user) => adminNetworkUserToReceiver(user, "MASTER_DISTRIBUTOR"))
          .filter((receiver): receiver is NonNullable<typeof receiver> =>
            Boolean(receiver)
          );
      case "DISTRIBUTOR":
        return distributors.data
          .map((user) => adminNetworkUserToReceiver(user, "DISTRIBUTOR"))
          .filter((receiver): receiver is NonNullable<typeof receiver> =>
            Boolean(receiver)
          );
      case "RETAILER":
        return retailers.data
          .map((user) => adminNetworkUserToReceiver(user, "RETAILER"))
          .filter((receiver): receiver is NonNullable<typeof receiver> =>
            Boolean(receiver)
          );
      default:
        return [];
    }
  }, [activeRole, masterDistributors.data, distributors.data, retailers.data]);

  const isLoadingReceivers = useMemo(() => {
    switch (normalizeTransferRole(activeRole)) {
      case "MASTER_DISTRIBUTOR":
        return masterDistributors.isLoading;
      case "DISTRIBUTOR":
        return distributors.isLoading;
      case "RETAILER":
        return retailers.isLoading;
      default:
        return false;
    }
  }, [
    activeRole,
    masterDistributors.isLoading,
    distributors.isLoading,
    retailers.isLoading,
  ]);

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
      if (activeRole) {
        switch (normalizeTransferRole(activeRole)) {
          case "MASTER_DISTRIBUTOR":
            dispatch(fetchAdminMasterDistributors(LIST_PARAMS));
            break;
          case "DISTRIBUTOR":
            dispatch(fetchAdminDistributors(LIST_PARAMS));
            break;
          case "RETAILER":
            dispatch(fetchAdminRetailers(LIST_PARAMS));
            break;
        }
      }
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
      error={error}
      roleOptions={ADMIN_ROLE_OPTIONS}
      onRoleChange={setActiveRole}
      onSubmit={handleSubmit}
    />
  );
}
