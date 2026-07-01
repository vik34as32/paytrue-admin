"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminTransferBalanceForm } from "@/components/admin/AdminTransferBalanceForm";
import { AdminTransferHistoryTable } from "@/components/admin/AdminTransferHistoryTable";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminWalletBalance } from "@/store/api/adminModuleApi";
import { resolveAdminPrimaryBalance } from "@/store/selectors/adminSelectors";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";

export function AdminBalanceTransferView() {
  const dispatch = useAppDispatch();
  const adminBalance = useAppSelector((state) => state.adminModule.balance);
  const { isLoadingBalance } = useAppSelector((state) => state.adminModule);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useEffect(() => {
    dispatch(fetchAdminWalletBalance({ force: true }));
  }, [dispatch]);

  const balance = resolveAdminPrimaryBalance(adminBalance);

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Admin"
        title="Balance Transfer"
        subtitle="Transfer balance to your master distributors only"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-card">
          <CardHeader
            title="Wallet Balance"
            subtitle="Your admin wallet balance"
            action={
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
            }
          />
          <p className="text-3xl font-bold text-primary">
            {isLoadingBalance ? "..." : formatCurrency(balance)}
          </p>
        </Card>
        <Card>
          <CardHeader
            title="Transfer to Master Distributor"
            subtitle="Funds will be deducted from your wallet"
          />
          <AdminTransferBalanceForm
            onSuccess={() => setHistoryRefreshKey((key) => key + 1)}
          />
        </Card>
      </div>

      <AdminTransferHistoryTable refreshKey={historyRefreshKey} />
    </div>
  );
}
