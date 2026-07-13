"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Network,
  RefreshCw,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { HierarchyOrgChart } from "@/components/hierarchy/HierarchyOrgChart";
import { APP_NAME } from "@/constants";
import { cn, formatCurrency } from "@/lib/utils";
import {
  getPublicNetworkUserNameIdLabel,
  getPublicNetworkUsers,
  type PublicNetworkUser,
} from "@/services/publicNetworkUsersApi";
import { getMasterDistributorNetwork } from "@/services/hierarchyApi";
import {
  HierarchyNetworkResult,
  HierarchyNetworkUser,
} from "@/types/hierarchy";

type HierarchyScope = "admin" | "super_admin";

interface HierarchyNetworkViewProps {
  scope: HierarchyScope;
  breadcrumb: string;
}

function roleLabel(userType?: string): string {
  const value = (userType || "").toUpperCase();
  if (value.includes("MASTER")) return "Master Distributor";
  if (value.includes("DISTRIBUTOR")) return "Distributor";
  if (value.includes("RETAIL")) return "Retailer";
  return value.replace(/_/g, " ") || "User";
}

function statusVariant(
  status?: string
): "success" | "pending" | "rejected" | "default" {
  const value = (status || "").toLowerCase();
  if (value.includes("active")) return "success";
  if (value.includes("pending")) return "pending";
  if (
    value.includes("inactive") ||
    value.includes("block") ||
    value.includes("suspend")
  ) {
    return "rejected";
  }
  return "default";
}

