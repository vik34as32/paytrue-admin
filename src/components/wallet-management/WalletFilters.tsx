"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { Select } from "@/components/common/Select";
import {
  WALLET_ROLE_OPTIONS,
  WALLET_STATUS_OPTIONS,
  WALLET_VERIFICATION_OPTIONS,
  WalletFilterValues,
} from "@/schemas/wallet-filter.schema";

interface WalletFiltersProps {
  form: UseFormReturn<WalletFilterValues>;
}

export function WalletFilters({ form }: WalletFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Controller
        name="role"
        control={form.control}
        render={({ field }) => (
          <Select
            label="Role"
            options={[...WALLET_ROLE_OPTIONS]}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />
      <Controller
        name="status"
        control={form.control}
        render={({ field }) => (
          <Select
            label="Status"
            options={[...WALLET_STATUS_OPTIONS]}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />
      <Controller
        name="verificationStatus"
        control={form.control}
        render={({ field }) => (
          <Select
            label="Verification"
            options={[...WALLET_VERIFICATION_OPTIONS]}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />
    </div>
  );
}
