"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminDashboard } from "@/store/api/adminModuleApi";
import {
  selectAdminDashboard,
  selectAdminBalance,
  resolveAdminPrimaryBalance,
  getDashboardMetric,
} from "@/store/selectors/adminSelectors";
import { ROUTES, GRADIENT_CARDS } from "@/constants";
import { AdminActivityItem } from "@/types/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  ArrowRightLeft,
  Users,
  Store,
  Building2,
} from "lucide-react";

const activityColumns: ColumnDef<AdminActivityItem, unknown>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) =>
      formatDate(row.original.createdAt || row.original.date || ""),
  },
  { accessorKey: "title", header: "Activity" },
  { accessorKey: "description", header: "Details" },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) =>
      row.original.amount != null
        ? formatCurrency(row.original.amount)
        : "—",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="default">{row.original.type || "—"}</Badge>
    ),
  },
];

export function AdminDashboardView() {
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector(selectAdminDashboard);
  const balance = useAppSelector(selectAdminBalance);
  const { isLoadingDashboard, isLoadingBalance, error } = useAppSelector(
    (state) => state.adminModule
  );

  useEffect(() => {
    dispatch(fetchAdminDashboard({ force: true }));
  }, [dispatch]);

  const primaryBalance = resolveAdminPrimaryBalance(balance);
  const recentActivity = dashboard?.recentActivity ?? [];

  const statCards = [
    {
      title: "Wallet Balance",
      value:
        isLoadingBalance || isLoadingDashboard
          ? "..."
          : formatCurrency(
              getDashboardMetric(dashboard, ["walletBalance"]) || primaryBalance
            ),
      icon: <Wallet className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[0],
    },
    {
      title: "Today's Business",
      value: formatCurrency(
        getDashboardMetric(dashboard, ["todaysBusiness", "todayBusiness"])
      ),
      icon: <TrendingUp className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[1],
    },
    {
      title: "Total Business",
      value: formatCurrency(
        getDashboardMetric(dashboard, ["totalBusiness"])
      ),
      icon: <TrendingUp className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[2],
    },
    {
      title: "Today's Transactions",
      value: getDashboardMetric(dashboard, [
        "todaysTransactions",
        "todayTransactions",
      ]),
      icon: <ArrowRightLeft className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[3],
    },
    {
      title: "Total Transactions",
      value: getDashboardMetric(dashboard, ["totalTransactions"]),
      icon: <ArrowRightLeft className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[4],
    },
    {
      title: "Master Distributors",
      value: getDashboardMetric(dashboard, ["totalMasterDistributors"]),
      icon: <Building2 className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[5],
    },
    {
      title: "Distributors",
      value: getDashboardMetric(dashboard, ["totalDistributors"]),
      icon: <Store className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[6],
    },
    {
      title: "Retailers",
      value: getDashboardMetric(dashboard, ["totalRetailers"]),
      icon: <Users className="h-5 w-5" />,
      gradient: GRADIENT_CARDS[7],
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Admin"
        title="Admin Dashboard"
        subtitle="Wallet, business metrics, and network overview"
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

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

      {recentActivity.length > 0 && (
        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest admin activity" />
          <DataTable
            data={recentActivity}
            columns={activityColumns}
            pageSize={5}
            hideSearch
          />
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={ROUTES.balanceTransfer}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader title="Transfer Balance" subtitle="Send to master distributors" />
          </Card>
        </Link>
        <Link href={ROUTES.requests}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader title="Fund Request" subtitle="Request balance from super admin" />
          </Card>
        </Link>
        <Link href={ROUTES.masterDistributor}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader title="Master Distributors" subtitle="Manage your downline" />
          </Card>
        </Link>
        <Link href={ROUTES.reports}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader title="Business Report" subtitle="View downline business" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
