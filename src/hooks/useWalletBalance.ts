"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchWalletBalance } from "@/store/api/superAdminWalletApi";

interface UseWalletBalanceOptions {
  /** Fetch when the hook mounts (dashboard open / page refresh). Default true. */
  autoFetch?: boolean;
}

/**
 * Super Admin wallet balance — auto-fetches on login and dashboard mount.
 * Reads/writes Redux superAdminWallet slice.
 */
export function useWalletBalance(options: UseWalletBalanceOptions = {}) {
  const { autoFetch = true } = options;
  const dispatch = useAppDispatch();
  const { balance, isLoadingBalance, error, lastFetchedAt } = useAppSelector(
    (state) => state.superAdminWallet
  );
  const superAdminAuth = useAppSelector((state) => state.superAdminAuth);
  const mountedRef = useRef(false);

  const canFetch = superAdminAuth.isAuthenticated;

  const refresh = useCallback(
    (force = false) => {
      if (!canFetch) return;
      if (!force && isLoadingBalance) return;
      dispatch(fetchWalletBalance({ force: true }));
    },
    [dispatch, canFetch, isLoadingBalance]
  );

  useEffect(() => {
    if (!autoFetch || !canFetch) return;
    if (mountedRef.current) return;
    mountedRef.current = true;
    refresh(true);
  }, [autoFetch, canFetch, refresh]);

  return {
    balance,
    isLoading: isLoadingBalance,
    error,
    lastFetchedAt,
    refresh: () => refresh(true),
  };
}
