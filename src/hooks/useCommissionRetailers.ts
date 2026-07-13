"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPublicNetworkUsers,
  type PublicNetworkUser,
} from "@/services/publicNetworkUsersApi";

async function fetchAllRetailers(): Promise<PublicNetworkUser[]> {
  return getPublicNetworkUsers("RETAILER");
}

export function useCommissionRetailers() {
  const [retailers, setRetailers] = useState<PublicNetworkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRetailers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllRetailers();
      setRetailers(data);
    } catch (err) {
      setRetailers([]);
      setError(
        err instanceof Error ? err.message : "Failed to load retailers"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRetailers();
  }, [loadRetailers]);

  return { retailers, loading, error, reload: loadRetailers };
}
