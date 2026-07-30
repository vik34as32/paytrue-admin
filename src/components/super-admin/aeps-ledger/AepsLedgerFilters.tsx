"use client";

import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { AepsLedgerSearch } from "@/components/super-admin/aeps-ledger/AepsLedgerSearch";
import { AepsLedgerFiltersState } from "@/types/super-admin-aeps-ledger";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
  { value: "PENDING", label: "Pending" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "REVERSED", label: "Reversed" },
];

const SERVICE_OPTIONS = [
  { value: "", label: "All Services" },
  { value: "AEPS", label: "AEPS" },
  { value: "CASH_WITHDRAWAL", label: "Cash Withdrawal" },
  { value: "CASH_DEPOSIT", label: "Cash Deposit" },
  { value: "BALANCE_ENQUIRY", label: "Balance Enquiry" },
  { value: "MINI_STATEMENT", label: "Mini Statement" },
];

interface AepsLedgerFiltersProps {
  value: AepsLedgerFiltersState;
  onChange: (next: AepsLedgerFiltersState) => void;
  retailerOptions?: { value: string; label: string }[];
  resultsCount?: number;
}

export function AepsLedgerFilters({
  value,
  onChange,
  retailerOptions = [{ value: "", label: "All Retailers" }],
  resultsCount,
}: AepsLedgerFiltersProps) {
  const patch = (partial: Partial<AepsLedgerFiltersState>) =>
    onChange({ ...value, ...partial });

  return (
    <div className="mb-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2 xl:col-span-2">
          <AepsLedgerSearch
            value={value.search}
            onChange={(search) => patch({ search })}
          />
        </div>
        <Select
          label="Retailer"
          value={value.retailerId}
          onChange={(e) => patch({ retailerId: e.target.value })}
          options={retailerOptions}
        />
        <Input
          label="Retailer Code"
          value={value.retailerCode}
          onChange={(e) => patch({ retailerCode: e.target.value })}
          placeholder="User code"
        />
        <Input
          label="Mobile Number"
          value={value.mobile}
          onChange={(e) => patch({ mobile: e.target.value })}
          placeholder="10-digit mobile"
        />
        <Input
          label="Ledger Number"
          value={value.ledgerNo}
          onChange={(e) => patch({ ledgerNo: e.target.value })}
          placeholder="Ledger / Txn ID"
        />
        <Input
          label="Reference ID"
          value={value.referenceId}
          onChange={(e) => patch({ referenceId: e.target.value })}
          placeholder="Reference ID"
        />
        <Input
          label="RRN"
          value={value.rrn}
          onChange={(e) => patch({ rrn: e.target.value })}
          placeholder="Bank RRN"
        />
        <Select
          label="Service"
          value={value.service}
          onChange={(e) => patch({ service: e.target.value })}
          options={SERVICE_OPTIONS}
        />
        <Select
          label="Status"
          value={value.status}
          onChange={(e) => patch({ status: e.target.value })}
          options={STATUS_OPTIONS}
        />
        <Input
          label="From Date"
          type="date"
          value={value.fromDate}
          onChange={(e) => patch({ fromDate: e.target.value })}
        />
        <Input
          label="To Date"
          type="date"
          value={value.toDate}
          onChange={(e) => patch({ toDate: e.target.value })}
        />
      </div>
      {typeof resultsCount === "number" ? (
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">
            {resultsCount.toLocaleString("en-IN")}
          </span>{" "}
          AEPS ledger entries
        </p>
      ) : null}
    </div>
  );
}
