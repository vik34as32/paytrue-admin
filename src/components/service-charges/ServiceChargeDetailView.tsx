"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  History,
  Pause,
  Pencil,
  Play,
  Trash2,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import {
  ServiceChargeConfirmAction,
  ServiceChargeConfirmDialog,
} from "@/components/service-charges/ServiceChargeConfirmDialog";
import { ServiceChargeStatusBadge } from "@/components/service-charges/ServiceChargeStatusBadge";
import {
  useServiceChargeDetail,
  useServiceChargeMutations,
} from "@/hooks/useServiceCharges";
import {
  formatChargeType,
  formatCreatedBy,
  formatExecutionDay,
  formatFrequency,
  formatPlanDate,
  formatRoleLabel,
  formatServiceChargeAmount,
} from "@/lib/serviceChargeFormat";
import { ROUTES } from "@/constants";

interface ServiceChargeDetailViewProps {
  planId: string;
}

export function ServiceChargeDetailView({
  planId,
}: ServiceChargeDetailViewProps) {
  const router = useRouter();
  const { data: plan, isLoading, isError, error } = useServiceChargeDetail(
    planId
  );
  const {
    deleteMutation,
    pauseMutation,
    resumeMutation,
    runMutation,
  } = useServiceChargeMutations();
  const [confirmAction, setConfirmAction] =
    useState<ServiceChargeConfirmAction | null>(null);

  const confirming =
    deleteMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    runMutation.isPending;

  const handleConfirm = async () => {
    if (!plan || !confirmAction) return;
    try {
      if (confirmAction === "delete") {
        await deleteMutation.mutateAsync(plan.id);
        router.push(ROUTES.superAdminServiceCharges);
        return;
      }
      if (confirmAction === "pause") await pauseMutation.mutateAsync(plan.id);
      if (confirmAction === "resume") await resumeMutation.mutateAsync(plan.id);
      if (confirmAction === "run") await runMutation.mutateAsync(plan.id);
      setConfirmAction(null);
    } catch {
      // toast in mutation
    }
  };

  if (isLoading) {
    return (
      <div className="page-container space-y-6">
        <PageHeader breadcrumb="Finance" title="Plan Details" />
        <Card>
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-1/3 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="page-container space-y-6">
        <PageHeader breadcrumb="Finance" title="Plan Details" />
        <Card>
          <p className="text-sm text-accent-red">
            {error instanceof Error ? error.message : "Plan not found"}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.push(ROUTES.superAdminServiceCharges)}
          >
            Back to list
          </Button>
        </Card>
      </div>
    );
  }

  const isPaused = String(plan.status).toUpperCase() === "PAUSED";
  const isActive = String(plan.status).toUpperCase() === "ACTIVE";

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Plan Name", value: plan.planName },
    {
      label: "Status",
      value: <ServiceChargeStatusBadge status={plan.status} />,
    },
    {
      label: "Amount",
      value: formatServiceChargeAmount(plan.amount, plan.chargeType),
    },
    { label: "Charge Type", value: formatChargeType(plan.chargeType) },
    { label: "Frequency", value: formatFrequency(plan.frequency) },
    { label: "Execution Time", value: plan.executionTime || "—" },
    {
      label: "Execution Day",
      value: formatExecutionDay(plan.frequency, plan.executionDay),
    },
    { label: "Start Date", value: formatPlanDate(plan.startDate) },
    { label: "End Date", value: formatPlanDate(plan.endDate) },
    { label: "Applicable Roles", value: formatRoleLabel(plan.role || plan.applicableRoles?.[0]) },
    {
      label: "Selected Retailer",
      value:
        (plan.role || plan.applicableRoles?.[0]) === "RETAILER"
          ? plan.retailers?.length
            ? plan.retailers
                .map((r) =>
                  [r.name, r.userCode].filter(Boolean).join(" · ")
                )
                .join(", ")
            : plan.retailerId || plan.targetUserId || "—"
          : "—",
    },
    { label: "Created By", value: formatCreatedBy(plan) },
    { label: "Created Date", value: formatPlanDate(plan.createdAt) },
    { label: "Last Run", value: formatPlanDate(plan.lastRunAt) },
    { label: "Next Run", value: formatPlanDate(plan.nextRunAt) },
  ];

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Finance"
        title={plan.planName}
        subtitle="Complete service charge plan information"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(ROUTES.superAdminServiceCharges)}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Link href={`${ROUTES.superAdminServiceCharges}/${plan.id}/history`}>
              <Button variant="outline" size="sm">
                <History className="size-4" />
                History
              </Button>
            </Link>
            <Link href={`${ROUTES.superAdminServiceCharges}/${plan.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="size-4" />
                Edit
              </Button>
            </Link>
            {isActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction("pause")}
              >
                <Pause className="size-4" />
                Pause
              </Button>
            ) : null}
            {isPaused ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction("resume")}
              >
                <Play className="size-4" />
                Resume
              </Button>
            ) : null}
            <Button size="sm" onClick={() => setConfirmAction("run")}>
              <Zap className="size-4" />
              Run Now
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmAction("delete")}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        }
      />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div
              key={field.label}
              className="rounded-xl border border-border/70 bg-background/40 px-4 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {field.label}
              </p>
              <div className="mt-1.5 text-sm font-semibold text-foreground">
                {field.value}
              </div>
            </div>
          ))}
        </div>

        {plan.remarks ? (
          <div className="mt-5 rounded-xl border border-border/70 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Remarks
            </p>
            <p className="mt-1.5 text-sm text-foreground">{plan.remarks}</p>
          </div>
        ) : null}
      </Card>

      <ServiceChargeConfirmDialog
        isOpen={!!confirmAction}
        action={confirmAction}
        planName={plan.planName}
        isLoading={confirming}
        onClose={() => {
          if (!confirming) setConfirmAction(null);
        }}
        onConfirm={() => void handleConfirm()}
      />
    </div>
  );
}