function matchesSearch(node: HierarchyNetworkUser, query: string): boolean {
  if (!query) return true;
  const haystack = [
    node.name,
    node.userCode,
    node.email,
    node.mobile,
    node.id,
    roleLabel(node.userType),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function filterTree(
  nodes: HierarchyNetworkUser[],
  query: string
): HierarchyNetworkUser[] {
  if (!query) return nodes;
  const result: HierarchyNetworkUser[] = [];
  for (const node of nodes) {
    const children = filterTree(node.children, query);
    if (matchesSearch(node, query) || children.length) {
      result.push({ ...node, children });
    }
  }
  return result;
}

export function HierarchyNetworkView({
  scope,
  breadcrumb,
}: HierarchyNetworkViewProps) {
  const [masterDistributors, setMasterDistributors] = useState<
    PublicNetworkUser[]
  >([]);
  const [mdLoading, setMdLoading] = useState(false);
  const [selectedMdId, setSelectedMdId] = useState("");
  const [network, setNetwork] = useState<HierarchyNetworkResult | null>(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedNode, setSelectedNode] = useState<HierarchyNetworkUser | null>(
    null
  );

  const loadMasterDistributors = useCallback(async () => {
    setMdLoading(true);
    try {
      const list = await getPublicNetworkUsers("MASTER_DISTRIBUTOR");
      setMasterDistributors(list);
    } catch (err) {
      setMasterDistributors([]);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to load master distributors"
      );
    } finally {
      setMdLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMasterDistributors();
  }, [loadMasterDistributors]);

  const loadNetwork = useCallback(async (masterDistributorId: string) => {
    if (!masterDistributorId) {
      setNetwork(null);
      setSelectedNode(null);
      setError(null);
      return;
    }

    setNetworkLoading(true);
    setError(null);
    try {
      const result = await getMasterDistributorNetwork(masterDistributorId);
      setNetwork(result);
      setSelectedNode(result.tree[0] ?? result.masterDistributor);
    } catch (err) {
      setNetwork(null);
      setSelectedNode(null);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load master distributor network"
      );
    } finally {
      setNetworkLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedMdId) {
      setNetwork(null);
      setSelectedNode(null);
      return;
    }
    void loadNetwork(selectedMdId);
  }, [selectedMdId, loadNetwork]);

  const selectedMd = useMemo(
    () => masterDistributors.find((item) => item.id === selectedMdId) || null,
    [masterDistributors, selectedMdId]
  );

  const filteredTree = useMemo(() => {
    if (!network) return [];
    return filterTree(network.tree, search.trim().toLowerCase());
  }, [network, search]);

  const mdOptions = useMemo(
    () => [
      {
        value: "",
        label: mdLoading
          ? "Loading master distributors..."
          : "Select master distributor",
      },
      ...masterDistributors.map((user) => ({
        value: user.id,
        label: getPublicNetworkUserNameIdLabel(user),
      })),
    ],
    [masterDistributors, mdLoading]
  );

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Network Hierarchy"
        subtitle={`${APP_NAME} — classic org-chart tree for Master Distributor → Distributor → Retailer`}
        action={
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedMdId || networkLoading}
            onClick={() => selectedMdId && void loadNetwork(selectedMdId)}
          >
            <RefreshCw
              className={cn("h-4 w-4", networkLoading && "animate-spin")}
            />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="!p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Choose Master Distributor
              </h2>
              <p className="mt-1 text-sm text-muted">
                Select MD to load live network tree for this{" "}
                {scope === "admin" ? "admin" : "super admin"} workspace.
              </p>
            </div>
          </div>

          <Select
            label="Master Distributor"
            value={selectedMdId}
            onChange={(event) => setSelectedMdId(event.target.value)}
            options={mdOptions}
            disabled={mdLoading}
          />

          {selectedMd ? (
            <div className="mt-4 rounded-2xl border border-border bg-background/60 px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {selectedMd.fullName || selectedMd.name}
              </p>
              <p className="mt-1 text-xs text-muted">
                {selectedMd.userCode ? `${selectedMd.userCode} · ` : ""}
                {selectedMd.mobile || selectedMd.email || selectedMd.id}
              </p>
            </div>
          ) : null}
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <Card className="!p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Distributors
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-300">
              {network?.summary.distributors ?? 0}
            </p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Retailers
            </p>
            <p className="mt-2 text-2xl font-bold text-accent-green">
              {network?.summary.retailers ?? 0}
            </p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Network Nodes
            </p>
            <p className="mt-2 text-2xl font-bold text-violet-700 dark:text-violet-300">
              {network?.summary.totalNodes ?? 0}
            </p>
          </Card>
        </div>
      </div>

      <Card className="!p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Organization Chart
            </h3>
            <div className="ml-2 hidden items-center gap-2 sm:flex">
              <Badge variant="default">MD</Badge>
              <Badge variant="default">DD</Badge>
              <Badge variant="success">RT</Badge>
            </div>
          </div>
          <div className="w-full sm:w-[280px]">
            <Input
              placeholder="Search name, code, mobile, id..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={!network}
            />
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {error}
          </div>
        ) : null}

        {!selectedMdId ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <Network className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No Master Distributor selected
            </p>
            <p className="mt-1 text-sm text-muted">
              Pick an MD to view the hierarchy tree like an org chart.
            </p>
          </div>
        ) : networkLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="h-16 w-16 animate-pulse rounded-full bg-border" />
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              No network users found
            </p>
            <p className="mt-1 text-sm text-muted">
              This master distributor has no downline matching your search.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
            <div className="overflow-x-auto rounded-2xl border border-border bg-background/40">
              <HierarchyOrgChart
                nodes={filteredTree}
                selectedId={selectedNode?.id}
                onSelect={setSelectedNode}
              />
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Selected Node
              </p>
              {selectedNode ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {selectedNode.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="default">
                        {roleLabel(selectedNode.userType)}
                      </Badge>
                      {selectedNode.status ? (
                        <Badge variant={statusVariant(selectedNode.status)}>
                          {selectedNode.status}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted">
                    <p>Code: {selectedNode.userCode || "—"}</p>
                    <p>Mobile: {selectedNode.mobile || "—"}</p>
                    <p className="break-all">Email: {selectedNode.email || "—"}</p>
                    <p className="break-all font-mono text-xs">
                      ID: {selectedNode.id}
                    </p>
                  </div>
                  {selectedNode.walletBalance != null ? (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-accent-green/10 px-3 py-2 text-sm font-semibold text-accent-green">
                      <Wallet className="h-4 w-4" />
                      {formatCurrency(selectedNode.walletBalance)}
                    </div>
                  ) : null}
                  <p className="text-xs text-muted">
                    Downline nodes: {selectedNode.children.length}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  Click any circle in the tree to view details.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
