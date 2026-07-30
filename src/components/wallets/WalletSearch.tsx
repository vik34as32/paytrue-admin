"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/common/Input";

interface WalletSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function WalletSearch({
  value,
  onChange,
  placeholder = "Search name, email, mobile, user code…",
}: WalletSearchProps) {
  return (
    <div className="relative w-full max-w-xl">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label="Search wallets"
      />
    </div>
  );
}
