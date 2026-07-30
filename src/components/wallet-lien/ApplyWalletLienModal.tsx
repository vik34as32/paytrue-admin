"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import {
  applyWalletLienSchema,
  ApplyWalletLienFormValues,
} from "@/schemas/wallet-lien.schema";
import { formatCurrency } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
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

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
];

interface ApplyWalletLienModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ApplyWalletLienFormValues) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function ApplyWalletLienModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ApplyWalletLienModalProps) {
  const dispatch = useAppDispatch();
  const [role, setRole] = useState("ADMIN");
  const { masterDistributors, distributors, retailers, adminsList } =
    useAppSelector((state) => state.superAdmin);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ApplyWalletLienFormValues>({
    resolver: zodResolver(applyWalletLienSchema),
    defaultValues: {
      userId: "",
      amount: 0,
      reason: "",
      remarks: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ userId: "", amount: 0, reason: "", remarks: "" });
    setRole("ADMIN");
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const params = { page: 1, pageSize: 100 };
    switch (normalizeTransferRole(role)) {
      case "ADMIN":
        dispatch(fetchAdminsList(params));
        break;
      case "MASTER_DISTRIBUTOR":
        dispatch(fetchMasterDistributors(params));
        break;
      case "DISTRIBUTOR":
        dispatch(fetchDistributors(params));
        break;
      case "RETAILER":
        dispatch(fetchRetailers(params));
        break;
      default:
        break;
    }
  }, [dispatch, isOpen, role]);

  const users = useMemo(() => {
    switch (normalizeTransferRole(role)) {
      case "ADMIN":
        return adminsList.data
          .map(adminRecordToReceiver)
          .filter(Boolean);
      case "MASTER_DISTRIBUTOR":
        return masterDistributors.data
          .map((u) => networkUserToReceiver(u, "MASTER_DISTRIBUTOR"))
          .filter(Boolean);
      case "DISTRIBUTOR":
        return distributors.data
          .map((u) => networkUserToReceiver(u, "DISTRIBUTOR"))
          .filter(Boolean);
      case "RETAILER":
        return retailers.data
          .map((u) => networkUserToReceiver(u, "RETAILER"))
          .filter(Boolean);
      default:
        return [];
    }
  }, [
    role,
    adminsList.data,
    masterDistributors.data,
    distributors.data,
    retailers.data,
  ]);

  const userId = watch("userId");
  const amount = Number(watch("amount") || 0);
  const selected = users.find((u) => u?.id === userId) || null;
  const mainBalance = selected?.balance ?? 0;
  const currentLien = 0;
  const available = Math.max(0, mainBalance - currentLien);
  const afterLien = Math.max(0, available - (Number.isFinite(amount) ? amount : 0));

  const userOptions = [
    { value: "", label: "Select user" },
    ...users
      .filter((u): u is NonNullable<typeof u> => !!u)
      .map((u) => ({
        value: u.id,
        label: `${u.name} · ${u.mobile || "—"} · ${formatCurrency(u.balance)}`,
      })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Wallet Lien"
      subtitle="Hold amount from a user's main wallet"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="apply-wallet-lien-form"
            isLoading={isSubmitting}
          >
            Apply
          </Button>
        </div>
      }
    >
      <form
        id="apply-wallet-lien-form"
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const ok = await onSubmit(values);
          if (ok) onClose();
        })}
      >
        <Select
          label="User Role"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setValue("userId", "");
          }}
        />

        <Select
          label="User Search"
          options={userOptions}
          value={userId}
          onChange={(e) => setValue("userId", e.target.value, { shouldValidate: true })}
          error={errors.userId?.message}
        />

        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          {...register("amount", { valueAsNumber: true })}
          error={errors.amount?.message}
        />

        <Input
          label="Reason"
          {...register("reason")}
          error={errors.reason?.message}
        />

        <Input
          label="Remarks"
          {...register("remarks")}
          error={errors.remarks?.message}
        />

        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">
            Live Preview
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PreviewRow label="Main Wallet Balance" value={formatCurrency(mainBalance)} />
            <PreviewRow label="Current Lien" value={formatCurrency(currentLien)} />
            <PreviewRow label="Available Balance" value={formatCurrency(available)} />
            <PreviewRow
              label="Balance After Lien"
              value={formatCurrency(afterLien)}
              emphasize
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

function PreviewRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={
          emphasize
            ? "mt-1 text-base font-bold text-primary"
            : "mt-1 text-sm font-semibold text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}
