"use client";

import { Button, DatePicker, Select, Space } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { RefreshCw, RotateCcw } from "lucide-react";
import { LedgerSearch } from "@/components/ledger/LedgerSearch";
import { LedgerExportButton } from "@/components/ledger/LedgerExportButton";
import { LedgerRow } from "@/types/ledger";

const { RangePicker } = DatePicker;

const SERVICE_OPTIONS = [
  { value: "", label: "All Services" },
  { value: "WALLET", label: "Wallet" },
  { value: "AEPS", label: "AEPS" },
  { value: "DMT", label: "DMT" },
  { value: "FUND_REQUEST", label: "Fund Request" },
  { value: "HIERARCHY", label: "Hierarchy" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "SUCCESS", label: "Success" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const TYPE_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "CREDIT", label: "Credit" },
  { value: "DEBIT", label: "Debit" },
  { value: "REFUND", label: "Refund" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
];

interface LedgerFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  role: string;
  onRoleChange: (v: string) => void;
  serviceType: string;
  onServiceTypeChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  transactionType: string;
  onTransactionTypeChange: (v: string) => void;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  onDateRangeChange: (range: [Dayjs | null, Dayjs | null] | null) => void;
  onReset: () => void;
  onRefresh: () => void;
  exportRows: LedgerRow[];
  isFetching?: boolean;
}

export function LedgerFilterBar({
  search,
  onSearchChange,
  role,
  onRoleChange,
  serviceType,
  onServiceTypeChange,
  status,
  onStatusChange,
  transactionType,
  onTransactionTypeChange,
  dateRange,
  onDateRangeChange,
  onReset,
  onRefresh,
  exportRows,
  isFetching,
}: LedgerFilterBarProps) {
  return (
    <div className="sticky top-0 z-20 space-y-3 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <LedgerSearch value={search} onChange={onSearchChange} />
        <Space wrap>
          <Button
            icon={<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />}
            onClick={onRefresh}
            loading={isFetching}
          >
            Refresh
          </Button>
          <Button icon={<RotateCcw className="h-4 w-4" />} onClick={onReset}>
            Reset
          </Button>
          <LedgerExportButton rows={exportRows} />
        </Space>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Select
          size="large"
          value={role || undefined}
          placeholder="Role"
          options={ROLE_OPTIONS}
          onChange={(v) => onRoleChange(v ?? "")}
          allowClear
        />
        <Select
          size="large"
          value={serviceType || undefined}
          placeholder="Service Type"
          options={SERVICE_OPTIONS}
          onChange={(v) => onServiceTypeChange(v ?? "")}
          allowClear
        />
        <Select
          size="large"
          value={status || undefined}
          placeholder="Status"
          options={STATUS_OPTIONS}
          onChange={(v) => onStatusChange(v ?? "")}
          allowClear
        />
        <Select
          size="large"
          value={transactionType}
          placeholder="Transaction Type"
          options={TYPE_OPTIONS}
          onChange={(v) => onTransactionTypeChange(v ?? "ALL")}
        />
        <RangePicker
          size="large"
          className="w-full"
          value={dateRange}
          onChange={(values) =>
            onDateRangeChange(
              values ? [values[0] ?? null, values[1] ?? null] : null
            )
          }
          disabledDate={(current) =>
            !!current && current.isAfter(dayjs().endOf("day"))
          }
        />
      </div>
    </div>
  );
}
