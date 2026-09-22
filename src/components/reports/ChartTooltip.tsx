"use client";

import {
  formatCompactCurrency,
  formatCurrency,
  formatTxnCount,
} from "@/lib/businessReport";
import { BusinessReportPoint } from "@/types/monthlyBusiness";

export function BusinessPointTooltip({
  active,
  payload,
  label,
  extra,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    dataKey?: string;
    color?: string;
    payload: BusinessReportPoint & Record<string, unknown>;
  }>;
  label?: string;
  extra?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const title = label || point.label;

  return (
    <div className="min-w-[190px] rounded-xl border border-border bg-card px-3 py-2.5 shadow-[0px_18px_40px_rgba(112,144,176,0.12)]">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <dl className="mt-2 space-y-1 text-xs">
        {payload.map((entry, index) => {
          const key = String(entry.dataKey || entry.name || "");
          const isTxn =
            key === "transactionCount" ||
            key === "Transactions" ||
            entry.name === "Transactions";
          const name = entry.name || (isTxn ? "Transactions" : "Business");
          const value = Number(entry.value || 0);
          return (
            <Row
              key={`${name}-${index}`}
              label={name}
              value={isTxn ? formatTxnCount(value) : formatCurrency(value)}
              color={entry.color}
            />
          );
        })}
        {extra ? (
          <>
            <Row label="Charges" value={formatCompactCurrency(point.charges || 0)} />
            <Row
              label="Commission"
              value={formatCompactCurrency(point.commission || 0)}
            />
          </>
        ) : null}
      </dl>
    </div>
  );
}

export function DayCompareTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[180px] rounded-xl border border-border bg-card px-3 py-2.5 shadow-[0px_18px_40px_rgba(112,144,176,0.12)]">
      <p className="text-sm font-semibold text-foreground">Time: {label}</p>
      <dl className="mt-2 space-y-1 text-xs">
        {payload.map((entry) => (
          <Row
            key={entry.name}
            label={entry.name || "Business"}
            value={formatCurrency(Number(entry.value || 0))}
            color={entry.color}
          />
        ))}
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-muted">
        {color ? (
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: color }}
          />
        ) : null}
        {label}
      </dt>
      <dd className="font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

export const AXIS_TICK = { fill: "var(--muted)", fontSize: 12 };
export const AXIS_TICK_SM = { fill: "var(--muted)", fontSize: 11 };
