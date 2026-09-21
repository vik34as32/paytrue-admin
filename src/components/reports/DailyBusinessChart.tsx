"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import { AXIS_TICK, BusinessPointTooltip, PeakDot } from "@/components/reports/ChartTooltip";
import { formatCompactCurrency, formatCurrency } from "@/lib/businessReport";
import { BusinessReportSummary } from "@/types/monthlyBusiness";

interface DailyBusinessChartProps {
  data?: BusinessReportSummary;
  loading?: boolean;
  error?: boolean;
  fetching?: boolean;
  onRetry?: () => void;
}

export function DailyBusinessChart({
  data,
  loading,
  error,
  fetching,
  onRetry,
}: DailyBusinessChartProps) {
  const series = data?.series || [];
  const hasData = series.some((point) => point.business > 0 || point.transactionCount > 0);

  return (
    <ChartCard
      title="Daily Business"
      subtitle="Every day of the selected month, including zero-business days"
      loading={loading}
      error={error}
      empty={!hasData}
      onRetry={onRetry}
      actions={
        data ? (
          <div className="text-right text-xs text-muted">
            <p>
              Total{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(data.totalBusiness)}
              </span>
            </p>
            <p>
              {data.totalTransactions.toLocaleString("en-IN")} transactions
            </p>
          </div>
        ) : null
      }
    >
      <div className={fetching ? "h-[280px] opacity-80" : "h-[280px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dailyBusinessFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={2} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={56}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
            />
            <Tooltip content={<BusinessPointTooltip />} />
            <Area
              type="monotone"
              dataKey="business"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#dailyBusinessFill)"
              dot={<PeakDot />}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              isAnimationActive
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
