"use client";

import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";

export interface AdminListFiltersValue {
  status?: string;
  userType?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface AdminListFiltersProps {
  value: AdminListFiltersValue;
  onChange: (value: AdminListFiltersValue) => void;
  showStatus?: boolean;
  showFundRequestStatus?: boolean;
  showUserType?: boolean;
  showDateRange?: boolean;
  showSort?: boolean;
  /** Use legacy lowercase status values (older APIs). Default: uppercase ACTIVE/... */
  legacyStatusValues?: boolean;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
];

const FUND_REQUEST_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const USER_TYPE_OPTIONS = [
  { value: "", label: "All User Types" },
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
];

const LEGACY_STATUS_OPTIONS = [
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
  showFundRequestStatus = false,
  showUserType = false,
  showDateRange = false,
  showSort = false,
  legacyStatusValues = false,
}: AdminListFiltersProps) {
  const update = (patch: Partial<AdminListFiltersValue>) =>
    onChange({ ...value, ...patch });

  const statusOptions = showFundRequestStatus
    ? FUND_REQUEST_STATUS_OPTIONS
    : legacyStatusValues
      ? LEGACY_STATUS_OPTIONS
      : STATUS_OPTIONS;

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {(showStatus || showFundRequestStatus) && (
        <Select
          label="Status"
          value={value.status || ""}
          onChange={(e) => update({ status: e.target.value || undefined })}
          options={statusOptions}
        />
      )}
      {showUserType && (
        <Select
          label="User Type"
          value={value.userType || ""}
          onChange={(e) => update({ userType: e.target.value || undefined })}
          options={USER_TYPE_OPTIONS}
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
              { value: "phone", label: "Phone" },
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
