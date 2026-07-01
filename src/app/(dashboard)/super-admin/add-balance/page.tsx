"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { AddBalanceForm } from "@/components/super-admin/AddBalanceForm";
import { WalletBalanceCard } from "@/components/super-admin/WalletBalanceCard";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useRoleAccess } from "@/hooks/useAuth";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { resolvePrimaryBalance } from "@/lib/walletBalance";
import { useAppSelector } from "@/hooks/useAppStore";
import { ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";

export default function AddBalancePage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess, hasAdminWalletAccess } = useSuperAdminAuth();
  const { user } = useRoleAccess();
  const walletBalance = useAppSelector((state) => state.superAdminWallet.balance);

  const canAccess = hasSuperAdminWalletAccess || hasAdminWalletAccess;

  useWalletBalance({ autoFetch: hasSuperAdminWalletAccess });

  useEffect(() => {
    if (!canAccess) {
      router.replace(ROUTES.login);
    }
  }, [canAccess, router]);

  if (!canAccess) return null;

  const currentBalance = hasSuperAdminWalletAccess
    ? resolvePrimaryBalance(walletBalance)
    : user?.balance ?? 0;

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb={hasSuperAdminWalletAccess ? "Super Admin" : "Admin"}
        title="Add Balance"
        subtitle="Top up your wallet balance"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {hasSuperAdminWalletAccess ? (
          <WalletBalanceCard />
        ) : (
          <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-card">
            <CardHeader
              title="Current Balance"
              subtitle="Your admin wallet balance"
              action={
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
              }
            />
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(currentBalance)}
            </p>
          </Card>
        )}

        <Card>
          <CardHeader
            title="Add Balance"
            subtitle="Enter amount and remarks to credit your wallet"
          />
          <AddBalanceForm currentBalance={currentBalance} />
        </Card>
      </div>
    </div>
  );
}
