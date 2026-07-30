"use client";

import { Badge } from "@/components/common/Badge";

function statusVariant(
  status?: string
): "success" | "pending" | "rejected" | "default" {
  const value = (status || "").toUpperCase();
  if (value === "SUCCESS" || value === "REFUNDED") return "success";
  if (value === "PENDING" || value === "PROCESSING") return "pending";
  if (value === "FAILED" || value === "REVERSED") return "rejected";
  return "default";
}

interface AepsLedgerStatusBadgeProps {
  status?: string | null;
}

export function AepsLedgerStatusBadge({ status }: AepsLedgerStatusBadgeProps) {
  const value = status ?? undefined;
  const label = value
    ? value.charAt(0) + value.slice(1).toLowerCase()
    : "—";
  return <Badge variant={statusVariant(value)}>{label}</Badge>;
}
