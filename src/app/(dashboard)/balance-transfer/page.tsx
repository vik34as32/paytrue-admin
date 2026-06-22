"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { transferBalance } from "@/store/slices/balanceSlice";
import { useRoleAccess } from "@/hooks/useAuth";
import { balanceTransferSchema, BalanceTransferFormData } from "@/validations";
import { Card, CardHeader } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { formatCurrency } from "@/lib/utils";
import { mockApi } from "@/services/mockApi";
import { User } from "@/types";
import { updateUser } from "@/store/slices/authSlice";

export default function BalanceTransferPage() {
  const dispatch = useAppDispatch();
  const { user } = useRoleAccess();
  const { isLoading } = useAppSelector((state) => state.balance);
  const [recipients, setRecipients] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BalanceTransferFormData>({
    resolver: zodResolver(balanceTransferSchema),
  });

  useEffect(() => {
    if (user) {
      mockApi.getAllUsersFlat().then((all) => {
        setRecipients(all.filter((u) => u.id !== user.id && u.status === "active"));
      });
    }
  }, [user]);

  const onSubmit = async (data: BalanceTransferFormData) => {
    if (!user) return;
    const result = await dispatch(
      transferBalance({ fromUserId: user.id, data })
    );
    if (transferBalance.fulfilled.match(result)) {
      toast.success("Balance transferred successfully");
      const updated = await mockApi.getUserById(user.id);
      dispatch(updateUser({ balance: updated.balance }));
      reset();
    } else {
      toast.error("Transfer failed. Check your balance.");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Balance Transfer</h1>
        <p className="text-sm text-muted">
          Transfer virtual balance to another user
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Your Balance" />
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(user.balance)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Available for transfer
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Transfer Funds" subtitle="Deduct from sender, credit receiver" />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Select
              label="Transfer To"
              options={[
                { value: "", label: "Select recipient" },
                ...recipients.map((r) => ({
                  value: r.id,
                  label: `${r.name} (${r.mobile}) - ${formatCurrency(r.balance)}`,
                })),
              ]}
              error={errors.toUserId?.message}
              {...register("toUserId")}
            />
            <Input
              label="Amount (₹)"
              type="number"
              error={errors.amount?.message}
              {...register("amount", { valueAsNumber: true })}
            />
            <Input
              label="Remarks"
              placeholder="Purpose of transfer"
              error={errors.remarks?.message}
              {...register("remarks")}
            />
            <Button type="submit" isLoading={isLoading}>
              Transfer Balance
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
