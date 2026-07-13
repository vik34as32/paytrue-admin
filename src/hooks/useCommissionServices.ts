"use client";

import { useEffect, useState } from "react";
import { getActiveServicesForAdmin } from "@/services/serviceMasterApi";
import type { FintechService } from "@/types/commission";

export function useCommissionServices() {
  const [services, setServices] = useState<FintechService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getActiveServicesForAdmin();
        if (cancelled) return;
        setServices(
          data.map((service) => ({
            id: service.id,
            name: service.name,
            code: service.code,
          }))
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load services"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { services, loading, error };
}
