"use client";

import { Card, Statistic } from "antd";
import { formatCurrency } from "@/lib/utils";

interface LedgerSummaryProps {
  totalCredit: number;
  totalDebit: number;
  totalCharge: number;
  totalCommission: number;
  netAmount: number;
  loading?: boolean;
}

export function LedgerSummary({
  totalCredit,
  totalDebit,
  totalCharge,
  totalCommission,
  netAmount,
  loading,
}: LedgerSummaryProps) {
  return (
    <Card
      title="Summary"
      className="rounded-2xl shadow-sm"
      styles={{ body: { paddingTop: 12 } }}
    >
      <div className="space-y-4">
        <Statistic
          title="Total Credit"
          value={totalCredit}
          formatter={(v) => formatCurrency(Number(v))}
          loading={loading}
          valueStyle={{ color: "#059669", fontSize: 18 }}
        />
        <Statistic
          title="Total Debit"
          value={totalDebit}
          formatter={(v) => formatCurrency(Number(v))}
          loading={loading}
          valueStyle={{ color: "#e11d48", fontSize: 18 }}
        />
        <Statistic
          title="Total Charge"
          value={totalCharge}
          formatter={(v) => formatCurrency(Number(v))}
          loading={loading}
          valueStyle={{ fontSize: 18 }}
        />
        <Statistic
          title="Total Commission"
          value={totalCommission}
          formatter={(v) => formatCurrency(Number(v))}
          loading={loading}
          valueStyle={{ fontSize: 18 }}
        />
        <div className="border-t border-border pt-3">
          <Statistic
            title="Net Amount"
            value={netAmount}
            formatter={(v) => formatCurrency(Number(v))}
            loading={loading}
            valueStyle={{
              color: netAmount >= 0 ? "#4318FF" : "#e11d48",
              fontSize: 20,
              fontWeight: 700,
            }}
          />
        </div>
      </div>
    </Card>
  );
}
