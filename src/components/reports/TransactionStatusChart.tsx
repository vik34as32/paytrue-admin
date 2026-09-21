"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import {
  calculateFailureRate,
  calculateSuccessRate,
} from "@/lib/businessReport";
import { TransactionBreakdown } from "@/types/monthlyBusiness";

const COLORS = {
  successful: "#059669",
  failed: "#e11d48",
};

interface TransactionStatusChartProps {
  breakdown?: TransactionBreakdown;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function TransactionStatusChart({
  breakdown,
  loading,
  error,
  onRetry,
}: TransactionStatusChartProps) {
  const successful = breakdown?.successful || 0;
  const failed = breakdown?.failed || 0;
  const total = breakdown?.total || successful + failed;
  const successRate = calculateSuccessRate(successful, total);
  const failureRate = calculateFailureRate(failed, total);
  const pie =
    successful > 0 || failed > 0
      ? [
          { name: "Successful", value: successful, key: "successful" as const },
          { name: "Failed", value: failed, key: "failed" as const },
        ].filter((item) => item.value > 0)
      : total > 0
        ? [{ name: "Transactions", value: total, key: "successful" as const }]
        : [];

  return (
    <ChartCard
      title="Transaction Status"
      subtitle="Successful vs failed, with rates from API totals"
      loading={loading}
      error={error}
      empty={!pie.length}
      onRetry={onRetry}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pie}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={3}
              >
                {pie.map((item) => (
                  <Cell key={item.key} fill={COLORS[item.key]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => Number(value || 0).toLocaleString("en-IN")}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-center gap-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Success rate</p>
            <p className="text-lg font-bold tabular-nums text-emerald-600">
              {successRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted">
              {successful.toLocaleString("en-IN")} successful
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Failure rate</p>
            <p className="text-lg font-bold tabular-nums text-rose-600">
              {failureRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted">
              {failed.toLocaleString("en-IN")} failed
            </p>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
