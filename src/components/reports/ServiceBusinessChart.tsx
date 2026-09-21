"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import { AXIS_TICK } from "@/components/reports/ChartTooltip";
import { formatCompactCurrency, formatCurrency } from "@/lib/businessReport";
import { BusinessServiceRow } from "@/types/monthlyBusiness";

interface ServiceBusinessChartProps {
  services: BusinessServiceRow[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function ServiceBusinessChart({
  services,
  loading,
  error,
  onRetry,
}: ServiceBusinessChartProps) {
  const hasData = services.some((row) => row.business > 0 || row.transactionCount > 0);
  const height = Math.max(280, services.length * 36);

  return (
    <ChartCard
      title="Service-wise Business"
      subtitle="Sorted by business amount from the reports API"
      loading={loading}
      error={error}
      empty={!hasData}
      onRetry={onRetry}
    >
      <div style={{ height }} className="min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={services}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const row = payload[0].payload as BusinessServiceRow;
                return (
                  <div className="min-w-[180px] rounded-xl border border-border bg-card px-3 py-2.5 text-xs shadow-lg">
                    <p className="text-sm font-semibold text-foreground">{row.name}</p>
                    <p className="mt-1">Business {formatCurrency(row.business)}</p>
                    <p>Transactions {row.transactionCount.toLocaleString("en-IN")}</p>
                    <p>Commission {formatCompactCurrency(row.commission)}</p>
                    <p>Charges {formatCompactCurrency(row.charges)}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="business" fill="var(--primary)" radius={[0, 8, 8, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
