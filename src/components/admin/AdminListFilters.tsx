"use client";

import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";

export interface AdminListFiltersValue {
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface AdminListFiltersProps {
  value: AdminListFiltersValue;
  onChange: (value: AdminListFiltersValue) => void;
  showStatus?: boolean;
  showDateRange?: boolean;
  showSort?: boolean;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blocked", label: "Blocked" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function AdminListFilters({
  value,
  onChange,
  showStatus = true,
  showDateRange = false,
  showSort = false,
}: AdminListFiltersProps) {
  const update = (patch: Partial<AdminListFiltersValue>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {showStatus && (
        <Select
          label="Status"
          value={value.status || ""}
          onChange={(e) => update({ status: e.target.value || undefined })}
          options={STATUS_OPTIONS}
        />
      )}
      {showDateRange && (
        <>
          <Input
            label="Start Date"
            type="date"
            value={value.startDate || ""}
            onChange={(e) => update({ startDate: e.target.value || undefined })}
          />
          <Input
            label="End Date"
            type="date"
            value={value.endDate || ""}
            onChange={(e) => update({ endDate: e.target.value || undefined })}
          />
        </>
      )}
      {showSort && (
        <>
          <Select
            label="Sort By"
            value={value.sortBy || "createdAt"}
            onChange={(e) => update({ sortBy: e.target.value })}
            options={[
              { value: "createdAt", label: "Created Date" },
              { value: "name", label: "Name" },
              { value: "email", label: "Email" },
            ]}
          />
          <Select
            label="Order"
            value={value.sortOrder || "desc"}
            onChange={(e) =>
              update({ sortOrder: e.target.value as "asc" | "desc" })
            }
            options={[
              { value: "desc", label: "Descending" },
              { value: "asc", label: "Ascending" },
            ]}
          />
        </>
      )}
    </div>
  );
}
