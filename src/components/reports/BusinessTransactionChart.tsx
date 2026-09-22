"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import { AXIS_TICK, BusinessPointTooltip } from "@/components/reports/ChartTooltip";
import { formatCompactCurrency, formatTxnCount } from "@/lib/businessReport";
import { BusinessReportPoint } from "@/types/monthlyBusiness";

interface BusinessTransactionChartProps {
  series: BusinessReportPoint[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  title?: string;
}

export function BusinessTransactionChart({
  series,
  loading,
  error,
  onRetry,
  title = "Business vs Transactions",
}: BusinessTransactionChartProps) {
  const hasData = series.some((point) => point.business > 0 || point.transactionCount > 0);

  return (
    <ChartCard
      title={title}
      subtitle="Left axis: Business (₹) · Right axis: Transactions"
      loading={loading}
      error={error}
      empty={!hasData}
      emptyMessage="No business data available for this period."
      onRetry={onRetry}
    >
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis
              yAxisId="business"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={56}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
            />
            <YAxis
              yAxisId="txns"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={40}
              tickFormatter={(value: number) => formatTxnCount(value)}
            />
            <Tooltip content={<BusinessPointTooltip />} />
            <Legend verticalAlign="top" height={28} iconType="line" />
            <Line
              yAxisId="business"
              type="monotone"
              dataKey="business"
              name="Business"
              stroke="#4318FF"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="txns"
              type="monotone"
              dataKey="transactionCount"
              name="Transactions"
              stroke="#0f172a"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
