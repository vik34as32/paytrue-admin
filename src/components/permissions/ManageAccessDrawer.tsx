"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Lock,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/modals/Modal";
import { PermissionPanel } from "@/components/permissions/PermissionPanel";
import { cn } from "@/lib/utils";
import { groupPermissionsByService } from "@/services/permissionManagementApi";
import { getServiceIcon } from "@/components/permissions/serviceIcons";
import type {
  PermissionUserOption,
  ServicePermission,
} from "@/types/permissions";

interface ManageAccessDrawerProps {
  open: boolean;
  user: PermissionUserOption | null;
  catalog: ServicePermission[];
  enabledIds: string[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onSave: (permissionIds: string[]) => Promise<void>;
}

export function ManageAccessDrawer({
  open,
  user,
  catalog,
  enabledIds,
  loading,
  saving,
  error,
  onClose,
  onRetry,
  onSave,
}: ManageAccessDrawerProps) {
  const [draftIds, setDraftIds] = useState<string[]>(enabledIds);
  const [discardOpen, setDiscardOpen] = useState(false);

  const activeCatalog = useMemo(
    () => catalog.filter((item) => item.status === "ACTIVE"),
    [catalog]
  );
  const groups = useMemo(
    () => groupPermissionsByService(activeCatalog),
    [activeCatalog]
  );
  const enabledSet = useMemo(() => new Set(draftIds), [draftIds]);
  const enabledCount = activeCatalog.filter((item) =>
    enabledSet.has(item.id)
  ).length;
  const servicesEnabled = groups.filter((group) =>
    group.permissions.some((item) => enabledSet.has(item.id))
  ).length;
  const dirty = useMemo(() => {
    if (draftIds.length !== enabledIds.length) return true;
    const baseline = new Set(enabledIds);
    return draftIds.some((id) => !baseline.has(id));
  }, [draftIds, enabledIds]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const requestClose = () => {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  };

  const toggle = (id: string) => {
    setDraftIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const setGroup = (ids: string[], enabled: boolean) => {
    setDraftIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (enabled) next.add(id);
        else next.delete(id);
      }
      return Array.from(next);
    });
  };

  return (
    <>
      <PermissionPanel
        open={open}
        wide
        title="Manage Permissions"
        subtitle="Enable or lock services for this user. Changes save only when you confirm."
        onClose={requestClose}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              {dirty ? "Changes not saved" : "No unsaved changes"}
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={requestClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={() => onSave(draftIds)}
                isLoading={saving}
                disabled={!dirty}
              >
                Save Permissions
              </Button>
            </div>
          </div>
        }
      >
        {user ? (
          <div className="mb-5 rounded-2xl border border-border bg-slate-50 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  {user.roleLabel}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Mobile: {user.mobile || "—"}
                </p>
              </div>
              <Badge
                variant={
                  String(user.status).toUpperCase() === "ACTIVE"
                    ? "active"
                    : "inactive"
                }
              >
                {user.status || "Unknown"}
              </Badge>
            </div>
          </div>
        ) : null}

        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {enabledCount} / {activeCatalog.length} Permissions Enabled
            </p>
            <p className="text-xs text-muted">
              Services enabled: {servicesEnabled} / {groups.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDraftIds(activeCatalog.map((item) => item.id))
              }
            >
              Select All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDraftIds([])}
            >
              Clear All
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <Button className="mt-3" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            No services found.
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">
              Service Access
            </p>
            {groups.map((group) => {
              const Icon = getServiceIcon(group.serviceType);
              const ids = group.permissions.map((item) => item.id);
              const onCount = group.permissions.filter((item) =>
                enabledSet.has(item.id)
              ).length;
              return (
                <section
                  key={group.serviceType}
                  className="overflow-hidden rounded-2xl border border-border bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {group.serviceType}
                        </p>
                        <p className="text-xs text-muted">
                          {onCount} / {group.permissions.length} Access
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setGroup(ids, true)}
                      >
                        Enable All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setGroup(ids, false)}
                      >
                        Disable All
                      </Button>
                    </div>
                  </div>
                  <ul className="divide-y divide-border">
                    {group.permissions.map((item) => {
                      const enabled = enabledSet.has(item.id);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => toggle(item.id)}
                            aria-pressed={enabled}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
                              enabled
                                ? "bg-white"
                                : "bg-slate-50/80 text-muted"
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                  enabled
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-200 text-slate-500"
                                )}
                              >
                                {enabled ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                              </span>
                              <span className="min-w-0">
                                <span
                                  className={cn(
                                    "block text-sm font-medium",
                                    enabled
                                      ? "text-foreground"
                                      : "text-slate-500"
                                  )}
                                >
                                  {item.name}
                                </span>
                                <span className="block font-mono text-[11px] text-muted">
                                  {item.key}
                                </span>
                              </span>
                            </span>
                            <Badge
                              variant={enabled ? "success" : "inactive"}
                              className="shrink-0"
                            >
                              {enabled ? (
                                <Unlock className="h-3 w-3" />
                              ) : (
                                <Lock className="h-3 w-3" />
                              )}
                              {enabled ? "Enabled" : "Locked"}
                            </Badge>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </PermissionPanel>

      <Modal
        isOpen={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Unsaved Changes"
        subtitle="You have permission changes that have not been saved."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDiscardOpen(false)}>
              Stay
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDiscardOpen(false);
                setDraftIds(enabledIds);
                onClose();
              }}
            >
              Discard Changes
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted">
          Leave this screen only if you are sure you do not need to keep the
          current access changes.
        </p>
      </Modal>
    </>
  );
}

export function AccessSummary({
  catalog,
  enabledIds,
}: {
  catalog: ServicePermission[];
  enabledIds: string[];
}) {
  const groups = groupPermissionsByService(
    catalog.filter((item) => item.status === "ACTIVE")
  );
  const enabled = new Set(enabledIds);
  if (!groups.length) {
    return <span className="text-xs text-muted">No services</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.map((group) => {
        const granted = group.permissions.some((item) => enabled.has(item.id));
        return (
          <span
            key={group.serviceType}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              granted
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
            )}
          >
            {granted ? (
              <ShieldCheck className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            {group.serviceType}
          </span>
        );
      })}
    </div>
  );
}
