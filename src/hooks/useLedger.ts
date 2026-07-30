"use client";

import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import { fetchLedger, fetchLedgerDetails } from "@/services/ledger.service";
import { LedgerFilters } from "@/types/ledger";

export const ledgerKeys = {
  all: ["ledger"] as const,
  list: (params: LedgerFilters) => [...ledgerKeys.all, "list", params] as const,
  detail: (id: string) => [...ledgerKeys.all, "detail", id] as const,
};

export function useLedger(params: LedgerFilters, enabled = true) {
  return useQuery({
    queryKey: ledgerKeys.list(params),
    queryFn: () => fetchLedger(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useLedgerDetails(ledgerId: string | null, enabled = true) {
  return useQuery({
    queryKey: ledgerKeys.detail(ledgerId || ""),
    queryFn: () => fetchLedgerDetails(ledgerId!),
    enabled: enabled && !!ledgerId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
