"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
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
      subtitle="Monday to Sunday for the selected month"
      loading={loading}
      error={error}
      empty={!series.length}
      onRetry={onRetry}
      actions={
        data ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right text-xs text-muted sm:grid-cols-4">
            <p>
              Business{" "}
              <span className="font-semibold text-foreground">
                {formatCompactCurrency(data.totalBusiness)}
              </span>
            </p>
            <p>
              Txns{" "}
              <span className="font-semibold text-foreground">
                {data.totalTransactions.toLocaleString("en-IN")}
              </span>
            </p>
            <p>
              Success{" "}
              <span className="font-semibold text-foreground">
                {data.successfulTransactions.toLocaleString("en-IN")}
              </span>
            </p>
            <p>
              Failed{" "}
              <span className="font-semibold text-foreground">
                {data.failedTransactions.toLocaleString("en-IN")}
              </span>
            </p>
          </div>
        ) : null
      }
    >
      <div className={fetching ? "h-[280px] opacity-80" : "h-[280px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={56}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={36}
            />
            <Tooltip content={<BusinessPointTooltip />} />
            <Bar yAxisId="left" dataKey="business" fill="#4318FF" radius={[8, 8, 0, 0]} maxBarSize={42}>
              {series.map((point) => (
                <Cell
                  key={point.key}
                  fill="#4318FF"
                  fillOpacity={point.isPeak ? 1 : 0.65}
                />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="transactionCount"
              stroke="#0f172a"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
