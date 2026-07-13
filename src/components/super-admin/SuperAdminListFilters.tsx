"use client";

import { HiSearch } from "react-icons/hi";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { cn } from "@/lib/utils";

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
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  resultsCount?: number;
  resultsLabel?: string;
  adminSelect?: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    label?: string;
  };
  pageSizeSelect?: {
    value: number;
    onChange: (value: number) => void;
    options?: { value: string; label: string }[];
    label?: string;
  };
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
  { value: "ADD_BALANCE", label: "Add Balance" },
];

const filterFieldClass = "w-[150px] shrink-0";
const wideFilterFieldClass = "w-[170px] shrink-0";
const adminSelectClass = "w-[200px] shrink-0";

const DEFAULT_PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
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
  search,
  onSearch,
  searchPlaceholder = "Search...",
  resultsCount,
  resultsLabel,
  adminSelect,
  pageSizeSelect,
}: SuperAdminListFiltersProps) {
  const update = (patch: Partial<SuperAdminListFiltersValue>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="mb-4 overflow-x-auto pb-1">
      <div className="flex min-w-max items-end gap-3">
        {onSearch && (
          <div className="w-[280px] shrink-0">
            <Input
              placeholder={searchPlaceholder}
              icon={<HiSearch className="h-4 w-4" />}
              value={search ?? ""}
              onChange={(event) => onSearch(event.target.value)}
            />
          </div>
        )}

        {adminSelect && (
          <div className={adminSelectClass}>
            <Select
              label={adminSelect.label || "Select Admin"}
              value={adminSelect.value}
              onChange={(event) => adminSelect.onChange(event.target.value)}
              options={adminSelect.options}
            />
          </div>
        )}

        {showStatus && (
          <div className={filterFieldClass}>
            <Select
              label="Status"
              value={value.status || ""}
              onChange={(e) => update({ status: e.target.value || undefined })}
              options={STATUS_OPTIONS}
            />
          </div>
        )}

        {showCity && (
          <div className={filterFieldClass}>
            <Input
              label="City"
              placeholder="City"
              value={value.city || ""}
              onChange={(e) => update({ city: e.target.value || undefined })}
            />
          </div>
        )}

        {showState && (
          <div className={filterFieldClass}>
            <Input
              label="State"
              placeholder="State"
              value={value.state || ""}
              onChange={(e) => update({ state: e.target.value || undefined })}
            />
          </div>
        )}

        {showDateRange && (
          <>
            <div className={wideFilterFieldClass}>
              <Input
                label="Start Date"
                type="date"
                value={value.startDate || ""}
                onChange={(e) =>
                  update({ startDate: e.target.value || undefined })
                }
              />
            </div>
            <div className={wideFilterFieldClass}>
              <Input
                label="End Date"
                type="date"
                value={value.endDate || ""}
                onChange={(e) => update({ endDate: e.target.value || undefined })}
              />
            </div>
          </>
        )}

        {showTransactionType && (
          <div className={wideFilterFieldClass}>
            <Select
              label="Transaction Type"
              value={value.transactionType || ""}
              onChange={(e) =>
                update({ transactionType: e.target.value || undefined })
              }
              options={TRANSACTION_TYPE_OPTIONS}
            />
          </div>
        )}

        {showSort && (
          <>
            <div className={wideFilterFieldClass}>
              <Select
                label="Sort By"
                value={value.sortBy || "createdAt"}
                onChange={(e) => update({ sortBy: e.target.value })}
                options={sortOptions}
              />
            </div>
            <div className={filterFieldClass}>
              <Select
                label="Order"
                value={value.sortOrder || "desc"}
                onChange={(e) =>
                  update({ sortOrder: e.target.value as "asc" | "desc" })
                }
                options={SORT_ORDER_OPTIONS}
              />
            </div>
          </>
        )}

        {pageSizeSelect && (
          <div className={filterFieldClass}>
            <Select
              label={pageSizeSelect.label || "Page Size"}
              value={String(pageSizeSelect.value)}
              onChange={(event) =>
                pageSizeSelect.onChange(Number(event.target.value))
              }
              options={pageSizeSelect.options || DEFAULT_PAGE_SIZE_OPTIONS}
            />
          </div>
        )}

        {resultsCount !== undefined && (
          <p
            className={cn(
              "shrink-0 whitespace-nowrap pb-2.5 text-sm text-muted",
              onSearch || adminSelect ? "ml-1" : "ml-auto"
            )}
          >
            {resultsCount} {resultsLabel || "results"}
          </p>
        )}
      </div>
    </div>
  );
}
