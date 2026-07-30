"use client";

import { Tag } from "antd";

interface LedgerTypeBadgeProps {
  type: string;
}

export function LedgerTypeBadge({ type }: LedgerTypeBadgeProps) {
  const key = (type || "").toUpperCase();
  const isCredit = key.includes("CREDIT") || key === "REFUND";
  const isDebit = key.includes("DEBIT") || key.includes("DEDUCT");

  const color = isCredit ? "success" : isDebit ? "error" : "default";
  const label = isCredit ? "Credit" : isDebit ? "Debit" : key || "—";

  return (
    <Tag color={color} className="m-0 rounded-full px-2.5 py-0.5 text-xs font-semibold">
      {label}
    </Tag>
  );
}
