"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileUp,
  ShieldAlert,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import {
  normalizeVerificationStatus,
  verificationStatusLabel,
} from "@/lib/idVerification";
import {
  IdVerificationStatus,
  UserVerificationInfo,
  VerificationHistoryItem,
} from "@/types/idVerification";

export interface TimelineStep {
  id: string;
  title: string;
  subtitle?: string;
  tone: "pending" | "success" | "danger" | "neutral";
}

function buildStepsFromInfo(info?: UserVerificationInfo | null): TimelineStep[] {
  if (!info) {
    return [
      {
        id: "pending",
        title: "Pending",
        subtitle: "Waiting for document review",
        tone: "pending",
      },
    ];
  }

  if (info.history?.length) {
    return info.history.map((item: VerificationHistoryItem, index) => {
      const status = item.status
        ? normalizeVerificationStatus(item.status)
        : undefined;
      const tone =
        status === "VERIFIED"
          ? "success"
          : status === "REJECTED"
            ? "danger"
            : status === "PENDING"
              ? "pending"
              : "neutral";
      return {
        id: item.id || `history-${index}`,
        title:
          item.action ||
          (status ? verificationStatusLabel(status) : "Update"),
        subtitle: [
          item.actor?.name ? `by ${item.actor.name}` : null,
          item.createdAt ? formatDate(item.createdAt, "dd MMMM yyyy") : null,
          item.remark || item.reason || null,
        ]
          .filter(Boolean)
          .join(" · "),
        tone,
      };
    });
  }

  const steps: TimelineStep[] = [
    {
      id: "start",
      title: "Pending",
      subtitle: "Verification started",
      tone: "pending",
    },
  ];

  const hasDocsHint =
    info.status === "VERIFIED" ||
    info.status === "REJECTED" ||
    Boolean(info.remark || info.reason);

  if (hasDocsHint) {
    steps.push({
      id: "docs",
      title: "Documents Uploaded",
      subtitle: "KYC documents submitted for review",
      tone: "neutral",
    });
  }

  if (info.status === "VERIFIED") {
    steps.push({
      id: "verified-by",
      title: `Verified by ${info.verifiedBy?.name || "Admin"}`,
      subtitle: info.remark || undefined,
      tone: "success",
    });
    if (info.verifiedAt) {
      steps.push({
        id: "verified-on",
        title: `Verified on ${formatDate(info.verifiedAt, "dd MMMM yyyy")}`,
        subtitle: info.verifiedBy?.email || info.verifiedBy?.role || undefined,
        tone: "success",
      });
    }
  }

  if (info.status === "REJECTED") {
    steps.push({
      id: "rejected-by",
      title: `Rejected by ${info.rejectedBy?.name || "Admin"}`,
      subtitle: info.rejectedAt
        ? formatDate(info.rejectedAt, "dd MMMM yyyy")
        : undefined,
      tone: "danger",
    });
    steps.push({
      id: "reason",
      title: "Reason",
      subtitle: info.reason || "No reason provided",
      tone: "danger",
    });
  }

  return steps;
}

const TONE_ICON = {
  pending: Clock3,
  success: CheckCircle2,
  danger: ShieldAlert,
  neutral: FileUp,
};

const TONE_CLASS = {
  pending: "bg-amber-100 text-amber-600 border-amber-200",
  success: "bg-emerald-100 text-emerald-600 border-emerald-200",
  danger: "bg-rose-100 text-rose-600 border-rose-200",
  neutral: "bg-primary/10 text-primary border-primary/20",
};

interface VerificationTimelineProps {
  info?: UserVerificationInfo | null;
  statusFallback?: IdVerificationStatus;
  className?: string;
}

export function VerificationTimeline({
  info,
  statusFallback = "PENDING",
  className,
}: VerificationTimelineProps) {
  const steps =
    info || statusFallback !== "PENDING"
      ? buildStepsFromInfo(
          info || {
            userId: "",
            status: statusFallback,
          }
        )
      : buildStepsFromInfo(null);

  return (
    <ol className={cn("space-y-0", className)} aria-label="Verification timeline">
      {steps.map((step, index) => {
        const Icon = step.tone === "success" && index === steps.length - 1
          ? ShieldCheck
          : TONE_ICON[step.tone];
        const isLast = index === steps.length - 1;
        return (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            className="relative flex gap-3 pb-6 last:pb-0"
          >
            {!isLast ? (
              <span
                className="absolute left-[17px] top-10 h-[calc(100%-24px)] w-px bg-border"
                aria-hidden
              />
            ) : null}
            <div
              className={cn(
                "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                TONE_CLASS[step.tone]
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-semibold text-foreground">{step.title}</p>
              {step.subtitle ? (
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {step.subtitle}
                </p>
              ) : null}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
