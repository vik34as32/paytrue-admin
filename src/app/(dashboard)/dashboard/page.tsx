"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  fetchDashboardStats,
  fetchChartData,
  fetchRecentActivities,
  fetchLatestUsers,
  fetchLatestTransactions,
} from "@/store/slices/dashboardSlice";
import { StatCard } from "@/components/cards/StatCard";
import { Card, CardHeader } from "@/components/common/Card";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { AreaChartCard } from "@/components/charts/AreaChartCard";
import { Badge } from "@/components/common/Badge";
import { GRADIENT_CARDS } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  HiOutlineUsers,
  HiOutlineSwitchHorizontal,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
} from "react-icons/hi";
import { ROLES } from "@/constants";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const {
    stats,
    monthlyChart,
    revenueChart,
    activities,
    latestUsers,
    latestTransactions,
    isLoading,
  } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchChartData());
    dispatch(fetchRecentActivities());
    dispatch(fetchLatestUsers());
    dispatch(fetchLatestTransactions());
  }, [dispatch]);

  const statCards = stats
    ? [
        { title: "Total Retailers", value: stats.totalRetailers, subtitle: `+${stats.todayRetailers} today`, icon: <HiOutlineUsers className="h-5 w-5" /> },
        { title: "Total Distributors", value: stats.totalDistributors, subtitle: `+${stats.todayDistributors} today`, icon: <HiOutlineUsers className="h-5 w-5" /> },
        { title: "Total Admins", value: stats.totalAdmins, subtitle: `+${stats.todayAdmins} today`, icon: <HiOutlineUsers className="h-5 w-5" /> },
        { title: "Master Distributors", value: stats.totalMasterDistributors, subtitle: `+${stats.todayMasterDistributors} today`, icon: <HiOutlineUsers className="h-5 w-5" /> },
        { title: "Today's Transactions", value: stats.todayTransactions, icon: <HiOutlineSwitchHorizontal className="h-5 w-5" /> },
        { title: "Success Transactions", value: stats.successTransactions, icon: <HiOutlineCheckCircle className="h-5 w-5" /> },
        { title: "Pending Transactions", value: stats.pendingTransactions, icon: <HiOutlineClock className="h-5 w-5" /> },
        { title: "Rejected Transactions", value: stats.rejectedTransactions, icon: <HiOutlineXCircle className="h-5 w-5" /> },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {isLoading && !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-border" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card, i) => (
            <StatCard
              key={card.title}
              {...card}
              gradient={`bg-gradient-to-br ${GRADIENT_CARDS[i % GRADIENT_CARDS.length]}`}
            />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <LineChartCard title="Monthly Transactions" data={monthlyChart} dataKey="transactions" />
        <AreaChartCard title="Revenue Overview" data={revenueChart} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Recent Activities" subtitle="Latest system events" />
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted">{activity.description}</p>
                  <p className="text-xs text-muted">{formatDate(activity.time)}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-muted">No recent activities</p>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Latest Users" subtitle="Recently added users" />
          <div className="space-y-3">
            {latestUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted">{ROLES[user.role]}</p>
                </div>
                <Badge variant={user.status as "active" | "suspended" | "inactive"}>
                  {user.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Latest Transactions" subtitle="Recent transfers" />
          <div className="space-y-3">
            {latestTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">
                    {txn.fromUserName} → {txn.toUserName}
                  </p>
                  <p className="text-xs text-muted">{formatCurrency(txn.amount)}</p>
                </div>
                <Badge variant={txn.status as "success" | "pending" | "rejected"}>
                  {txn.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
