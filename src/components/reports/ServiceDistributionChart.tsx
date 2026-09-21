"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import { formatCurrency } from "@/lib/businessReport";
import { BusinessServiceRow } from "@/types/monthlyBusiness";

const PALETTE = [
  "var(--primary)",
  "#0f766e",
  "#b45309",
  "#7c3aed",
  "#0369a1",
  "#be123c",
  "#15803d",
  "#4338ca",
];

interface ServiceDistributionChartProps {
  services: BusinessServiceRow[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function ServiceDistributionChart({
  services,
  loading,
  error,
  onRetry,
}: ServiceDistributionChartProps) {
  const pie = services.filter((row) => row.business > 0);

  return (
    <ChartCard
      title="Service Distribution"
      subtitle="Share of total business by service"
      loading={loading}
      error={error}
      empty={!pie.length}
      onRetry={onRetry}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_160px]">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pie}
                dataKey="business"
                nameKey="name"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
              >
                {pie.map((row, index) => (
                  <Cell key={row.code} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => {
                  const row = item?.payload as BusinessServiceRow | undefined;
                  return [
                    `${formatCurrency(Number(value || 0))} (${(row?.sharePercent || 0).toFixed(1)}%)`,
                    row?.name || "Service",
                  ];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="max-h-[240px] space-y-2 overflow-auto text-xs">
          {pie.map((row, index) => (
            <li key={row.code} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: PALETTE[index % PALETTE.length] }}
                />
                <span className="truncate text-foreground">{row.name}</span>
              </span>
              <span className="tabular-nums text-muted">
                {row.sharePercent.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
