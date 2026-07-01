"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/modals/Modal";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { superAdminTransferSchema, SuperAdminTransferFormData } from "@/validations";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  transferToAdmin,
  fetchAllAdmins,
} from "@/store/api/superAdminWalletApi";
import { useAdminSelectOptions } from "@/components/super-admin/AdminListTable";
import { getAdminDisplayName, getAdminBalance, getAdminId } from "@/services/admin";
import { formatCurrency } from "@/lib/utils";
import { IndianRupee } from "lucide-react";
import { useWalletBalance } from "@/hooks/useWalletBalance";

interface TransferBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferSuccess?: () => void;
}

export function TransferBalanceModal({
  isOpen,
  onClose,
  onTransferSuccess,
}: TransferBalanceModalProps) {
  const dispatch = useAppDispatch();
  const { admins, transferLoading, isLoadingAdmins } = useAppSelector(
    (state) => state.superAdminWallet
  );
  const { balance } = useWalletBalance({ autoFetch: false });
  const adminOptions = useAdminSelectOptions(admins);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SuperAdminTransferFormData>({
    resolver: zodResolver(superAdminTransferSchema),
  });

  const selectedAdminId = watch("adminId");
  const selectedAdmin = admins.find((a) => getAdminId(a) === selectedAdminId);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAllAdmins());
    }
  }, [isOpen, dispatch]);

  const onSubmit = async (data: SuperAdminTransferFormData) => {
    const result = await dispatch(transferToAdmin(data));
    if (transferToAdmin.fulfilled.match(result)) {
      toast.success("Balance transferred successfully");
      reset();
      onTransferSuccess?.();
      onClose();
    } else {
      toast.error((result.payload as string) || "Transfer failed");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const walletBalance =
    balance?.balance ?? balance?.totalBalance ?? balance?.virtualBalance ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Transfer Balance"
      subtitle="Send balance to an admin account"
      size="lg"
    >
      <div className="mb-4 rounded-xl bg-primary/5 px-4 py-3">
        <p className="text-xs text-muted">Super Admin Wallet Balance</p>
        <p className="text-xl font-bold text-primary">{formatCurrency(walletBalance)}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Select Admin"
          options={[
            {
              value: "",
              label: isLoadingAdmins ? "Loading admins..." : "Select an admin",
            },
            ...adminOptions.map((o) => ({ value: o.value, label: o.label })),
          ]}
          error={errors.adminId?.message}
          {...register("adminId")}
        />

        {selectedAdmin && (
          <div className="rounded-xl bg-background/50 px-4 py-3 text-sm">
            <p className="font-semibold">{getAdminDisplayName(selectedAdmin)}</p>
            <p className="text-muted">
              Current balance: {formatCurrency(getAdminBalance(selectedAdmin))}
            </p>
          </div>
        )}

        <Input
          label="Amount (₹)"
          type="number"
          placeholder="Enter transfer amount"
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
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={transferLoading}>
            Transfer Balance
          </Button>
        </div>
      </form>
    </Modal>
  );
}
