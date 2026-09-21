"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import { AXIS_TICK, BusinessPointTooltip } from "@/components/reports/ChartTooltip";
import { formatCompactCurrency } from "@/lib/businessReport";
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
      subtitle="Bars show business amount; line shows transaction count"
      loading={loading}
      error={error}
      empty={!hasData}
      onRetry={onRetry}
    >
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
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
              width={36}
            />
            <Tooltip content={<BusinessPointTooltip />} />
            <Bar
              yAxisId="business"
              dataKey="business"
              name="Business"
              fill="#4318FF"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
            <Line
              yAxisId="txns"
              type="monotone"
              dataKey="transactionCount"
              name="Transactions"
              stroke="var(--foreground)"
              strokeWidth={2.25}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
