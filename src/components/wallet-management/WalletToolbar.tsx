"use client";

import { RefreshCw, Search, RotateCcw } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { WalletFilters } from "@/components/wallet-management/WalletFilters";
import {
  WALLET_PAGE_SIZE_OPTIONS,
  WalletFilterValues,
} from "@/schemas/wallet-filter.schema";

interface WalletToolbarProps {
  form: UseFormReturn<WalletFilterValues>;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onReset: () => void;
  isFetching?: boolean;
}

export function WalletToolbar({
  form,
  searchInput,
  onSearchChange,
  onRefresh,
  onReset,
  isFetching,
}: WalletToolbarProps) {
  const limit = form.watch("limit");

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, email, mobile, user code…"
            className="pl-9"
            aria-label="Search wallets"
          />
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="w-[120px]">
            <Select
              label="Rows"
              options={WALLET_PAGE_SIZE_OPTIONS.map((n) => ({
                value: String(n),
                label: String(n),
              }))}
              value={String(limit)}
              onChange={(e) => {
                form.setValue("limit", Number(e.target.value), {
                  shouldDirty: true,
                });
                form.setValue("page", 1);
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <WalletFilters form={form} />
    </div>
  );
}
