"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { WalletBalanceCard } from "@/components/super-admin/WalletBalanceCard";
import { SuperAdminTransferBalanceForm } from "@/components/super-admin/SuperAdminTransferBalanceForm";
import { SuperAdminWalletHistoryTable } from "@/components/super-admin/SuperAdminWalletHistoryTable";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { ROUTES } from "@/constants";

export default function SuperAdminTransferBalancePage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useWalletBalance({ autoFetch: hasSuperAdminWalletAccess });

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Super Admin"
        title="Transfer Balance"
        subtitle="Transfer wallet balance to admins, master distributors, distributors and retailers"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <WalletBalanceCard />
        <Card>
          <CardHeader
            title="Transfer Balance"
            subtitle="Select a user and transfer funds from your wallet"
          />
          <SuperAdminTransferBalanceForm
            onSuccess={() => setHistoryRefreshKey((key) => key + 1)}
          />
        </Card>
      </div>

      <SuperAdminWalletHistoryTable
        variant="transfer"
        refreshKey={historyRefreshKey}
      />
    </div>
  );
}
