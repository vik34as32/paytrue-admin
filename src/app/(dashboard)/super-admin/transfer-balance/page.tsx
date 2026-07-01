"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { WalletBalanceCard } from "@/components/super-admin/WalletBalanceCard";
import { TransferBalanceModal } from "@/components/super-admin/TransferBalanceModal";
import { SuperAdminWalletHistoryTable } from "@/components/super-admin/SuperAdminWalletHistoryTable";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useAppDispatch } from "@/hooks/useAppStore";
import { fetchAllAdmins } from "@/store/api/superAdminWalletApi";
import { ROUTES } from "@/constants";
import { ArrowRightLeft } from "lucide-react";

export default function SuperAdminTransferBalancePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useWalletBalance({ autoFetch: hasSuperAdminWalletAccess });

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    dispatch(fetchAllAdmins());
  }, [dispatch, hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Transfer Balance"
        subtitle="Transfer virtual balance to an admin account"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <ArrowRightLeft className="h-4 w-4" />
            Transfer Balance
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <WalletBalanceCard />
        <Card>
          <CardHeader
            title="Transfer Funds"
            subtitle="Open the transfer modal to send balance to an admin"
          />
          <Button onClick={() => setModalOpen(true)}>
            <ArrowRightLeft className="h-4 w-4" />
            Open Transfer Modal
          </Button>
        </Card>
      </div>

      <SuperAdminWalletHistoryTable refreshKey={historyRefreshKey} />

      <TransferBalanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onTransferSuccess={() => setHistoryRefreshKey((key) => key + 1)}
      />
    </div>
  );
}
