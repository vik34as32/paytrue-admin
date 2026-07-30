"use client";

import { Badge } from "@/components/common/Badge";
import { statusBadgeVariant } from "@/lib/serviceChargeFormat";

interface ServiceChargeStatusBadgeProps {
  status?: string | null;
}

export function ServiceChargeStatusBadge({
  status,
}: ServiceChargeStatusBadgeProps) {
  return (
    <Badge variant={statusBadgeVariant(status)}>
      {status ? status.charAt(0) + status.slice(1).toLowerCase() : "—"}
    </Badge>
  );
}
