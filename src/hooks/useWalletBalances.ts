"use client";

import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import { fetchWalletBalances } from "@/services/walletBalances.service";
import { WalletBalancesQuery } from "@/types/walletBalances";

export const walletBalancesKeys = {
  all: ["wallet-balances"] as const,
  list: (params: WalletBalancesQuery) =>
    [...walletBalancesKeys.all, "list", params] as const,
  summary: (userId: string) =>
    [...walletBalancesKeys.all, "summary", userId] as const,
};

export function useWalletBalances(
  params: WalletBalancesQuery,
  enabled = true
) {
  return useQuery({
    queryKey: walletBalancesKeys.list(params),
    queryFn: () => fetchWalletBalances(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
