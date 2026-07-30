"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/common/Input";

interface AepsLedgerSearchProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function AepsLedgerSearch({
  value,
  onChange,
  disabled,
}: AepsLedgerSearchProps) {
  return (
    <Input
      label="Search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Ledger no, retailer, code, mobile, ref, RRN, remarks..."
      icon={<Search className="h-4 w-4" />}
      disabled={disabled}
    />
  );
}
