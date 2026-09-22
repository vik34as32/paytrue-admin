"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import { AXIS_TICK, BusinessPointTooltip } from "@/components/reports/ChartTooltip";
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
  const peak = highestPoint(series);
  const average = averageBusiness(series);
  const year = data?.year || new Date().getFullYear();

  return (
    <ChartCard
      title={`Yearly Business Trend · ${year}`}
      subtitle={`Jan–Dec ${year} business amount`}
      loading={loading}
      error={error}
      empty={!series.length}
      emptyMessage="No business data available for this period."
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
              Peak{" "}
              <span className="font-semibold text-foreground">
                {peak?.label || "—"}
              </span>
            </p>
            <p>
              Avg{" "}
              <span className="font-semibold text-foreground">
                {formatCompactCurrency(average)}
              </span>
            </p>
          </div>
        ) : null
      }
    >
      <div className={fetching ? "h-[280px] opacity-80" : "h-[280px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={0} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={56}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
            />
            <Tooltip content={<BusinessPointTooltip extra />} />
            <Line
              type="monotone"
              dataKey="business"
              name="Business"
              stroke="#4318FF"
              strokeWidth={2.5}
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
