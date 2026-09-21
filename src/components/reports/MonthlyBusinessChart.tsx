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
import {
  averageBusiness,
  formatCompactCurrency,
  formatCurrency,
  highestPoint,
} from "@/lib/businessReport";
import { BusinessReportSummary } from "@/types/monthlyBusiness";

interface MonthlyBusinessChartProps {
  data?: BusinessReportSummary;
  loading?: boolean;
  error?: boolean;
  fetching?: boolean;
  onRetry?: () => void;
}

export function MonthlyBusinessChart({
  data,
  loading,
  error,
  fetching,
  onRetry,
}: MonthlyBusinessChartProps) {
  const series = data?.series || [];
  const hasData = series.some((point) => point.business > 0 || point.transactionCount > 0);
  const peak = highestPoint(series);
  const average = averageBusiness(series);

  return (
    <ChartCard
      title="Monthly Business"
      subtitle="All 12 months of the selected year"
      loading={loading}
      error={error}
      empty={!hasData}
      onRetry={onRetry}
      actions={
        data ? (
          <div className="grid grid-cols-2 gap-x-4 text-right text-xs text-muted">
            <p>
              Year{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(data.totalBusiness)}
              </span>
            </p>
            <p>
              Txns{" "}
              <span className="font-semibold text-foreground">
                {data.totalTransactions.toLocaleString("en-IN")}
              </span>
            </p>
            <p>
              Avg{" "}
              <span className="font-semibold text-foreground">
                {formatCompactCurrency(average)}
              </span>
            </p>
            <p>
              Peak{" "}
              <span className="font-semibold text-foreground">
                {peak?.label || "—"}
              </span>
            </p>
          </div>
        ) : null
      }
    >
      <div className={fetching ? "h-[280px] opacity-80" : "h-[280px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="monthlyBusinessFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={56}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
            />
            <Tooltip content={<BusinessPointTooltip extra />} />
            <Area
              type="monotone"
              dataKey="business"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#monthlyBusinessFill)"
              dot={<PeakDot />}
              isAnimationActive
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
