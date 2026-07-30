"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPublicNetworkUsers,
  type PublicNetworkUserType,
} from "@/services/publicNetworkUsersApi";
import { getUserWalletSummary } from "@/services/walletSummaryApi";
import {
  normalizeTransferRole,
  publicNetworkUserToReceiver,
} from "@/lib/walletTransferOptions";
import type { WalletTransferReceiver } from "@/types/wallet";

async function enrichBalances(
  receivers: WalletTransferReceiver[]
): Promise<WalletTransferReceiver[]> {
  if (!receivers.length) return receivers;

  const enriched = await Promise.all(
    receivers.map(async (receiver) => {
      try {
        const summary = await getUserWalletSummary(
          receiver.id,
          { page: 1, pageSize: 1 },
          "admin"
        );
        const balance = summary.header?.currentBalance;
        return {
          ...receiver,
          balance:
            typeof balance === "number" && Number.isFinite(balance)
              ? balance
              : receiver.balance,
          mobile: summary.header?.mobile || receiver.mobile,
          name: summary.header?.name || receiver.name,
        };
      } catch {
        return receiver;
      }
    })
  );

  return enriched;
}

/**
 * Loads MD / DD / RT receivers from
 * GET /api/v1/public/network-users?userType=...
 * and enriches each row with live wallet balance.
 */
export function usePublicNetworkReceivers(activeRole: string) {
  const [receivers, setReceivers] = useState<WalletTransferReceiver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (role: string) => {
    const userType = normalizeTransferRole(role) as PublicNetworkUserType;
    if (
      userType !== "MASTER_DISTRIBUTOR" &&
      userType !== "DISTRIBUTOR" &&
      userType !== "RETAILER"
    ) {
      setReceivers([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const users = await getPublicNetworkUsers(userType);
      const mapped = users
        .map((user) => publicNetworkUserToReceiver(user, userType))
        .filter((receiver): receiver is WalletTransferReceiver =>
          Boolean(receiver)
        );

      // Show list immediately, then fill balances
      setReceivers(mapped);
      const withBalances = await enrichBalances(mapped);
      setReceivers(withBalances);
    } catch (err) {
      setReceivers([]);
      setError(
        err instanceof Error ? err.message : "Failed to load network users"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(activeRole);
  }, [activeRole, load]);

  return {
    receivers,
    isLoading,
    error,
    reload: () => load(activeRole),
  };
}
