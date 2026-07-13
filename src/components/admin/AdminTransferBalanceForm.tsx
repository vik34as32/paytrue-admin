"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { WalletTransferForm } from "@/components/wallet/WalletTransferForm";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  adminTransferBalance,
  fetchAdminDistributors,
  fetchAdminMasterDistributors,
  fetchAdminRetailers,
} from "@/store/api/adminModuleApi";
import {
  resolveAdminPrimaryBalance,
  selectAdminBalance,
} from "@/store/selectors/adminSelectors";
import {
  adminNetworkUserToReceiver,
  normalizeTransferRole,
} from "@/lib/walletTransferOptions";
import type { WalletTransferFormData } from "@/validations";

const ADMIN_ROLE_OPTIONS = [
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
];

const LIST_PARAMS = { page: 1, pageSize: 100 };

interface AdminTransferBalanceFormProps {
  onSuccess?: () => void;
}

export function AdminTransferBalanceForm({
  onSuccess,
}: AdminTransferBalanceFormProps) {
  const dispatch = useAppDispatch();
  const [activeRole, setActiveRole] = useState("");
  const balance = useAppSelector(selectAdminBalance);
  const { masterDistributors, distributors, retailers, transferLoading, error } =
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
      toast.error((result.payload as string) || "Transfer failed");
    }
  };

  return (
    <WalletTransferForm
      receivers={receivers}
      currentBalance={resolveAdminPrimaryBalance(balance)}
      isLoadingReceivers={isLoadingReceivers}
      isSubmitting={transferLoading}
      error={error}
      roleOptions={ADMIN_ROLE_OPTIONS}
      onRoleChange={setActiveRole}
      onSubmit={handleSubmit}
    />
  );
}
