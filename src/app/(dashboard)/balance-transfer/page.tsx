"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRoleAccess } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { AdminBalanceTransferView } from "@/components/admin/AdminBalanceTransferView";
import { SuperAdminTransferBalanceForm } from "@/components/super-admin/SuperAdminTransferBalanceForm";
import { SuperAdminWalletHistoryTable } from "@/components/super-admin/SuperAdminWalletHistoryTable";
import { WalletBalanceCard } from "@/components/super-admin/WalletBalanceCard";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { ROUTES } from "@/constants";
import { useState } from "react";

export default function BalanceTransferPage() {
  const router = useRouter();
  const { isSuperAdminApiAuth, isAdminApiAuth } = useRoleAccess();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useWalletBalance({ autoFetch: isSuperAdminApiAuth && hasSuperAdminWalletAccess });

  useEffect(() => {
    if (isSuperAdminApiAuth && !hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, isSuperAdminApiAuth, router]);

  if (isAdminApiAuth) {
    return <AdminBalanceTransferView />;
  }

  if (isSuperAdminApiAuth) {
    if (!hasSuperAdminWalletAccess) return null;

    return (
      <div className="page-container space-y-6">
        <PageHeader
          breadcrumb="Super Admin"
          title="Balance Transfer"
          subtitle="Transfer wallet balance to admins, master distributors, distributors and retailers"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <WalletBalanceCard />
          <Card>
            <CardHeader
              title="Transfer Balance"
              subtitle="Select role, then choose user and transfer funds"
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

  return (
    <div className="page-container">
      <PageHeader breadcrumb="Finance" title="Balance Transfer" subtitle="Transfer balance" />
      <Card>
        <CardHeader title="Access restricted" subtitle="Sign in as admin to transfer balance" />
        <Link href={ROUTES.login}>
          <Button variant="outline">Go to Login</Button>
        </Link>
      </Card>
    </div>
  );
}
