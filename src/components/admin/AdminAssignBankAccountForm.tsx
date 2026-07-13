"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { assignBankAccountToUser } from "@/services/adminApi";
import {
  getPublicNetworkUserLabel,
  getPublicNetworkUsers,
  PublicNetworkUser,
  PublicNetworkUserType,
} from "@/services/publicNetworkUsersApi";
import { BankAccountRecord } from "@/types/bankAccount";

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
  bankAccounts?: BankAccountRecord[];
  isLoadingBanks?: boolean;
}

export function AdminAssignBankAccountForm({
  isOpen = true,
  onSuccess,
  onCancel,
  bankAccounts = [],
  isLoadingBanks = false,
}: AdminAssignBankAccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankAccountId, setBankAccountId] = useState("");
  const [userType, setUserType] = useState<PublicNetworkUserType | "">("");
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState<PublicNetworkUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setBankAccountId("");
      setUserType("");
      setUserId("");
      setUsers([]);
      setUsersError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !userType) {
      setUsers([]);
      setUsersError(null);
      setIsLoadingUsers(false);
      return;
    }

    let cancelled = false;

    async function loadUsers() {
      setIsLoadingUsers(true);
      setUsersError(null);
      setUsers([]);
      try {
        const data = await getPublicNetworkUsers(userType as PublicNetworkUserType);
        if (!cancelled) {
          setUsers(data);
        }
      } catch (error) {
        if (!cancelled) {
          setUsers([]);
          setUsersError(
            error instanceof Error
              ? error.message
              : "Failed to load network users"
          );
        }
      } finally {
        if (!cancelled) setIsLoadingUsers(false);
      }
    }

    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, [isOpen, userType]);

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
    if (isLoadingUsers) {
      return [{ value: "", label: "Loading users..." }];
    }
    if (usersError) {
      return [{ value: "", label: "Failed to load users" }];
    }
    if (users.length === 0) {
      return [{ value: "", label: "No users found for this type" }];
    }
    return users.map((user) => ({
      value: user.id,
      label: getPublicNetworkUserLabel(user),
    }));
  }, [userType, isLoadingUsers, usersError, users]);

  const userLabel =
    userType === "MASTER_DISTRIBUTOR"
      ? "Master Distributor"
      : userType === "DISTRIBUTOR"
        ? "Distributor"
        : userType === "RETAILER"
          ? "Retailer"
          : "User";

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
      await assignBankAccountToUser({
        userIds: [userId],
        bankAccountId,
      }).then((result) => {
        toast.success(result.message);
      });
      setBankAccountId("");
      setUserType("");
      setUserId("");
      setUsers([]);
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
            setUserType(event.target.value as PublicNetworkUserType | "");
            setUserId("");
          }}
          options={USER_TYPE_OPTIONS}
        />

        <div className="md:col-span-2">
          <Select
            label={userLabel}
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            options={[{ value: "", label: "Select user" }, ...userOptions]}
            disabled={!userType || isLoadingUsers}
          />
          {usersError ? (
            <p className="mt-2 text-sm text-accent-red">{usersError}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={
            isLoadingBanks || isLoadingUsers || !bankAccountId || !userId
          }
        >
          Assign Bank Account
        </Button>
      </div>
    </form>
  );
}
