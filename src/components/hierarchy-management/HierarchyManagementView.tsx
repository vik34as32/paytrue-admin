"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronsUpDown,
  GitBranch,
  Minimize2,
  Network,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Badge } from "@/components/common/Badge";
import { HierarchyCollapsibleTree } from "@/components/hierarchy-management/HierarchyCollapsibleTree";
import {
  DistributorsTab,
  MasterDistributorsTab,
  RetailersTab,
} from "@/components/hierarchy-management/HierarchyListTabs";
import { ReassignRetailerModal } from "@/components/hierarchy-management/ReassignRetailerModal";
import { ReassignDistributorModal } from "@/components/hierarchy-management/ReassignDistributorModal";
import {
  useHierarchyDistributors,
  useHierarchyMasterDistributors,
  useHierarchyRetailers,
  useHierarchyTree,
} from "@/hooks/useHierarchyManagement";
import { HierarchyNetworkUser } from "@/types/hierarchy";
import { HierarchyListUser } from "@/types/hierarchyManagement";
import { cn } from "@/lib/utils";
import {
  collectExpandableIds,
  findParentChain,
  isDistributorRole,
  roleFullLabel,
  statusBadgeVariant,
} from "@/lib/hierarchy/display";
import {
  canReassignDistributor,
  canReassignRetailer,
} from "@/lib/hierarchy/permissions";
import { getHierarchyFriendlyError } from "@/lib/hierarchy/permissions";
import {
  HIERARCHY_DEFAULT_LIMIT,
} from "@/lib/hierarchy/pagination";

type TabKey = "tree" | "masters" | "distributors" | "retailers";

interface HierarchyManagementViewProps {
  breadcrumb: string;
  permissions?: string[] | null;
  userType?: string | null;
  role?: string | null;
  isAdminApiAuth?: boolean;
  isSuperAdminAuthenticated?: boolean;
}

