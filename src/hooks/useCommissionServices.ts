"use client";

import { useEffect, useState } from "react";
import {
  flattenServiceTree,
  getServiceTreeForAdmin,
  listAllServicesForAdmin,
} from "@/services/serviceMasterApi";
import {
  buildCommissionSelectableServices,
  buildCommissionServiceCatalog,
} from "@/lib/commission/serviceOptions";
import type { FintechService } from "@/types/commission";
import type { ServiceMaster } from "@/types/serviceMaster";

async function loadServicesForCommission(): Promise<ServiceMaster[]> {
  try {
    const tree = await getServiceTreeForAdmin();
    if (tree.length) {
      return flattenServiceTree(tree);
    }
  } catch {
    // Fall back to paginated list
  }
  return listAllServicesForAdmin({ status: "ACTIVE" });
}

/**
 * Loads commission services from Service Master.
 * - `services`: dropdown (DMT/AEPS → only Parent · Subservice; never parent alone when children exist)
 * - `catalog`: full label map so Saved rows show "DMT · IMPS" instead of SVC008
 */
export function useCommissionServices() {
  const [services, setServices] = useState<FintechService[]>([]);
  const [catalog, setCatalog] = useState<FintechService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await loadServicesForCommission();
        if (cancelled) return;
        setCatalog(buildCommissionServiceCatalog(data));
        setServices(buildCommissionSelectableServices(data));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load services"
          );
          setServices([]);
          setCatalog([]);
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

  return { services, catalog, loading, error };
}
