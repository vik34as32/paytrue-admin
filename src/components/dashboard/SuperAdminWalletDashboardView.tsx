"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { WalletBalanceCard } from "@/components/super-admin/WalletBalanceCard";
import { TransferBalanceModal } from "@/components/super-admin/TransferBalanceModal";
import { AddBalanceModal } from "@/components/super-admin/AddBalanceModal";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchWalletHistory } from "@/store/api/superAdminWalletApi";
import { fetchDashboard } from "@/store/api/superAdminApi";
import { selectDashboard } from "@/store/selectors/superAdminSelectors";
import { selectRecentTransfers } from "@/store/selectors/walletSelectors";
import { ROUTES, GRADIENT_CARDS } from "@/constants";
import { WalletHistoryRecord } from "@/types/superAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { resolvePrimaryBalance } from "@/lib/walletBalance";
import {
  ArrowRightLeft,
  History,
  ArrowRight,
  IndianRupee,
  Users,
  Store,
  Building2,
  TrendingUp,
  Landmark,
} from "lucide-react";

const historyColumns: ColumnDef<WalletHistoryRecord, unknown>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) =>
      formatDate(row.original.date || row.original.createdAt || ""),
  },
  {
    accessorKey: "transactionType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="default">{row.original.transactionType}</Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="font-semibold">{formatCurrency(row.original.amount)}</span>
    ),
  },
  {
    accessorKey: "adminName",
    header: "Admin",
    cell: ({ row }) => row.original.adminName || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={(row.original.status as "success" | "pending") || "default"}>
        {row.original.status || "—"}
      </Badge>
    ),
  },
];

function dashboardValue(
  dashboard: ReturnType<typeof selectDashboard>,
  balance: ReturnType<typeof resolvePrimaryBalance> extends infer T ? T : never,
  key: string,
  fallback = 0
): string | number {
  if (!dashboard) return "...";
  const val = dashboard[key];
  if (typeof val === "number") return val;
  if (key === "walletBalance") return formatCurrency(Number(balance) || 0);
  return fallback;
}

export function SuperAdminWalletDashboardView() {
  const dispatch = useAppDispatch();
  const [transferOpen, setTransferOpen] = useState(false);
  const [addBalanceOpen, setAddBalanceOpen] = useState(false);
  useWalletBalance({ autoFetch: true });

  const dashboard = useAppSelector(selectDashboard);
  const recentTransfers = useAppSelector(selectRecentTransfers);
  const { balance, isLoadingBalance } = useAppSelector(
    (state) => state.superAdminWallet
  );
  const { isLoadingDashboard, error } = useAppSelector((state) => state.superAdmin);

  const primaryBalance = resolvePrimaryBalance(balance);

  useEffect(() => {
    dispatch(fetchDashboard({ force: true }));
    dispatch(fetchWalletHistory({ page: 1, pageSize: 5 }));
  }, [dispatch]);

  const statCards = [
    {
      title: "Total Admin",
      value: dashboardValue(dashboard, primaryBalance, "totalAdmin"),
      icon: <Users className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[0],
    },
    {
      title: "Master Distributors",
      value: dashboardValue(dashboard, primaryBalance, "totalMasterDistributor"),
      icon: <Building2 className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[1],
    },
    {
      title: "Distributors",
      value: dashboardValue(dashboard, primaryBalance, "totalDistributor"),
      icon: <Store className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[2],
    },
    {
      title: "Retailers",
      value: dashboardValue(dashboard, primaryBalance, "totalRetailer"),
      icon: <Users className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[3],
    },
    {
      title: "Total Transfers",
      value: dashboardValue(dashboard, primaryBalance, "totalTransfers"),
      icon: <ArrowRightLeft className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[4],
    },
    {
      title: "Total Business",
      value: isLoadingDashboard
        ? "..."
        : typeof dashboard?.totalBusiness === "number"
          ? formatCurrency(dashboard.totalBusiness)
          : dashboardValue(dashboard, primaryBalance, "totalBusiness"),
      icon: <TrendingUp className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[5],
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Super Admin Dashboard"
        subtitle="Wallet balance, network overview, and recent activity"
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={ROUTES.superAdminBankAccounts}>
              <Button variant="outline">
                <Landmark className="h-4 w-4" />
                Add Account
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setAddBalanceOpen(true)}>
              <IndianRupee className="h-4 w-4" />
              Add Balance
            </Button>
            <Button onClick={() => setTransferOpen(true)}>
              <ArrowRightLeft className="h-4 w-4" />
              Transfer Balance
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <WalletBalanceCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            gradient={`bg-gradient-to-br ${card.gradient}`}
          />
        ))}
      </div>

      {/* <Card>
        <CardHeader
          title="Recent Transfers"
          subtitle="Latest wallet transactions"
          action={
            <Link href={ROUTES.superAdminWalletHistory}>
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        />
        <DataTable
          data={recentTransfers}
          columns={historyColumns}
          pageSize={5}
          hideSearch
        />
      </Card> */}

      <TransferBalanceModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
      />
      <AddBalanceModal
        isOpen={addBalanceOpen}
        onClose={() => setAddBalanceOpen(false)}
        currentBalance={primaryBalance}
      />
    </div>
  );
}
