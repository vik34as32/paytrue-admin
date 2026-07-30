"use client";

import { formatDate } from "@/lib/utils";
import { VerificationHistoryItem } from "@/types/idVerification";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { normalizeVerificationStatus } from "@/lib/idVerification";

interface VerificationHistoryProps {
  items?: VerificationHistoryItem[];
}

export function VerificationHistory({ items }: VerificationHistoryProps) {
  if (!items?.length) {
    return (
      <p className="text-sm text-muted">No verification history available.</p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Verification history">
      {items.map((item, index) => {
        const status = item.status
          ? normalizeVerificationStatus(item.status)
          : undefined;
        return (
          <li
            key={item.id || `${item.createdAt}-${index}`}
            className="rounded-xl border border-border/80 bg-background/60 px-3.5 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {item.action || item.actor?.name || "Update"}
              </p>
              {status ? <VerificationBadge status={status} /> : null}
            </div>
            <p className="mt-1 text-xs text-muted">
              {item.createdAt ? formatDate(item.createdAt) : "—"}
              {item.actor?.name ? ` · ${item.actor.name}` : ""}
            </p>
            {(item.remark || item.reason) && (
              <p className="mt-2 text-sm text-foreground">
                {item.remark || item.reason}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
