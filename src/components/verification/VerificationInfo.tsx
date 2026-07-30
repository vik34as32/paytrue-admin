"use client";

import { formatDate } from "@/lib/utils";
import { VerificationActor } from "@/types/idVerification";

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

interface VerificationInfoProps {
  variant: "verified" | "rejected";
  actor?: VerificationActor | null;
  at?: string | null;
  remark?: string | null;
  reason?: string | null;
}

export function VerificationInfo({
  variant,
  actor,
  at,
  remark,
  reason,
}: VerificationInfoProps) {
  if (variant === "verified") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Verified By" value={actor?.name} />
        <Field label="Admin Email" value={actor?.email} />
        <Field label="Admin Role" value={actor?.role} />
        <Field label="Verified At" value={at ? formatDate(at) : undefined} />
        <div className="sm:col-span-2">
          <Field label="Verification Remark" value={remark} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Rejected By" value={actor?.name} />
      <Field label="Rejected At" value={at ? formatDate(at) : undefined} />
      <div className="sm:col-span-2">
        <Field label="Reason" value={reason} />
      </div>
    </div>
  );
}
