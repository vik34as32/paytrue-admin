"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { SearchableSelect } from "@/components/hierarchy-management/SearchableSelect";
import {
  useHierarchyDistributors,
  useHierarchyMasterDistributors,
  useReassignDistributor,
} from "@/hooks/useHierarchyManagement";
import { reassignDistributorSchema } from "@/validations/hierarchyManagementSchemas";
import { formatUserOptionLabel, isActiveStatus } from "@/lib/hierarchy/display";
import { HIERARCHY_DEFAULT_LIMIT } from "@/lib/hierarchy/pagination";

interface ReassignDistributorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDistributorId?: string | null;
}

type Step = "form" | "confirm" | "success";

function useDebounced(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function ReassignDistributorModal({
  isOpen,
  onClose,
  initialDistributorId,
}: ReassignDistributorModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [distributorId, setDistributorId] = useState(
    initialDistributorId || ""
  );
  const [newMasterDistributorId, setNewMasterDistributorId] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [distributorSearch, setDistributorSearch] = useState("");
  const [masterSearch, setMasterSearch] = useState("");
  const mutation = useReassignDistributor();

  const debouncedDistributorSearch = useDebounced(distributorSearch);
  const debouncedMasterSearch = useDebounced(masterSearch);

  const distributorsQuery = useHierarchyDistributors(
    {
      page: 1,
      limit: HIERARCHY_DEFAULT_LIMIT,
      search: debouncedDistributorSearch || undefined,
    },
    isOpen
  );
  const masterQuery = useHierarchyMasterDistributors(
    {
      page: 1,
      limit: HIERARCHY_DEFAULT_LIMIT,
      search: debouncedMasterSearch || undefined,
    },
    isOpen
  );

  const distributors = distributorsQuery.data?.data ?? [];
  const masters = useMemo(
    () =>
      (masterQuery.data?.data ?? []).filter((m) => isActiveStatus(m.status)),
    [masterQuery.data]
  );

  const selectedDistributor = distributors.find((d) => d.id === distributorId);
  const currentMasterDistributorId =
    selectedDistributor?.masterDistributor?.id ||
    selectedDistributor?.parentId ||
    "";
  const currentMaster =
    masters.find((m) => m.id === currentMasterDistributorId) ||
    (selectedDistributor?.masterDistributor
      ? {
          id: selectedDistributor.masterDistributor.id,
          name: selectedDistributor.masterDistributor.name,
          userCode: selectedDistributor.masterDistributor.userCode,
        }
      : null);
  const newMaster = masters.find((m) => m.id === newMasterDistributorId);

  const distributorOptions = distributors.map((d) => ({
    value: d.id,
    label: formatUserOptionLabel(d),
    description: [
      d.userCode,
      d.masterDistributor?.name ? `MD: ${d.masterDistributor.name}` : null,
      d.status,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const masterOptions = masters
    .filter((m) => m.id !== currentMasterDistributorId)
    .map((m) => ({
      value: m.id,
      label: formatUserOptionLabel(m),
      description: [m.userCode, m.status].filter(Boolean).join(" · "),
    }));

  const onReview = () => {
    const parsed = reassignDistributorSchema.safeParse({
      distributorId,
      currentMasterDistributorId,
      newMasterDistributorId,
      reason,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setStep("confirm");
  };

  const onConfirm = async () => {
    if (!distributorId || !newMasterDistributorId) return;
    try {
      await mutation.mutateAsync({
        distributorId,
        payload: {
          masterDistributorId: newMasterDistributorId,
          ...(currentMasterDistributorId
            ? { currentMasterDistributorId }
            : {}),
          reason: reason.trim() || undefined,
        },
      });
      setStep("success");
    } catch {
      // Toast handled by mutation onError
    }
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === "success"
          ? "Distributor Reassigned Successfully"
          : step === "confirm"
            ? "Confirm Distributor Reassignment"
            : "Reassign Distributor"
      }
      subtitle={
        step === "form"
          ? "Move a distributor under a different master distributor"
          : undefined
      }
      size="lg"
      footer={
        step === "form" ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={onReview}>Review Reassignment</Button>
          </div>
        ) : step === "confirm" ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setStep("form")}
            >
              Back
            </Button>
            <Button disabled={mutation.isPending} onClick={() => void onConfirm()}>
              {mutation.isPending ? "Reassigning..." : "Confirm Reassignment"}
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button onClick={handleClose}>Close</Button>
          </div>
        )
      }
    >
      {step === "form" ? (
        <div className="space-y-4">
          <SearchableSelect
            label="Distributor *"
            value={distributorId}
            onChange={(value) => {
              setDistributorId(value);
              setNewMasterDistributorId("");
            }}
            options={distributorOptions}
            error={errors.distributorId}
            placeholder="Search distributor by name or ID"
            searchValue={distributorSearch}
            onSearchChange={setDistributorSearch}
            isLoading={distributorsQuery.isFetching}
          />

          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Current Master Distributor
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {currentMaster?.name || "—"}
            </p>
            <p className="text-xs text-muted">
              {currentMaster?.userCode ||
                currentMasterDistributorId ||
                "Select a distributor to load current MD"}
            </p>
            {errors.currentMasterDistributorId ? (
              <p className="mt-1 text-xs text-accent-red">
                {errors.currentMasterDistributorId}
              </p>
            ) : null}
          </div>

          <SearchableSelect
            label="New Master Distributor *"
            value={newMasterDistributorId}
            onChange={setNewMasterDistributorId}
            options={masterOptions}
            error={errors.newMasterDistributorId}
            placeholder="Select active master distributor"
            disabled={!distributorId}
            searchValue={masterSearch}
            onSearchChange={setMasterSearch}
            isLoading={masterQuery.isFetching}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Reason
            </label>
            <textarea
              value={reason}
              maxLength={500}
              rows={3}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Optional reason (max 500 characters)"
            />
            <p className="mt-1 text-right text-xs text-muted">
              {reason.length}/500
            </p>
            {errors.reason ? (
              <p className="mt-1 text-xs text-accent-red">{errors.reason}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "confirm" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border p-3">
              <p className="text-xs font-semibold uppercase text-muted">
                Distributor
              </p>
              <p className="mt-1 font-semibold">{selectedDistributor?.name}</p>
              <p className="text-xs text-muted">
                {selectedDistributor?.userCode}
              </p>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <p className="text-xs font-semibold uppercase text-muted">
                Current Master Distributor
              </p>
              <p className="mt-1 font-semibold">{currentMaster?.name}</p>
              <p className="text-xs text-muted">{currentMaster?.userCode}</p>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <p className="text-xs font-semibold uppercase text-muted">
                New Master Distributor
              </p>
              <p className="mt-1 font-semibold">{newMaster?.name}</p>
              <p className="text-xs text-muted">{newMaster?.userCode}</p>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p className="flex items-start gap-2 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Distributor will move under the new Master Distributor.
            </p>
            <p className="flex items-start gap-2 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Existing retailers will remain under this distributor.
            </p>
            <p className="flex items-start gap-2 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Future transactions will follow the new hierarchy.
            </p>
            <p className="flex items-start gap-2 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Historical transactions and commissions remain unchanged.
            </p>
          </div>
        </div>
      ) : null}

      {step === "success" ? (
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-semibold">{selectedDistributor?.name}</span>{" "}
            has been moved from:
          </p>
          <p className="rounded-xl bg-muted/40 px-3 py-2 font-medium">
            {currentMaster?.name}
          </p>
          <p>to:</p>
          <p className="rounded-xl bg-emerald-50 px-3 py-2 font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
            {newMaster?.name}
          </p>
          <p className="text-muted">
            Retailers under this distributor remain attached. Future
            transactions follow the new hierarchy.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
