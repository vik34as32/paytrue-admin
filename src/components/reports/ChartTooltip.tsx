"use client";

import { formatCompactCurrency, formatCurrency } from "@/lib/businessReport";
import { BusinessReportPoint } from "@/types/monthlyBusiness";

export function BusinessPointTooltip({
  active,
  payload,
  title,
  extra,
}: {
  active?: boolean;
  payload?: Array<{ payload: BusinessReportPoint }>;
  title?: string;
  extra?: boolean;
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return (
    <div className="min-w-[190px] rounded-xl border border-border bg-card px-3 py-2.5 shadow-[0px_18px_40px_rgba(112,144,176,0.12)]">
      <p className="text-sm font-semibold text-foreground">
        {title || point.label}
        {point.isPeak ? (
          <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            Peak
          </span>
        ) : null}
      </p>
      <dl className="mt-2 space-y-1 text-xs">
        <Row label="Business" value={formatCurrency(point.business)} />
        <Row
          label="Transactions"
          value={point.transactionCount.toLocaleString("en-IN")}
        />
        <Row
          label="Successful"
          value={point.successfulTransactions.toLocaleString("en-IN")}
        />
        <Row
          label="Failed"
          value={point.failedTransactions.toLocaleString("en-IN")}
        />
        {extra ? (
          <>
            <Row label="Charges" value={formatCompactCurrency(point.charges)} />
            <Row
              label="Commission"
              value={formatCompactCurrency(point.commission)}
            />
          </>
        ) : null}
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

export function PeakDot(props: {
  cx?: number;
  cy?: number;
  payload?: BusinessReportPoint;
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  if (payload?.isPeak) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={11} fill="var(--primary)" opacity={0.18} />
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="var(--primary)"
          stroke="#ffffff"
          strokeWidth={2}
        />
      </g>
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3.5}
      fill="var(--primary)"
      stroke="#ffffff"
      strokeWidth={1.5}
    />
  );
}

export const AXIS_TICK = { fill: "var(--muted)", fontSize: 12 };
