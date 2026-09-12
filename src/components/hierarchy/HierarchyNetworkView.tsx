"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  Mail,
  Network,
  Phone,
  RefreshCw,
  Search,
  UserRound,
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

function countDescendants(node: HierarchyNetworkUser): number {
  return node.children.reduce(
    (sum, child) => sum + 1 + countDescendants(child),
    0
  );
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

  const downlineCount = selectedNode ? countDescendants(selectedNode) : 0;

  return (
    <div className="page-container space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] dark:border-border dark:bg-card sm:p-6">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-violet-600 opacity-[0.07]" />
        <PageHeader
          breadcrumb={`${breadcrumb} · Hierarchy`}
          title="Network Hierarchy"
          subtitle={`${APP_NAME} — DSA-style tree · Master Distributor → Distributor → Retailer`}
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
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="space-y-4 border-slate-200/90 p-5 shadow-sm dark:border-border">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg dark:bg-primary">
              <Network className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground">
                Master Distributor
              </h2>
              <p className="mt-1 text-sm text-muted">
                Select an MD to render the full live network tree for this{" "}
                {scope === "admin" ? "admin" : "super admin"} workspace.
              </p>
            </div>
          </div>

          <Select
            label="Choose Master Distributor"
            value={selectedMdId}
            onChange={(event) => setSelectedMdId(event.target.value)}
            options={mdOptions}
            disabled={mdLoading}
          />

          {selectedMd ? (
            <div className="rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3 dark:border-violet-500/20 dark:bg-violet-500/10">
              <p className="text-sm font-semibold text-slate-900 dark:text-foreground">
                {selectedMd.fullName || selectedMd.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {selectedMd.userCode ? `${selectedMd.userCode} · ` : ""}
                {selectedMd.mobile || selectedMd.email || selectedMd.id}
              </p>
            </div>
          ) : null}
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="border-slate-200/90 p-4 shadow-sm dark:border-border">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-sky-600">
              Distributors
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-foreground">
              {network?.summary.distributors ?? 0}
            </p>
          </Card>
          <Card className="border-slate-200/90 p-4 shadow-sm dark:border-border">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-600">
              Retailers
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-foreground">
              {network?.summary.retailers ?? 0}
            </p>
          </Card>
          <Card className="border-slate-200/90 p-4 shadow-sm dark:border-border">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-violet-600">
              Nodes
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-foreground">
              {network?.summary.totalNodes ?? 0}
            </p>
          </Card>
        </div>
      </div>

      <Card className="space-y-4 border-slate-200/90 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-border sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <GitBranch className="h-4 w-4 text-violet-600" />
            <h3 className="text-base font-semibold text-foreground">
              Organization Tree
            </h3>
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
              DSA layout
            </span>
            <div className="ml-1 flex items-center gap-1.5">
              <span className="rounded-full bg-[#4318FF]/12 px-2 py-0.5 text-[10px] font-bold text-[#4318FF]">
                MD
              </span>
              <span className="rounded-full bg-sky-500/12 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                DD
              </span>
              <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                RT
              </span>
            </div>
          </div>
          <div className="w-full lg:w-[300px]">
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
          <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {error}
          </div>
        ) : null}

        {!selectedMdId ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-20 text-center dark:border-border dark:bg-muted/20">
            <Network className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-foreground">
              No Master Distributor selected
            </p>
            <p className="mt-1 text-sm text-muted">
              Pick an MD above to render the complete hierarchy tree on screen.
            </p>
          </div>
        ) : networkLoading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-100 bg-slate-50/50 dark:border-border dark:bg-muted/10">
            <div className="h-14 w-14 animate-pulse rounded-full bg-violet-200/70 dark:bg-violet-500/20" />
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 px-6 py-16 text-center dark:border-border">
            <p className="text-sm font-semibold text-foreground">
              No network users found
            </p>
            <p className="mt-1 text-sm text-muted">
              This master distributor has no downline matching your search.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200/90 bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#eef2ff_45%,_#f8fafc_100%)] dark:border-border dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#1e1b4b_50%,_#0f172a_100%)]">
              <div className="w-full px-2 py-5 sm:px-4 sm:py-6">
                <HierarchyOrgChart
                  nodes={filteredTree}
                  selectedId={selectedNode?.id}
                  onSelect={setSelectedNode}
                  fitToView
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-border dark:bg-card sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-violet-600" />
                  <h4 className="text-sm font-bold text-foreground">
                    Selected Node Details
                  </h4>
                </div>
                <p className="text-xs text-muted">
                  Click any node in the tree to inspect it here
                </p>
              </div>

              {selectedNode ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-border dark:bg-muted/20">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-bold text-slate-900 dark:text-foreground">
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
                          {selectedNode.userCode ? (
                            <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600 shadow-sm dark:bg-card dark:text-muted">
                              {selectedNode.userCode}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {selectedNode.walletBalance != null ? (
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          <Wallet className="h-4 w-4" />
                          {formatCurrency(selectedNode.walletBalance)}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-border dark:bg-card">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                          <Phone className="h-3.5 w-3.5" />
                          Mobile
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {selectedNode.mobile || "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-border dark:bg-card">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </p>
                        <p className="mt-1 break-all text-sm font-medium text-foreground">
                          {selectedNode.email || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">
                        Direct children
                      </p>
                      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-foreground">
                        {selectedNode.children.length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-500/20 dark:bg-sky-500/10">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-sky-600">
                        Total downline
                      </p>
                      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-foreground">
                        {downlineCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2 dark:border-border dark:bg-muted/20">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                        <Users className="h-3.5 w-3.5" />
                        User ID
                      </p>
                      <p className="mt-2 break-all font-mono text-xs font-semibold text-slate-700 dark:text-foreground">
                        {selectedNode.id}
                      </p>
                      {(selectedNode.city || selectedNode.state) && (
                        <p className="mt-2 text-sm text-muted">
                          {[selectedNode.city, selectedNode.state]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-muted dark:border-border">
                  Click any circle in the tree to view full node details here.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
