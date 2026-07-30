"use client";

import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import { fetchWalletUsers } from "@/services/wallet.service";
import { WalletUsersListParams } from "@/types/wallet";

export const walletKeys = {
  all: ["wallet"] as const,
  users: (params: WalletUsersListParams) =>
    [...walletKeys.all, "users", params] as const,
  details: (userId: string) =>
    [...walletKeys.all, "details", userId] as const,
};

export function useWalletUsers(params: WalletUsersListParams, enabled = true) {
  return useQuery({
    queryKey: walletKeys.users(params),
    queryFn: () => fetchWalletUsers(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
