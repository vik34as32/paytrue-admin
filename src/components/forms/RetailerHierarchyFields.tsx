"use client";

import { useEffect, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { GitBranch, Network, Users } from "lucide-react";
import { Select } from "@/components/common/Select";
import { listAllAdminUsers } from "@/services/adminUsersApi";
import { listAllMasterDistributors } from "@/services/superAdminApi";
import { getMasterDistributorNetwork } from "@/services/hierarchyApi";
import { NetworkUserRecord } from "@/types/superAdmin";
import { HierarchyNetworkUser } from "@/types/hierarchy";
import { UserFormValues } from "@/validations/userStepSchemas";
import { getNetworkUserName } from "@/lib/normalizeUser";

export type RetailerHierarchyScope = "admin" | "super_admin";
/** retailer = MD + Distributor; distributor = MD only */
export type HierarchyLinkingMode = "retailer" | "distributor";

interface RetailerHierarchyFieldsProps {
  methods: UseFormReturn<UserFormValues>;
  scope: RetailerHierarchyScope;
  mode?: HierarchyLinkingMode;
}

function userOptionLabel(user: NetworkUserRecord): string {
  const name = getNetworkUserName(user) || user.name || "User";
  const code = user.userCode ? ` · ${user.userCode}` : "";
  const mobile = user.mobile || user.phone;
  const phone = mobile ? ` · ${mobile}` : "";
  return `${name}${code}${phone}`;
}

function hierarchyOptionLabel(user: HierarchyNetworkUser): string {
  const code = user.userCode ? ` · ${user.userCode}` : "";
  const phone = user.mobile ? ` · ${user.mobile}` : "";
  return `${user.name || "Distributor"}${code}${phone}`;
}

/** Collect every DISTRIBUTOR under the MD network tree (all levels). */
function collectDistributors(
  nodes: HierarchyNetworkUser[]
): HierarchyNetworkUser[] {
  const result: HierarchyNetworkUser[] = [];
  const seen = new Set<string>();

  const walk = (list: HierarchyNetworkUser[]) => {
    for (const node of list) {
      const type = String(node.userType || "").toUpperCase();
      if (type === "DISTRIBUTOR" && !seen.has(node.id)) {
        seen.add(node.id);
        result.push(node);
      }
      if (node.children?.length) walk(node.children);
    }
  };

  walk(nodes);
  return result;
}

export function RetailerHierarchyFields({
  methods,
  scope,
  mode = "retailer",
}: RetailerHierarchyFieldsProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const isRetailerMode = mode === "retailer";
  const masterDistributorId = watch("masterDistributorId") || "";
  const parentId = watch("parentId") || "";

  const [masterDistributors, setMasterDistributors] = useState<
    NetworkUserRecord[]
  >([]);
  const [distributors, setDistributors] = useState<HierarchyNetworkUser[]>([]);
  const [loadingMd, setLoadingMd] = useState(true);
  const [loadingDd, setLoadingDd] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Distributor create never uses parentId
  useEffect(() => {
    if (!isRetailerMode) {
      setValue("parentId", "", { shouldDirty: false });
    }
  }, [isRetailerMode, setValue]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMd(true);
      setLoadError(null);
      try {
        const list =
          scope === "super_admin"
            ? await listAllMasterDistributors()
            : await listAllAdminUsers({ role: "MASTER_DISTRIBUTOR" });
        if (!cancelled) setMasterDistributors(list);
      } catch (error) {
        if (!cancelled) {
          setMasterDistributors([]);
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load master distributors"
          );
        }
      } finally {
        if (!cancelled) setLoadingMd(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  // Load distributors under selected MD (retailer create only)
  useEffect(() => {
    let cancelled = false;

    if (!isRetailerMode || !masterDistributorId) {
      setDistributors([]);
      setLoadingDd(false);
      return;
    }

    (async () => {
      setLoadingDd(true);
      setLoadError(null);
      try {
        const network = await getMasterDistributorNetwork(masterDistributorId);
        const roots: HierarchyNetworkUser[] = [];
        if (network.masterDistributor) roots.push(network.masterDistributor);
        if (network.tree?.length) roots.push(...network.tree);

        const list = collectDistributors(roots);
        if (!cancelled) setDistributors(list);
      } catch (error) {
        if (!cancelled) {
          setDistributors([]);
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load distributors for this master distributor"
          );
        }
      } finally {
        if (!cancelled) setLoadingDd(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isRetailerMode, masterDistributorId]);

  useEffect(() => {
    if (!isRetailerMode || !parentId) return;
    const stillValid = distributors.some((d) => d.id === parentId);
    if (!stillValid && !loadingDd) {
      setValue("parentId", "", { shouldDirty: true });
    }
  }, [isRetailerMode, distributors, parentId, loadingDd, setValue]);

  const mdOptions = useMemo(
    () => [
      {
        value: "",
        label: loadingMd
          ? "Loading master distributors..."
          : "Select master distributor",
      },
      ...masterDistributors.map((u) => ({
        value: u.id,
        label: userOptionLabel(u),
      })),
    ],
    [masterDistributors, loadingMd]
  );

  const ddOptions = useMemo(
    () => [
      {
        value: "",
        label: !masterDistributorId
          ? "Select master distributor first"
          : loadingDd
            ? "Loading distributors from hierarchy..."
            : distributors.length
              ? "Select distributor"
              : "No distributors linked under this MD",
      },
      ...distributors.map((u) => ({
        value: u.id,
        label: hierarchyOptionLabel(u),
      })),
    ],
    [distributors, loadingDd, masterDistributorId]
  );

  return (
    <div className="col-span-full overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-sky-500/10 shadow-sm">
      <div className="flex items-start gap-3 border-b border-emerald-500/15 bg-emerald-500/5 px-4 py-3.5 sm:px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
          <Network className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Hierarchy Linking
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {isRetailerMode
              ? "Pick a Master Distributor, then choose any Distributor linked under them from the hierarchy network."
              : "Select the Master Distributor this distributor will be linked under."}
          </p>
        </div>
        {isRetailerMode && masterDistributorId && !loadingDd ? (
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-emerald-600/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex dark:text-emerald-400">
            <Users className="h-3.5 w-3.5" />
            {distributors.length} distributor
            {distributors.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {loadError ? (
          <p className="rounded-xl border border-accent-red/20 bg-accent-red/5 px-3 py-2 text-xs text-accent-red">
            {loadError}
          </p>
        ) : null}

        <div
          className={
            isRetailerMode
              ? "grid gap-4 lg:grid-cols-2"
              : "grid gap-4 lg:grid-cols-1"
          }
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <GitBranch className="h-3.5 w-3.5 text-emerald-600" />
              {isRetailerMode
                ? "Step 1 · Master Distributor"
                : "Master Distributor"}
            </div>
            <Select
              label="Master Distributor"
              options={mdOptions}
              value={masterDistributorId}
              disabled={loadingMd}
              error={errors.masterDistributorId?.message as string | undefined}
              onChange={(e) => {
                setValue("masterDistributorId", e.target.value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                if (isRetailerMode) {
                  setValue("parentId", "", { shouldDirty: true });
                }
              }}
            />
          </div>

          {isRetailerMode ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Users className="h-3.5 w-3.5 text-sky-600" />
                Step 2 · Distributor (parent)
              </div>
              <Select
                label="Distributor"
                options={ddOptions}
                value={parentId}
                disabled={!masterDistributorId || loadingDd}
                error={errors.parentId?.message as string | undefined}
                onChange={(e) => {
                  setValue("parentId", e.target.value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
