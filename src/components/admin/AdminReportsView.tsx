"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { DataTable } from "@/components/tables/DataTable";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  fetchAdminBusinessReport,
  fetchAdminWalletHistory,
} from "@/store/api/adminModuleApi";
import {
  selectAdminBusinessReport,
  selectAdminWalletHistory,
} from "@/store/selectors/adminSelectors";
import { buildAdminHistoryColumns } from "@/lib/adminHistoryColumns";
import { GRADIENT_CARDS } from "@/constants";
import { formatCurrency } from "@/lib/utils";
import { AdminWalletHistoryRecord } from "@/types/admin";
import { ChartDataPoint } from "@/types";

function reportValue(
  report: ReturnType<typeof selectAdminBusinessReport>,
  keys: string[]
): number {
  if (!report) return 0;
  for (const key of keys) {
    const val = report[key];
    if (typeof val === "number") return val;
  }
  return 0;
}

export function AdminReportsView() {
  const dispatch = useAppDispatch();
  const report = useAppSelector(selectAdminBusinessReport);
  const walletHistory = useAppSelector(selectAdminWalletHistory);
  const { isLoadingBusinessReport, error } = useAppSelector(
    (state) => state.adminModule
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadReport = () => {
    dispatch(
      fetchAdminBusinessReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
    );
  };

  useEffect(() => {
    loadReport();
    dispatch(fetchAdminWalletHistory({ page: 1, pageSize: 20 }));
  }, [dispatch]);

  const cards = [
    {
      title: "Today's Business",
      value: formatCurrency(
        reportValue(report, ["todaysBusiness", "todayBusiness"])
      ),
    },
    {
      title: "Monthly Business",
      value: formatCurrency(reportValue(report, ["monthlyBusiness"])),
    },
    {
      title: "Total Business",
      value: formatCurrency(reportValue(report, ["totalBusiness"])),
    },
    {
      title: "Master Distributor Business",
      value: formatCurrency(
        reportValue(report, ["masterDistributorBusiness"])
      ),
    },
    {
      title: "Distributor Business",
      value: formatCurrency(reportValue(report, ["distributorBusiness"])),
    },
    {
      title: "Retailer Business",
      value: formatCurrency(reportValue(report, ["retailerBusiness"])),
    },
  ];

  const chartData: ChartDataPoint[] = useMemo(
    () => [
      {
        name: "Master MD",
        value: reportValue(report, ["masterDistributorBusiness"]),
      },
      {
        name: "Distributor",
        value: reportValue(report, ["distributorBusiness"]),
      },
      {
        name: "Retailer",
        value: reportValue(report, ["retailerBusiness"]),
      },
    ],
    [report]
  );

  const txColumns = useMemo<ColumnDef<AdminWalletHistoryRecord, unknown>[]>(
    () => buildAdminHistoryColumns(),
    []
  );

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Admin"
        title="Business Reports"
        subtitle="Business and transaction reports for your downline"
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <Card>
        <CardHeader title="Date Filter" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="flex items-end">
            <Button onClick={loadReport} isLoading={isLoadingBusinessReport}>
              Apply Filter
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={isLoadingBusinessReport ? "..." : card.value}
            gradient={`bg-gradient-to-br ${GRADIENT_CARDS[index % GRADIENT_CARDS.length]}`}
          />
        ))}
      </div>

      <BarChartCard
        title="Business by Tier"
        data={chartData}
        dataKey="value"
        color="#4318FF"
      />

      <Card>
        <CardHeader
          title="Transaction Reports"
          subtitle="Recent wallet transactions"
        />
        <DataTable
          data={walletHistory.data}
          columns={txColumns}
          isLoading={walletHistory.isLoading}
          searchPlaceholder="Search transactions..."
          pageSize={10}
        />
      </Card>
    </div>
  );
}
