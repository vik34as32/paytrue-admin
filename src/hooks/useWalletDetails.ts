"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchWalletUserBalances,
  fetchWalletUserDetails,
} from "@/services/wallet.service";
import { walletKeys } from "@/hooks/useWalletUsers";

export function useWalletDetails(userId: string | null, enabled = true) {
  return useQuery({
    queryKey: walletKeys.details(userId || ""),
    queryFn: () => fetchWalletUserDetails(userId!),
    enabled: enabled && !!userId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/** Profile / view-user balances — Wallet Management filters (role + search). */
export function useUserWalletBalances(
  params: {
    userId: string | null;
    role?: string;
    search?: string;
  },
  enabled = true
) {
  const { userId, role, search } = params;

  return useQuery({
    queryKey: [
      ...walletKeys.details(userId || ""),
      "balances",
      role || "",
      search || "",
    ],
    queryFn: () =>
      fetchWalletUserBalances({
        userId: userId!,
        role,
        search,
      }),
    enabled: enabled && !!userId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
