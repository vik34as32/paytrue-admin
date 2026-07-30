"use client";

import { Input } from "antd";
import { Search } from "lucide-react";

interface LedgerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function LedgerSearch({ value, onChange }: LedgerSearchProps) {
  return (
    <Input
      allowClear
      size="large"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search name, user ID, txn ID, reference…"
      prefix={<Search className="h-4 w-4 text-muted" aria-hidden />}
      aria-label="Search ledger"
      className="max-w-xl"
    />
  );
}
