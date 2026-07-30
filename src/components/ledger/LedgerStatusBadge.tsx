"use client";

import { Tag } from "antd";

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: "success",
  PENDING: "warning",
  PROCESSING: "warning",
  FAILED: "error",
  REFUNDED: "processing",
  REFUND: "processing",
  REVERSED: "default",
};

interface LedgerStatusBadgeProps {
  status: string;
}

export function LedgerStatusBadge({ status }: LedgerStatusBadgeProps) {
  const key = (status || "PENDING").toUpperCase();
  const color = STATUS_COLOR[key] || "default";
  const label = key
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Tag color={color} className="m-0 rounded-full px-2.5 py-0.5 text-xs font-semibold">
      {label}
    </Tag>
  );
}
