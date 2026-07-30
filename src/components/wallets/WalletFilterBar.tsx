"use client";

import { Download, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { WalletSearch } from "@/components/wallets/WalletSearch";

const ROLE_OPTIONS = [
  { value: "", label: "All" },
  { value: "ADMIN", label: "Admin" },
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
];

interface WalletFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  limit: number;
  onLimitChange: (value: number) => void;
  onRefresh: () => void;
  onReset: () => void;
  onExport?: () => void;
  isFetching?: boolean;
}

export function WalletFilterBar({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
  limit,
  onLimitChange,
  onRefresh,
  onReset,
  onExport,
  isFetching,
}: WalletFilterBarProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <WalletSearch value={search} onChange={onSearchChange} />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={isFetching}
            className="gap-2"
            aria-label="Refresh wallet balances"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onExport}
            className="gap-2"
            aria-label="Export wallet balances"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="gap-2"
            aria-label="Reset filters"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
        />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        />
        <Select
          label="Page size"
          options={PAGE_SIZE_OPTIONS}
          value={String(limit)}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
