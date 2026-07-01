"use client";

import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";

export interface SuperAdminListFiltersValue {
  status?: string;
  city?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  transactionType?: string;
}

interface SuperAdminListFiltersProps {
  value: SuperAdminListFiltersValue;
  onChange: (value: SuperAdminListFiltersValue) => void;
  showStatus?: boolean;
  showCity?: boolean;
  showState?: boolean;
  showDateRange?: boolean;
  showSort?: boolean;
  showTransactionType?: boolean;
  sortOptions?: { value: string; label: string }[];
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blocked", label: "Blocked" },
  { value: "suspended", label: "Suspended" },
];

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

const TRANSACTION_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "CREDIT", label: "Credit" },
  { value: "DEBIT", label: "Debit" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "ADD_BALANCE", label: "Add Balance" },
];

export function SuperAdminListFilters({
  value,
  onChange,
  showStatus = true,
  showCity = false,
  showState = false,
  showDateRange = false,
  showSort = false,
  showTransactionType = false,
  sortOptions = [
    { value: "createdAt", label: "Created Date" },
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
  ],
}: SuperAdminListFiltersProps) {
  const update = (patch: Partial<SuperAdminListFiltersValue>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      {showStatus && (
        <Select
          label="Status"
          value={value.status || ""}
          onChange={(e) => update({ status: e.target.value || undefined })}
          options={STATUS_OPTIONS}
        />
      )}
      {showCity && (
        <Input
          label="City"
          placeholder="Filter by city"
          value={value.city || ""}
          onChange={(e) => update({ city: e.target.value || undefined })}
        />
      )}
      {showState && (
        <Input
          label="State"
          placeholder="Filter by state"
          value={value.state || ""}
          onChange={(e) => update({ state: e.target.value || undefined })}
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
      {showTransactionType && (
        <Select
          label="Transaction Type"
          value={value.transactionType || ""}
          onChange={(e) =>
            update({ transactionType: e.target.value || undefined })
          }
          options={TRANSACTION_TYPE_OPTIONS}
        />
      )}
      {showSort && (
        <>
          <Select
            label="Sort By"
            value={value.sortBy || "createdAt"}
            onChange={(e) => update({ sortBy: e.target.value })}
            options={sortOptions}
          />
          <Select
            label="Order"
            value={value.sortOrder || "desc"}
            onChange={(e) =>
              update({ sortOrder: e.target.value as "asc" | "desc" })
            }
            options={SORT_ORDER_OPTIONS}
          />
        </>
      )}
    </div>
  );
}
