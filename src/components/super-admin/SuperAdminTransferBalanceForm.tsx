"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { WalletTransferForm } from "@/components/wallet/WalletTransferForm";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { transferToAdmin } from "@/store/api/superAdminWalletApi";
import {
  fetchAdminsList,
  fetchDistributors,
  fetchMasterDistributors,
  fetchRetailers,
} from "@/store/api/superAdminApi";
import {
  adminRecordToReceiver,
  networkUserToReceiver,
  normalizeTransferRole,
} from "@/lib/walletTransferOptions";
import { resolvePrimaryBalance } from "@/lib/walletBalance";
import type { WalletTransferFormData } from "@/validations";

const SUPER_ADMIN_ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
];

const LIST_PARAMS = { page: 1, pageSize: 100 };

interface SuperAdminTransferBalanceFormProps {
  onSuccess?: () => void;
}

export function SuperAdminTransferBalanceForm({
  onSuccess,
}: SuperAdminTransferBalanceFormProps) {
  const dispatch = useAppDispatch();
  const [activeRole, setActiveRole] = useState("");
  const walletBalance = useAppSelector((state) => state.superAdminWallet.balance);
  const { transferLoading, error } = useAppSelector(
    (state) => state.superAdminWallet
  );
  const { masterDistributors, distributors, retailers, adminsList } =
    useAppSelector((state) => state.superAdmin);

  useEffect(() => {
    if (!activeRole) return;

    switch (normalizeTransferRole(activeRole)) {
      case "ADMIN":
        dispatch(fetchAdminsList(LIST_PARAMS));
        break;
      case "MASTER_DISTRIBUTOR":
        dispatch(fetchMasterDistributors(LIST_PARAMS));
        break;
      case "DISTRIBUTOR":
        dispatch(fetchDistributors(LIST_PARAMS));
        break;
      case "RETAILER":
        dispatch(fetchRetailers(LIST_PARAMS));
        break;
      default:
        break;
    }
  }, [activeRole, dispatch]);

  const receivers = useMemo(() => {
    switch (normalizeTransferRole(activeRole)) {
      case "ADMIN":
        return adminsList.data
          .map(adminRecordToReceiver)
          .filter((receiver): receiver is NonNullable<typeof receiver> =>
            Boolean(receiver)
          );
      case "MASTER_DISTRIBUTOR":
        return masterDistributors.data
          .map((user) => networkUserToReceiver(user, "MASTER_DISTRIBUTOR"))
          .filter((receiver): receiver is NonNullable<typeof receiver> =>
            Boolean(receiver)
          );
      case "DISTRIBUTOR":
        return distributors.data
          .map((user) => networkUserToReceiver(user, "DISTRIBUTOR"))
          .filter((receiver): receiver is NonNullable<typeof receiver> =>
            Boolean(receiver)
          );
      case "RETAILER":
        return retailers.data
          .map((user) => networkUserToReceiver(user, "RETAILER"))
          .filter((receiver): receiver is NonNullable<typeof receiver> =>
            Boolean(receiver)
          );
      default:
        return [];
    }
  }, [
    activeRole,
    adminsList.data,
    masterDistributors.data,
    distributors.data,
    retailers.data,
  ]);

  const isLoadingReceivers = useMemo(() => {
    switch (normalizeTransferRole(activeRole)) {
      case "ADMIN":
        return adminsList.isLoading;
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
    adminsList.isLoading,
    masterDistributors.isLoading,
    distributors.isLoading,
    retailers.isLoading,
  ]);

  const currentBalance = resolvePrimaryBalance(walletBalance);

  const handleSubmit = async (data: WalletTransferFormData) => {
    const result = await dispatch(transferToAdmin(data));

    if (transferToAdmin.fulfilled.match(result)) {
      toast.success("Balance transferred successfully");
      if (activeRole) {
        switch (normalizeTransferRole(activeRole)) {
          case "ADMIN":
            dispatch(fetchAdminsList(LIST_PARAMS));
            break;
          case "MASTER_DISTRIBUTOR":
            dispatch(fetchMasterDistributors(LIST_PARAMS));
            break;
          case "DISTRIBUTOR":
            dispatch(fetchDistributors(LIST_PARAMS));
            break;
          case "RETAILER":
            dispatch(fetchRetailers(LIST_PARAMS));
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
      currentBalance={currentBalance}
      isLoadingReceivers={isLoadingReceivers}
      isSubmitting={transferLoading}
      error={error}
      roleOptions={SUPER_ADMIN_ROLE_OPTIONS}
      showBalance={false}
      onRoleChange={setActiveRole}
      onSubmit={handleSubmit}
    />
  );
}
