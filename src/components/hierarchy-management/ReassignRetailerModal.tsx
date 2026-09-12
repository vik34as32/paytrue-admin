"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { SearchableSelect } from "@/components/hierarchy-management/SearchableSelect";
import {
  useHierarchyDistributors,
  useHierarchyRetailers,
  useReassignRetailer,
} from "@/hooks/useHierarchyManagement";
import { reassignRetailerSchema } from "@/validations/hierarchyManagementSchemas";
import {
  formatUserOptionLabel,
  isActiveStatus,
  isDistributorRole,
  isMasterDistributorRole,
  isRetailerRole,
  looksLikeDistributorCode,
  looksLikeRetailerCode,
} from "@/lib/hierarchy/display";
import { HIERARCHY_DEFAULT_LIMIT } from "@/lib/hierarchy/pagination";

interface ReassignRetailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRetailerId?: string | null;
  /** Known current distributor id from tree parent (preferred over parentId guess) */
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

export function ReassignRetailerModal({
  isOpen,
  onClose,
  initialRetailerId,
  initialDistributorId,
}: ReassignRetailerModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [retailerId, setRetailerId] = useState(initialRetailerId || "");
  const [newDistributorId, setNewDistributorId] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [retailerSearch, setRetailerSearch] = useState("");
  const [distributorSearch, setDistributorSearch] = useState("");
  const mutation = useReassignRetailer();

  const debouncedRetailerSearch = useDebounced(retailerSearch);
  const debouncedDistributorSearch = useDebounced(distributorSearch);

  const retailersQuery = useHierarchyRetailers(
    {
      page: 1,
      limit: HIERARCHY_DEFAULT_LIMIT,
      search: debouncedRetailerSearch || undefined,
    },
    isOpen
  );

  // Ensure prefilled retailer is loaded even if not on first page
  const prefilledRetailerQuery = useHierarchyRetailers(
    {
      page: 1,
      limit: HIERARCHY_DEFAULT_LIMIT,
      search: initialRetailerId || undefined,
    },
    Boolean(isOpen && initialRetailerId)
  );

  const distributorsQuery = useHierarchyDistributors(
    {
      page: 1,
      limit: HIERARCHY_DEFAULT_LIMIT,
      search: debouncedDistributorSearch || undefined,
    },
    isOpen
  );

  const retailers = useMemo(() => {
    const map = new Map(
      [
        ...(retailersQuery.data?.data ?? []),
        ...(prefilledRetailerQuery.data?.data ?? []),
      ].map((item) => [item.id, item])
    );
    return Array.from(map.values()).filter(
      (r) =>
        isRetailerRole(r.userType) ||
        (!r.userType && looksLikeRetailerCode(r.userCode))
    );
  }, [retailersQuery.data, prefilledRetailerQuery.data]);

  const distributors = useMemo(
    () =>
      (distributorsQuery.data?.data ?? []).filter(
        (d) =>
          isDistributorRole(d.userType) &&
          looksLikeDistributorCode(d.userCode) &&
          isActiveStatus(d.status) &&
          !isMasterDistributorRole(d.userType) &&
          !isRetailerRole(d.userType)
      ),
    [distributorsQuery.data]
  );

  const selectedRetailer = retailers.find((r) => r.id === retailerId);

  // Backend source check uses: currentDistributorId || retailer.parentId
  // and requires that user to be DISTRIBUTOR (NOT master distributor).
  const sourceDistributorId =
    selectedRetailer?.parentId ||
    selectedRetailer?.distributor?.id ||
    (retailerId === initialRetailerId ? initialDistributorId : null) ||
    "";

  const currentDistributor =
    distributors.find((d) => d.id === sourceDistributorId) ||
    (selectedRetailer?.distributor?.id === sourceDistributorId
      ? {
          id: selectedRetailer.distributor.id,
          name: selectedRetailer.distributor.name,
          userCode: selectedRetailer.distributor.userCode,
          status: selectedRetailer.distributor.status,
          userType: selectedRetailer.distributor.userType || "DISTRIBUTOR",
        }
      : null);

  const newDistributor = distributors.find((d) => d.id === newDistributorId);

  const retailerOptions = retailers.map((r) => ({
    value: r.id,
    label: formatUserOptionLabel(r),
    description: ["RETAILER", r.userCode, r.status, r.mobile]
      .filter(Boolean)
      .join(" · "),
  }));

  const distributorOptions = distributors
    .filter((d) => d.id !== sourceDistributorId)
    .map((d) => ({
      value: d.id,
      label: formatUserOptionLabel(d),
      description: [
        "DISTRIBUTOR",
        d.userCode,
        d.masterDistributor?.name
          ? `MD: ${d.masterDistributor.name}`
          : null,
        d.status,
      ]
        .filter(Boolean)
        .join(" · "),
    }));

  const onReview = () => {
    const parsed = reassignRetailerSchema.safeParse({
      retailerId,
      currentDistributorId: sourceDistributorId || "",
      newDistributorId,
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
    if (!sourceDistributorId) {
      setErrors({
        retailerId:
          "This retailer has no distributor parent. Fix the retailer's hierarchy first.",
      });
      return;
    }
    if (!newDistributor || !isDistributorRole(newDistributor.userType)) {
      setErrors({
        newDistributorId: "Please select a valid active distributor.",
      });
      return;
    }
    if (newDistributorId === sourceDistributorId) {
      setErrors({
        newDistributorId: "Retailer is already assigned to this distributor.",
      });
      return;
    }
    setErrors({});
    setStep("confirm");
  };

  const onConfirm = async () => {
    if (!retailerId || !newDistributorId || !sourceDistributorId) return;
    if (!newDistributor || !isDistributorRole(newDistributor.userType)) {
      toast.error("Selected user is not a distributor.");
      return;
    }

    try {
      await mutation.mutateAsync({
        retailerId,
        payload: {
          distributorId: newDistributorId,
          currentDistributorId: sourceDistributorId,
          reason: reason.trim() || undefined,
        },
      });
      setStep("success");
    } catch {
      // Toast handled by mutation onError — prevent unhandledRejection
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
          ? "Retailer Reassigned Successfully"
          : step === "confirm"
            ? "Confirm Retailer Reassignment"
            : "Reassign Retailer"
      }
      subtitle={
        step === "form"
          ? "Move a retailer under a different distributor"
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
            label="Retailer *"
            value={retailerId}
            onChange={(value) => {
              setRetailerId(value);
              setNewDistributorId("");
            }}
            options={retailerOptions}
            error={errors.retailerId}
            placeholder="Search retailer by name or ID"
            searchValue={retailerSearch}
            onSearchChange={setRetailerSearch}
            isLoading={retailersQuery.isFetching}
          />

          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Current Distributor
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {currentDistributor?.name || "—"}
            </p>
            <p className="text-xs text-muted">
              {currentDistributor?.userCode ||
                sourceDistributorId ||
                "Select a retailer to load current distributor"}
            </p>
          </div>

          <SearchableSelect
            label="New Distributor *"
            value={newDistributorId}
            onChange={setNewDistributorId}
            options={distributorOptions}
            error={errors.newDistributorId}
            placeholder="Select active distributor only"
            emptyText="No distributors found"
            disabled={!retailerId}
            searchValue={distributorSearch}
            onSearchChange={setDistributorSearch}
            isLoading={distributorsQuery.isFetching}
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
                Retailer
              </p>
              <p className="mt-1 font-semibold">{selectedRetailer?.name}</p>
              <p className="text-xs text-muted">{selectedRetailer?.userCode}</p>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <p className="text-xs font-semibold uppercase text-muted">
                Current Distributor
              </p>
              <p className="mt-1 font-semibold">
                {currentDistributor?.name || "—"}
              </p>
              <p className="text-xs text-muted">
                {currentDistributor?.userCode}
              </p>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <p className="text-xs font-semibold uppercase text-muted">
                New Distributor
              </p>
              <p className="mt-1 font-semibold">{newDistributor?.name}</p>
              <p className="text-xs text-muted">{newDistributor?.userCode}</p>
            </div>
          </div>

          {reason ? (
            <div className="rounded-2xl border border-border bg-muted/20 p-3 text-sm">
              <span className="font-semibold">Reason: </span>
              {reason}
            </div>
          ) : null}

          <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="flex items-start gap-2 font-medium text-amber-800 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              All NEW transactions of this retailer will follow the new
              distributor hierarchy.
            </p>
            <p className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Historical transactions and commissions will remain unchanged.
            </p>
          </div>
        </div>
      ) : null}

      {step === "success" ? (
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-semibold">{selectedRetailer?.name}</span> has
            been moved from:
          </p>
          <p className="rounded-xl bg-muted/40 px-3 py-2 font-medium">
            {currentDistributor?.name || "—"}
          </p>
          <p>to:</p>
          <p className="rounded-xl bg-emerald-50 px-3 py-2 font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
            {newDistributor?.name}
          </p>
          <p className="text-muted">
            Future transactions will follow the new hierarchy.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
