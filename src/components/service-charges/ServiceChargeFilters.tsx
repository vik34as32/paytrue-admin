"use client";

import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import {
  FILTER_FREQUENCY_OPTIONS,
  FILTER_ROLE_OPTIONS,
  FILTER_STATUS_OPTIONS,
} from "@/schemas/service-charge.schema";
import {
  ServiceChargeFrequency,
  ServiceChargeRole,
  ServiceChargeStatus,
} from "@/types/serviceCharge";

export interface ServiceChargeFiltersValue {
  search: string;
  status: ServiceChargeStatus | "";
  frequency: ServiceChargeFrequency | "";
  role: ServiceChargeRole | "";
  startDate: string;
  endDate: string;
}

interface ServiceChargeFiltersProps {
  value: ServiceChargeFiltersValue;
  onChange: (next: ServiceChargeFiltersValue) => void;
  resultsCount?: number;
}

export function ServiceChargeFilters({
  value,
  onChange,
  resultsCount,
}: ServiceChargeFiltersProps) {
  const patch = (partial: Partial<ServiceChargeFiltersValue>) =>
    onChange({ ...value, ...partial });

  return (
    <div className="mb-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="md:col-span-2">
          <Input
            label="Search"
            value={value.search}
            onChange={(e) => patch({ search: e.target.value })}
            placeholder="Search plan name, remarks..."
          />
        </div>
        <Select
          label="Status"
          value={value.status}
          onChange={(e) =>
            patch({ status: e.target.value as ServiceChargeStatus | "" })
          }
          options={FILTER_STATUS_OPTIONS}
        />
        <Select
          label="Frequency"
          value={value.frequency}
          onChange={(e) =>
            patch({
              frequency: e.target.value as ServiceChargeFrequency | "",
            })
          }
          options={FILTER_FREQUENCY_OPTIONS}
        />
        <Select
          label="Role"
          value={value.role}
          onChange={(e) =>
            patch({ role: e.target.value as ServiceChargeRole | "" })
          }
          options={FILTER_ROLE_OPTIONS}
        />
        <div className="grid grid-cols-2 gap-3 xl:contents">
          <Input
            label="From"
            type="date"
            value={value.startDate}
            onChange={(e) => patch({ startDate: e.target.value })}
          />
          <Input
            label="To"
            type="date"
            value={value.endDate}
            onChange={(e) => patch({ endDate: e.target.value })}
          />
        </div>
      </div>
      {typeof resultsCount === "number" ? (
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">{resultsCount}</span>{" "}
          plans found
        </p>
      ) : null}
    </div>
  );
}
