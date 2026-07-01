"use client";

import { useState } from "react";
import Link from "next/link";
import { useRoleAccess } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { AdminTransferBalanceForm } from "@/components/admin/AdminTransferBalanceForm";
import { TransferBalanceModal } from "@/components/super-admin/TransferBalanceModal";
import { ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/utils";
import { resolveAdminPrimaryBalance } from "@/store/selectors/adminSelectors";
import { useAppSelector } from "@/hooks/useAppStore";
import { ArrowRightLeft, Wallet } from "lucide-react";

export default function BalanceTransferPage() {
  const { isSuperAdminApiAuth, isAdminApiAuth } = useRoleAccess();
  const [modalOpen, setModalOpen] = useState(false);
  const adminBalance = useAppSelector((state) => state.adminModule.balance);

  if (isAdminApiAuth) {
    const balance = resolveAdminPrimaryBalance(adminBalance);
    return (
      <div className="page-container">
        <PageHeader
          breadcrumb="Admin"
          title="Balance Transfer"
          subtitle="Transfer balance to your master distributors only"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-card">
            <CardHeader
              title="Available Balance"
              subtitle="Your admin wallet balance"
              action={
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
              }
            />
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(balance)}
            </p>
          </Card>
          <Card>
            <CardHeader
              title="Transfer to Master Distributor"
              subtitle="Funds will be deducted from your wallet"
            />
            <AdminTransferBalanceForm />
          </Card>
        </div>
      </div>
    );
  }

  if (isSuperAdminApiAuth) {
    return (
      <div className="page-container">
        <PageHeader
          breadcrumb="Finance"
          title="Balance Transfer"
          subtitle="Transfer balance using super admin API"
        />
        <Card>
          <CardHeader
            title="Super Admin Transfer"
            subtitle="Send balance to admin accounts via live API"
          />
          <Button onClick={() => setModalOpen(true)}>
            <ArrowRightLeft className="h-4 w-4" />
            Open Transfer Modal
          </Button>
          <TransferBalanceModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </Card>
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
