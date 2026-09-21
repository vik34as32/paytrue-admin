"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { PermissionPanel } from "@/components/permissions/PermissionPanel";
import type {
  CreatePermissionPayload,
  PermissionDefinitionStatus,
  ServicePermission,
} from "@/types/permissions";

const PRESET_TYPES = ["DMT", "DMT3", "AEPS", "UPI ATM", "WALLET", "BBPS"];

interface ServicePermissionFormProps {
  open: boolean;
  mode: "create" | "edit";
  existing?: ServicePermission | null;
  serviceTypes: string[];
  submitting: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreatePermissionPayload) => Promise<void>;
}

function normalizeKey(value: string) {
  return value.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").toUpperCase();
}

function getInitialType(
  existing: ServicePermission | null | undefined,
  serviceTypes: string[]
) {
  const type = existing?.serviceType || "DMT";
  const known = new Set([...PRESET_TYPES, ...serviceTypes]);
  if (known.has(type)) {
    return { serviceType: type, customType: "" };
  }
  return { serviceType: "__custom", customType: type };
}

export function ServicePermissionForm({
  open,
  mode,
  existing,
  serviceTypes,
  submitting,
  error,
  onClose,
  onSubmit,
}: ServicePermissionFormProps) {
  const initialType = getInitialType(existing, serviceTypes);
  const [name, setName] = useState(existing?.name || "");
  const [key, setKey] = useState(existing?.key || "");
  const [serviceType, setServiceType] = useState(initialType.serviceType);
  const [customType, setCustomType] = useState(initialType.customType);
  const [description, setDescription] = useState(existing?.description || "");
  const [status, setStatus] = useState<PermissionDefinitionStatus>(
    existing?.status || "ACTIVE"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeOptions = useMemo(() => {
    const merged = Array.from(
      new Set([...PRESET_TYPES, ...serviceTypes.filter(Boolean)])
    );
    return [
      ...merged.map((item) => ({ value: item, label: item })),
      { value: "__custom", label: "Other / custom" },
    ];
  }, [serviceTypes]);

  const resolvedType =
    serviceType === "__custom" ? customType.trim() : serviceType.trim();

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Service name is required";
    if (!key.trim()) next.key = "Permission key is required";
    else if (key !== key.toUpperCase()) {
      next.key = "Permission key must be uppercase";
    }
    if (!resolvedType) next.serviceType = "Service type is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit({
      name: name.trim(),
      permissionKey: key.trim().toUpperCase(),
      serviceType: resolvedType,
      description: description.trim(),
      status,
    });
  };

  return (
    <PermissionPanel
      open={open}
      title={
        mode === "create"
          ? "Add New Service Permission"
          : "Edit Service Permission"
      }
      subtitle="Define a service that Super Admin can assign to the network."
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={submitting}>
            {mode === "create" ? "Create Permission" : "Save Changes"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <Input
          label="Service Name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!existing && !key) {
              setKey(normalizeKey(event.target.value));
            }
          }}
          placeholder="DMT Transfer"
          error={errors.name}
        />
        <Input
          label="Permission Key"
          value={key}
          onChange={(event) => setKey(normalizeKey(event.target.value))}
          placeholder="DMT_TRANSFER"
          error={errors.key}
        />
        <Select
          label="Service Type"
          value={serviceType}
          onChange={(event) => setServiceType(event.target.value)}
          options={typeOptions}
          error={errors.serviceType}
        />
        {serviceType === "__custom" ? (
          <Input
            label="Custom service type"
            value={customType}
            onChange={(event) => setCustomType(event.target.value)}
            placeholder="DMT"
          />
        ) : null}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Allow user to perform DMT money transfer"
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Select
          label="Status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as PermissionDefinitionStatus)
          }
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />
        <div className="rounded-xl border border-border bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Preview
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted">
                {resolvedType || "Service"}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {name || "Service name"}
              </p>
              <p className="font-mono text-xs text-muted">{key || "KEY"}</p>
            </div>
            <Badge variant={status === "ACTIVE" ? "active" : "inactive"}>
              {status === "ACTIVE" ? "Active" : "Disabled"}
            </Badge>
          </div>
        </div>
      </div>
    </PermissionPanel>
  );
}
