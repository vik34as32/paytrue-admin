"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  fetchAdminDistributors,
  fetchAdminMasterDistributors,
  fetchAdminRetailers,
} from "@/store/api/adminModuleApi";
import {
  assignBankAccountToUser,
  getAdminBankAccounts,
  getNetworkUserName,
} from "@/services/adminApi";
import { AdminNetworkUser } from "@/types/admin";
import { BankAccountRecord } from "@/types/bankAccount";

type AssignUserType = "MASTER_DISTRIBUTOR" | "DISTRIBUTOR" | "RETAILER";

const USER_TYPE_OPTIONS = [
  { value: "", label: "Select user type" },
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
];

interface AdminAssignBankAccountFormProps {
  isOpen?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AdminAssignBankAccountForm({
  isOpen = true,
  onSuccess,
  onCancel,
}: AdminAssignBankAccountFormProps) {
  const dispatch = useAppDispatch();
  const { masterDistributors, distributors, retailers } = useAppSelector(
    (state) => state.adminModule
  );

  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankAccountId, setBankAccountId] = useState("");
  const [userType, setUserType] = useState<AssignUserType | "">("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setBankAccountId("");
      setUserType("");
      setUserId("");
      return;
    }

    dispatch(fetchAdminMasterDistributors({ page: 1, pageSize: 200 }));
    dispatch(fetchAdminDistributors({ page: 1, pageSize: 200 }));
    dispatch(fetchAdminRetailers({ page: 1, pageSize: 200 }));

    setIsLoadingBanks(true);
    getAdminBankAccounts()
      .then(setBankAccounts)
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load bank accounts"
        );
      })
      .finally(() => setIsLoadingBanks(false));
  }, [dispatch, isOpen]);

  const usersForType = useMemo(() => {
    switch (userType) {
      case "MASTER_DISTRIBUTOR":
        return masterDistributors.data;
      case "DISTRIBUTOR":
        return distributors.data;
      case "RETAILER":
        return retailers.data;
      default:
        return [];
    }
  }, [userType, masterDistributors.data, distributors.data, retailers.data]);

  const bankOptions = useMemo(
    () =>
      bankAccounts.length > 0
        ? bankAccounts.map((bank) => ({
            value: bank.id,
            label: `${bank.bankName} — ${bank.accountNumber} (${bank.ifscCode})`,
          }))
        : [
            {
              value: "",
              label: isLoadingBanks
                ? "Loading bank accounts..."
                : "No bank accounts available",
            },
          ],
    [bankAccounts, isLoadingBanks]
  );

  const userOptions = useMemo(() => {
    if (!userType) {
      return [{ value: "", label: "Select user type first" }];
    }

    if (usersForType.length === 0) {
      return [{ value: "", label: "No users found for this type" }];
    }

    return usersForType.map((user: AdminNetworkUser) => ({
      value: user.id,
      label: `${getNetworkUserName(user)}${user.mobile ? ` — ${user.mobile}` : ""}`,
    }));
  }, [userType, usersForType]);

  const isLoadingUsers =
    (userType === "MASTER_DISTRIBUTOR" && masterDistributors.isLoading) ||
    (userType === "DISTRIBUTOR" && distributors.isLoading) ||
    (userType === "RETAILER" && retailers.isLoading);

  const handleAssign = async () => {
    if (!bankAccountId) {
      toast.error("Please select a bank account");
      return;
    }
    if (!userId) {
      toast.error("Please select a user");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignBankAccountToUser({ userId, bankAccountId });
      toast.success("Bank account assigned successfully");
      setBankAccountId("");
      setUserType("");
      setUserId("");
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign bank account"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleAssign();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Bank Account"
          value={bankAccountId}
          onChange={(event) => setBankAccountId(event.target.value)}
          options={[{ value: "", label: "Select bank account" }, ...bankOptions]}
          disabled={isLoadingBanks}
        />

        <Select
          label="User Type"
          value={userType}
          onChange={(event) => {
            setUserType(event.target.value as AssignUserType | "");
            setUserId("");
          }}
          options={USER_TYPE_OPTIONS}
        />

        <Select
          label={
            userType === "MASTER_DISTRIBUTOR"
              ? "Master Distributor"
              : userType === "DISTRIBUTOR"
                ? "Distributor"
                : userType === "RETAILER"
                  ? "Retailer"
                  : "User"
          }
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          options={[{ value: "", label: "Select user" }, ...userOptions]}
          disabled={!userType || isLoadingUsers}
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isLoadingBanks || isLoadingUsers || !bankAccountId || !userId}
        >
          Assign Bank Account
        </Button>
      </div>
    </form>
  );
}
