"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  History,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { DataTable } from "@/components/tables/DataTable";
import {
  ServiceChargeConfirmAction,
  ServiceChargeConfirmDialog,
} from "@/components/service-charges/ServiceChargeConfirmDialog";
import {
  ServiceChargeFilters,
  ServiceChargeFiltersValue,
} from "@/components/service-charges/ServiceChargeFilters";
import { ServiceChargeStatusBadge } from "@/components/service-charges/ServiceChargeStatusBadge";
import {
  useServiceChargeMutations,
  useServiceChargesList,
} from "@/hooks/useServiceCharges";
import {
  formatCreatedBy,
  formatExecutionDay,
  formatFrequency,
  formatPlanDate,
  formatRoleLabel,
  formatServiceChargeAmount,
} from "@/lib/serviceChargeFormat";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { ServiceChargePlan } from "@/types/serviceCharge";

const PAGE_SIZE = 20;

const EMPTY_FILTERS: ServiceChargeFiltersValue = {
  search: "",
  status: "",
  frequency: "",
  role: "",
  startDate: "",
  endDate: "",
};

export function ServiceChargeListView() {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] =
    useState<ServiceChargeFiltersValue>(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] =
    useState<ServiceChargeConfirmAction | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ServiceChargePlan | null>(
    null
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(filters.search.trim()),
      350
    );
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpenId]);

  const listParams = {
    page: pageIndex + 1,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: filters.status || undefined,
    frequency: filters.frequency || undefined,
    role: filters.role || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  };

  const { data, isLoading, isFetching, isError, error, refetch } =
    useServiceChargesList(listParams);
  const { deleteMutation, pauseMutation, resumeMutation, runMutation } =
    useServiceChargeMutations();

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, data?.totalPages ?? 1);

  const openConfirm = (
    action: ServiceChargeConfirmAction,
    plan: ServiceChargePlan
  ) => {
    setSelectedPlan(plan);
    setConfirmAction(action);
    setMenuOpenId(null);
  };

  const handleConfirm = async () => {
    if (!selectedPlan || !confirmAction) return;
    const id = selectedPlan.id;
    try {
      if (confirmAction === "delete") await deleteMutation.mutateAsync(id);
      if (confirmAction === "pause") await pauseMutation.mutateAsync(id);
      if (confirmAction === "resume") await resumeMutation.mutateAsync(id);
      if (confirmAction === "run") await runMutation.mutateAsync(id);
      setConfirmAction(null);
      setSelectedPlan(null);
    } catch {
      // toast handled in mutation
    }
  };

  const confirming =
    deleteMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    runMutation.isPending;

  const columns = useMemo<ColumnDef<ServiceChargePlan, unknown>[]>(
    () => [
      {
        id: "planName",
        header: "Plan Name",
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left font-semibold text-primary hover:underline"
            onClick={() =>
              router.push(
                `${ROUTES.superAdminServiceCharges}/${row.original.id}`
              )
            }
          >
            {row.original.planName || "—"}
          </button>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        meta: { align: "right" as const },
        cell: ({ row }) =>
          formatServiceChargeAmount(
            row.original.amount,
            row.original.chargeType
          ),
      },
      {
        id: "frequency",
        header: "Frequency",
        cell: ({ row }) => formatFrequency(row.original.frequency),
      },
      {
        id: "executionTime",
        header: "Execution Time",
        cell: ({ row }) => row.original.executionTime || "—",
      },
      {
        id: "executionDay",
        header: "Execution Day",
        cell: ({ row }) =>
          formatExecutionDay(row.original.frequency, row.original.executionDay),
      },
      {
        id: "roles",
        header: "Role",
        cell: ({ row }) =>
          formatRoleLabel(row.original.role || row.original.applicableRoles?.[0]),
      },
      {
        id: "retailers",
        header: "Retailer",
        cell: ({ row }) => {
          if ((row.original.role || row.original.applicableRoles?.[0]) !== "RETAILER") {
            return "—";
          }
          if (row.original.retailers?.length) {
            return row.original.retailers
              .map((r) => [r.name, r.userCode].filter(Boolean).join(" · "))
              .join(", ");
          }
          if (row.original.retailerId || row.original.targetUserId) {
            return String(row.original.retailerId || row.original.targetUserId);
          }
          return "—";
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <ServiceChargeStatusBadge status={row.original.status} />
        ),
      },
      {
        id: "startDate",
        header: "Start Date",
        cell: ({ row }) => formatPlanDate(row.original.startDate),
      },
      {
        id: "endDate",
        header: "End Date",
        cell: ({ row }) => formatPlanDate(row.original.endDate),
      },
      {
        id: "createdBy",
        header: "Created By",
        cell: ({ row }) => formatCreatedBy(row.original),
      },
      {
        id: "createdAt",
        header: "Created Date",
        cell: ({ row }) => formatPlanDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const plan = row.original;
          const open = menuOpenId === plan.id;
          const isPaused = String(plan.status).toUpperCase() === "PAUSED";
          const isActive = String(plan.status).toUpperCase() === "ACTIVE";

          return (
            <div
              className="relative flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="!px-2"
                title="View"
                onClick={() =>
                  router.push(`${ROUTES.superAdminServiceCharges}/${plan.id}`)
                }
              >
                <Eye className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="!px-2"
                title="Edit"
                onClick={() =>
                  router.push(
                    `${ROUTES.superAdminServiceCharges}/${plan.id}/edit`
                  )
                }
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="!px-2"
                title="More"
                onClick={() => setMenuOpenId(open ? null : plan.id)}
              >
                <MoreHorizontal className="size-4" />
              </Button>
              {open ? (
                <div className="absolute right-0 top-9 z-20 min-w-[160px] rounded-xl border border-border bg-card p-1 shadow-xl">
                  {isActive ? (
                    <MenuItem
                      icon={<Pause className="size-3.5" />}
                      label="Pause"
                      onClick={() => openConfirm("pause", plan)}
                    />
                  ) : null}
                  {isPaused ? (
                    <MenuItem
                      icon={<Play className="size-3.5" />}
                      label="Resume"
                      onClick={() => openConfirm("resume", plan)}
                    />
                  ) : null}
                  <MenuItem
                    icon={<Zap className="size-3.5" />}
                    label="Run Now"
                    onClick={() => openConfirm("run", plan)}
                  />
                  <MenuItem
                    icon={<History className="size-3.5" />}
                    label="History"
                    onClick={() =>
                      router.push(
                        `${ROUTES.superAdminServiceCharges}/${plan.id}/history`
                      )
                    }
                  />
                  <MenuItem
                    icon={<Trash2 className="size-3.5" />}
                    label="Delete"
                    danger
                    onClick={() => openConfirm("delete", plan)}
                  />
                </div>
              ) : null}
            </div>
          );
        },
      },
    ],
    [menuOpenId, router]
  );

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Finance"
        title="Service Charges"
        subtitle="Create and manage recurring service charge plans for network users."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={cn("size-4", isFetching && "animate-spin")}
              />
              Refresh
            </Button>
            <Link href={ROUTES.superAdminServiceChargeHistory}>
              <Button variant="outline" size="sm">
                <History className="size-4" />
                Charge History
              </Button>
            </Link>
            <Link href={ROUTES.superAdminServiceChargeCreate}>
              <Button size="sm">
                <Plus className="size-4" />
                Create Plan
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <ServiceChargeFilters
          value={filters}
          resultsCount={total}
          onChange={(next) => {
            setFilters(next);
            setPageIndex(0);
          }}
        />

        {isError ? (
          <div className="mb-4 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {error instanceof Error
              ? error.message
              : "Failed to load service charges"}
          </div>
        ) : null}

        {!isLoading && rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-base font-semibold text-foreground">
              No service charge plans yet
            </p>
            <p className="mt-1 text-sm text-muted">
              Create a plan to start scheduling charges for retailers,
              distributors, or master distributors.
            </p>
            <Link
              href={ROUTES.superAdminServiceChargeCreate}
              className="mt-4 inline-flex"
            >
              <Button size="sm">
                <Plus className="size-4" />
                Create Plan
              </Button>
            </Link>
          </div>
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            isLoading={isLoading}
            hideSearch
            manualPagination
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            pageSize={PAGE_SIZE}
            totalRows={total}
            tone="report"
            minTableWidth={1400}
          />
        )}
      </Card>

      <ServiceChargeConfirmDialog
        isOpen={!!confirmAction}
        action={confirmAction}
        planName={selectedPlan?.planName}
        isLoading={confirming}
        onClose={() => {
          if (confirming) return;
          setConfirmAction(null);
          setSelectedPlan(null);
        }}
        onConfirm={() => void handleConfirm()}
      />
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted",
        danger ? "text-accent-red" : "text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