function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function HierarchyManagementView({
  breadcrumb,
  permissions,
  userType,
  role,
  isAdminApiAuth,
  isSuperAdminAuthenticated,
}: HierarchyManagementViewProps) {
  const [tab, setTab] = useState<TabKey>("tree");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [masterDistributorId, setMasterDistributorId] = useState("");
  const [distributorId, setDistributorId] = useState("");
  const [selectedNode, setSelectedNode] = useState<HierarchyNetworkUser | null>(
    null
  );
  const [retailerModalOpen, setRetailerModalOpen] = useState(false);
  const [distributorModalOpen, setDistributorModalOpen] = useState(false);
  const [prefillRetailerId, setPrefillRetailerId] = useState<string | null>(
    null
  );
  const [prefillRetailerDistributorId, setPrefillRetailerDistributorId] =
    useState<string | null>(null);
  const [prefillDistributorId, setPrefillDistributorId] = useState<
    string | null
  >(null);

  const [mdPage, setMdPage] = useState(1);
  const [mdLimit, setMdLimit] = useState<number>(HIERARCHY_DEFAULT_LIMIT);
  const [ddPage, setDdPage] = useState(1);
  const [ddLimit, setDdLimit] = useState<number>(HIERARCHY_DEFAULT_LIMIT);
  const [rtPage, setRtPage] = useState(1);
  const [rtLimit, setRtLimit] = useState<number>(HIERARCHY_DEFAULT_LIMIT);

  const debouncedSearch = useDebouncedValue(search, 400);

  const permInput = {
    permissions,
    userType,
    role,
    isAdminApiAuth,
    isSuperAdminAuthenticated,
  };
  const allowReassignRetailer = canReassignRetailer(permInput);
  const allowReassignDistributor = canReassignDistributor(permInput);

  // GET /hierarchy/tree — only search, status, masterDistributorId
  const treeFilters = {
    search: debouncedSearch || undefined,
    status: status || undefined,
    masterDistributorId: masterDistributorId || undefined,
  };

  const treeQuery = useHierarchyTree(treeFilters, true);
  const mastersFilterQuery = useHierarchyMasterDistributors(
    { page: 1, limit: HIERARCHY_DEFAULT_LIMIT },
    true
  );
  const distributorsFilterQuery = useHierarchyDistributors(
    {
      page: 1,
      limit: HIERARCHY_DEFAULT_LIMIT,
      masterDistributorId: masterDistributorId || undefined,
    },
    true
  );

  const mastersTabQuery = useHierarchyMasterDistributors(
    {
      search: debouncedSearch || undefined,
      status: status || undefined,
      page: mdPage,
      limit: mdLimit,
    },
    tab === "masters"
  );
  const distributorsTabQuery = useHierarchyDistributors(
    {
      search: debouncedSearch || undefined,
      status: status || undefined,
      masterDistributorId: masterDistributorId || undefined,
      page: ddPage,
      limit: ddLimit,
    },
    tab === "distributors"
  );
  // GET /hierarchy/retailers — only search, status, distributorId (not MD)
  const retailersTabQuery = useHierarchyRetailers(
    {
      search: debouncedSearch || undefined,
      status: status || undefined,
      distributorId: distributorId || undefined,
      page: rtPage,
      limit: rtLimit,
    },
    tab === "retailers"
  );

  const tree = treeQuery.data?.tree ?? [];
  const summary = treeQuery.data?.summary;
  const treeExpandKey = useMemo(
    () => collectExpandableIds(tree).join("|"),
    // dataUpdatedAt keeps key stable across identical tree references from refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [treeQuery.dataUpdatedAt, treeQuery.data]
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [syncedExpandKey, setSyncedExpandKey] = useState("");

  if (treeExpandKey !== syncedExpandKey) {
    setSyncedExpandKey(treeExpandKey);
    setExpandedIds(
      new Set(treeExpandKey ? treeExpandKey.split("|").filter(Boolean) : [])
    );
  }
  const masterOptions = useMemo(
    () =>
      (mastersFilterQuery.data?.data ?? []).map((m) => ({
        value: m.id,
        label: `${m.name}${m.userCode ? ` (${m.userCode})` : ""}`,
      })),
    [mastersFilterQuery.data]
  );

  const distributorOptions = useMemo(
    () =>
      (distributorsFilterQuery.data?.data ?? []).map((d) => ({
        value: d.id,
        label: `${d.name}${d.userCode ? ` (${d.userCode})` : ""}`,
      })),
    [distributorsFilterQuery.data]
  );

  const parentChain = selectedNode
    ? findParentChain(tree, selectedNode.id)
    : null;

  const toggleNode = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(collectExpandableIds(tree)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const refreshAll = async () => {
    await Promise.all([
      treeQuery.refetch(),
      mastersFilterQuery.refetch(),
      distributorsFilterQuery.refetch(),
      mastersTabQuery.refetch(),
      distributorsTabQuery.refetch(),
      retailersTabQuery.refetch(),
    ]);
  };

  const openRetailerReassign = (
    retailerId?: string,
    currentDistributorId?: string
  ) => {
    setPrefillRetailerId(retailerId || null);
    setPrefillRetailerDistributorId(currentDistributorId || null);
    setRetailerModalOpen(true);
  };

  const resolveRetailerDistributorId = (retailerId: string) => {
    const chain = findParentChain(tree, retailerId);
    if (!chain || chain.length < 2) return undefined;
    const parent = chain[chain.length - 2];
    return isDistributorRole(parent.userType) ? parent.id : undefined;
  };

  const openDistributorReassign = (id?: string) => {
    setPrefillDistributorId(id || null);
    setDistributorModalOpen(true);
  };

  const focusHierarchyForUser = (user: HierarchyListUser) => {
    setTab("tree");
    setSearch(user.userCode || user.name);
    setSelectedNode({
      id: user.id,
      name: user.name,
      userCode: user.userCode,
      userType: user.userType,
      status: user.status,
      email: user.email,
      mobile: user.mobile,
      children: [],
    });
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "tree", label: "Hierarchy Tree" },
    { key: "masters", label: "Master Distributors" },
    { key: "distributors", label: "Distributors" },
    { key: "retailers", label: "Retailers" },
  ];

  return (
    <div className="page-container space-y-5">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <PageHeader
          breadcrumb={`${breadcrumb} · Hierarchy Management`}
          title="Hierarchy Management"
          subtitle="Manage Master Distributors, Distributors and Retailers"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshAll()}
              disabled={treeQuery.isFetching}
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  treeQuery.isFetching && "animate-spin"
                )}
              />
              Refresh
            </Button>
          }
        />

        <div className="mt-4 max-w-xl">
          <Input
            placeholder="Search users by name, ID, mobile..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setMdPage(1);
              setDdPage(1);
              setRtPage(1);
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              tab === item.key
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "tree" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="space-y-4 border-border p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold">Organization Tree</h3>
                {summary ? (
                  <span className="text-xs text-muted">
                    {summary.masterDistributors} MD · {summary.distributors} DD
                    · {summary.retailers} RT
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={expandAll}>
                  <ChevronsUpDown className="h-4 w-4" />
                  Expand All
                </Button>
                <Button size="sm" variant="outline" onClick={collapseAll}>
                  <Minimize2 className="h-4 w-4" />
                  Collapse All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void treeQuery.refetch()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "", label: "All statuses" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                  { value: "SUSPENDED", label: "Suspended" },
                  { value: "PENDING", label: "Pending" },
                ]}
              />
              <Select
                value={masterDistributorId}
                onChange={(e) => {
                  setMasterDistributorId(e.target.value);
                  setDistributorId("");
                }}
                options={[
                  { value: "", label: "All master distributors" },
                  ...masterOptions,
                ]}
              />
              <Select
                value={distributorId}
                onChange={(e) => setDistributorId(e.target.value)}
                options={[
                  { value: "", label: "All distributors" },
                  ...distributorOptions,
                ]}
              />
            </div>

            {treeQuery.isError ? (
              <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
                {getHierarchyFriendlyError(treeQuery.error)}
              </div>
            ) : null}

            {treeQuery.isLoading ? (
              <div className="space-y-4 py-10">
                <div className="mx-auto h-24 w-48 animate-pulse rounded-2xl bg-muted" />
                <div className="flex justify-center gap-4">
                  <div className="h-24 w-40 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-24 w-40 animate-pulse rounded-2xl bg-muted" />
                </div>
              </div>
            ) : tree.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
                <Network className="mx-auto h-10 w-10 text-muted" />
                <p className="mt-3 text-sm font-semibold">No hierarchy found</p>
                <p className="mt-1 text-sm text-muted">
                  Adjust filters or refresh to load the network tree.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-border bg-slate-50/80 p-4 dark:bg-muted/10">
                <HierarchyCollapsibleTree
                  nodes={tree}
                  expandedIds={expandedIds}
                  selectedId={selectedNode?.id}
                  onToggle={toggleNode}
                  onSelect={setSelectedNode}
                  canReassignRetailer={allowReassignRetailer}
                  canReassignDistributor={allowReassignDistributor}
                  onReassignRetailer={(node) =>
                    openRetailerReassign(
                      node.id,
                      resolveRetailerDistributorId(node.id)
                    )
                  }
                  onReassignDistributor={(node) =>
                    openDistributorReassign(node.id)
                  }
                />
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card className="space-y-3 border-border p-4">
              <h4 className="text-sm font-bold">Quick Actions</h4>
              {allowReassignRetailer ? (
                <Button
                  className="w-full justify-start"
                  onClick={() => openRetailerReassign()}
                >
                  <Plus className="h-4 w-4" />
                  Reassign Retailer
                </Button>
              ) : null}
              {allowReassignDistributor ? (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => openDistributorReassign()}
                >
                  <Plus className="h-4 w-4" />
                  Reassign Distributor
                </Button>
              ) : null}
              {!allowReassignRetailer && !allowReassignDistributor ? (
                <p className="text-sm text-muted">
                  You do not have permission to modify hierarchy.
                </p>
              ) : null}
            </Card>

            <Card className="space-y-3 border-border p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">Selected Node</h4>
                {selectedNode ? (
                  <button
                    type="button"
                    aria-label="Clear selection"
                    onClick={() => setSelectedNode(null)}
                    className="rounded-lg p-1 text-muted hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {!selectedNode ? (
                <p className="text-sm text-muted">
                  Click any node in the tree to inspect details.
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-lg font-bold">{selectedNode.name}</p>
                    <p className="text-xs text-muted">
                      {selectedNode.userCode || selectedNode.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">
                      {roleFullLabel(selectedNode.userType)}
                    </Badge>
                    {selectedNode.status ? (
                      <Badge variant={statusBadgeVariant(selectedNode.status)}>
                        {selectedNode.status}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted">Email: </span>
                      {selectedNode.email || "—"}
                    </p>
                    <p>
                      <span className="text-muted">Mobile: </span>
                      {selectedNode.mobile || "—"}
                    </p>
                    {parentChain && parentChain.length > 1 ? (
                      <p>
                        <span className="text-muted">Path: </span>
                        {parentChain.map((n) => n.name).join(" → ")}
                      </p>
                    ) : null}
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted" />
                      Direct children: {selectedNode.children.length}
                    </p>
                  </div>

                  {String(selectedNode.userType).toUpperCase().includes(
                    "RETAIL"
                  ) && allowReassignRetailer ? (
                    <Button
                      className="w-full"
                      onClick={() =>
                        openRetailerReassign(
                          selectedNode.id,
                          resolveRetailerDistributorId(selectedNode.id)
                        )
                      }
                    >
                      Reassign Retailer
                    </Button>
                  ) : null}
                  {String(selectedNode.userType)
                    .toUpperCase()
                    .includes("DISTRIBUTOR") &&
                  !String(selectedNode.userType)
                    .toUpperCase()
                    .includes("MASTER") &&
                  allowReassignDistributor ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => openDistributorReassign(selectedNode.id)}
                    >
                      Reassign Distributor
                    </Button>
                  ) : null}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "masters" ? (
        <Card className="border-border p-4 sm:p-5">
          <MasterDistributorsTab
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setMdPage(1);
            }}
            status={status}
            onStatusChange={(v) => {
              setStatus(v);
              setMdPage(1);
            }}
            page={mdPage}
            pageSize={mdLimit}
            onPageChange={setMdPage}
            onPageSizeChange={(size) => {
              setMdLimit(size);
              setMdPage(1);
            }}
            isLoading={mastersTabQuery.isLoading || mastersTabQuery.isFetching}
            total={mastersTabQuery.data?.total ?? 0}
            totalPages={mastersTabQuery.data?.totalPages ?? 1}
            rows={mastersTabQuery.data?.data ?? []}
            onViewHierarchy={focusHierarchyForUser}
          />
        </Card>
      ) : null}

      {tab === "distributors" ? (
        <Card className="border-border p-4 sm:p-5">
          <DistributorsTab
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setDdPage(1);
            }}
            status={status}
            onStatusChange={(v) => {
              setStatus(v);
              setDdPage(1);
            }}
            masterDistributorId={masterDistributorId}
            onMasterDistributorChange={(v) => {
              setMasterDistributorId(v);
              setDdPage(1);
            }}
            masterOptions={masterOptions}
            page={ddPage}
            pageSize={ddLimit}
            onPageChange={setDdPage}
            onPageSizeChange={(size) => {
              setDdLimit(size);
              setDdPage(1);
            }}
            isLoading={
              distributorsTabQuery.isLoading || distributorsTabQuery.isFetching
            }
            total={distributorsTabQuery.data?.total ?? 0}
            totalPages={distributorsTabQuery.data?.totalPages ?? 1}
            rows={distributorsTabQuery.data?.data ?? []}
            onViewHierarchy={focusHierarchyForUser}
            onReassign={(user) => openDistributorReassign(user.id)}
            canReassign={allowReassignDistributor}
          />
        </Card>
      ) : null}

      {tab === "retailers" ? (
        <Card className="border-border p-4 sm:p-5">
          <RetailersTab
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setRtPage(1);
            }}
            status={status}
            onStatusChange={(v) => {
              setStatus(v);
              setRtPage(1);
            }}
            masterDistributorId={masterDistributorId}
            onMasterDistributorChange={(v) => {
              setMasterDistributorId(v);
              setRtPage(1);
            }}
            distributorId={distributorId}
            onDistributorChange={(v) => {
              setDistributorId(v);
              setRtPage(1);
            }}
            masterOptions={masterOptions}
            distributorOptions={distributorOptions}
            page={rtPage}
            pageSize={rtLimit}
            onPageChange={setRtPage}
            onPageSizeChange={(size) => {
              setRtLimit(size);
              setRtPage(1);
            }}
            isLoading={
              retailersTabQuery.isLoading || retailersTabQuery.isFetching
            }
            total={retailersTabQuery.data?.total ?? 0}
            totalPages={retailersTabQuery.data?.totalPages ?? 1}
            rows={retailersTabQuery.data?.data ?? []}
            onViewHierarchy={focusHierarchyForUser}
            onReassign={(user) =>
              openRetailerReassign(user.id, user.distributor?.id || undefined)
            }
            canReassign={allowReassignRetailer}
          />
        </Card>
      ) : null}

      {retailerModalOpen ? (
        <ReassignRetailerModal
          key={`rt-${prefillRetailerId || "new"}-${prefillRetailerDistributorId || ""}`}
          isOpen={retailerModalOpen}
          onClose={() => setRetailerModalOpen(false)}
          initialRetailerId={prefillRetailerId}
          initialDistributorId={prefillRetailerDistributorId}
        />
      ) : null}
      {distributorModalOpen ? (
        <ReassignDistributorModal
          key={`dd-${prefillDistributorId || "new"}`}
          isOpen={distributorModalOpen}
          onClose={() => setDistributorModalOpen(false)}
          initialDistributorId={prefillDistributorId}
        />
      ) : null}
    </div>
  );
}
