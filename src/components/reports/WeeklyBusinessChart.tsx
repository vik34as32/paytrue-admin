"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import { AXIS_TICK, BusinessPointTooltip } from "@/components/reports/ChartTooltip";
import { formatCompactCurrency, formatCurrency } from "@/lib/businessReport";
import { BusinessReportSummary } from "@/types/monthlyBusiness";

interface WeeklyBusinessChartProps {
  data?: BusinessReportSummary;
  loading?: boolean;
  error?: boolean;
  fetching?: boolean;
  onRetry?: () => void;
}

export function WeeklyBusinessChart({
  data,
  loading,
  error,
  fetching,
  onRetry,
}: WeeklyBusinessChartProps) {
  const series = data?.series || [];

  return (
    <ChartCard
      title="Weekly Business"
      subtitle="Sunday to Saturday"
      loading={loading}
      error={error}
      empty={!series.length}
      emptyMessage="No business data available for this period."
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
          </div>
        ) : null
      }
    >
      <div className={fetching ? "h-[280px] opacity-80" : "h-[280px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={0} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={56}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
            />
            <Tooltip content={<BusinessPointTooltip />} />
            <Bar dataKey="business" name="Business" fill="#4318FF" radius={[8, 8, 0, 0]} maxBarSize={48}>
              <LabelList
                dataKey="business"
                position="top"
                formatter={(value) =>
                  Number(value) > 0 ? formatCompactCurrency(Number(value)) : ""
                }
                style={{ fill: "var(--muted)", fontSize: 10, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
