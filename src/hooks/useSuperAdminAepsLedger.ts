"use client";

import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import { fetchSuperAdminAepsLedger } from "@/services/super-admin-aeps-ledger.service";
import { AepsLedgerQueryParams } from "@/types/super-admin-aeps-ledger";

export const aepsLedgerKeys = {
  all: ["super-admin-aeps-ledger"] as const,
  lists: () => [...aepsLedgerKeys.all, "list"] as const,
  list: (params: AepsLedgerQueryParams) =>
    [...aepsLedgerKeys.lists(), params] as const,
};

export function useSuperAdminAepsLedger(
  params: AepsLedgerQueryParams,
  enabled = true
) {
  return useQuery({
    queryKey: aepsLedgerKeys.list(params),
    queryFn: () => fetchSuperAdminAepsLedger(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
