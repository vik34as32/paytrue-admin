"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWalletSummary } from "@/services/walletBalances.service";
import { walletBalancesKeys } from "@/hooks/useWalletBalances";

export function useWalletSummary(userId: string | null, enabled = true) {
  return useQuery({
    queryKey: walletBalancesKeys.summary(userId || ""),
    queryFn: () => fetchWalletSummary(userId!),
    enabled: enabled && !!userId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
