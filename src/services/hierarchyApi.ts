import { commissionAdminModuleClient } from "@/lib/api/commissionClient";
import { ApiResponse } from "@/types";
import {
  HierarchyNetworkResult,
  HierarchyNetworkSummary,
  HierarchyNetworkUser,
  HierarchyUserType,
} from "@/types/hierarchy";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function parseAmount(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveName(obj: Record<string, unknown>): string {
  const fullName =
    (obj.fullName as string | undefined) ||
    (obj.name as string | undefined) ||
    [obj.firstName, obj.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  return (
    (obj.email as string | undefined) ||
    (obj.mobile as string | undefined) ||
    (obj.userCode as string | undefined) ||
    "—"
  );
}

function normalizeUserType(value: unknown, fallback: HierarchyUserType): HierarchyUserType {
  const raw = String(value ?? fallback).toUpperCase().replace(/-/g, "_");
  if (raw.includes("MASTER")) return "MASTER_DISTRIBUTOR";
  if (raw.includes("DISTRIBUTOR") && !raw.includes("MASTER")) return "DISTRIBUTOR";
  if (raw.includes("RETAIL")) return "RETAILER";
  return (raw || fallback) as HierarchyUserType;
}

function normalizeNode(
  raw: unknown,
  fallbackType: HierarchyUserType = "RETAILER"
): HierarchyNetworkUser | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = asRecord(raw);
  const id = String(obj.id ?? obj._id ?? obj.userId ?? "");
  if (!id) return null;

  const nestedChildren = [
    obj.children,
    obj.distributors,
    obj.retailers,
    obj.network,
    obj.downline,
    obj.users,
  ];

  const children: HierarchyNetworkUser[] = [];
  for (const candidate of nestedChildren) {
    if (!Array.isArray(candidate)) continue;
    for (const item of candidate) {
      const childType = normalizeUserType(
        asRecord(item).userType ?? asRecord(item).role,
        fallbackType === "MASTER_DISTRIBUTOR" ? "DISTRIBUTOR" : "RETAILER"
      );
      const node = normalizeNode(item, childType);
      if (node) children.push(node);
    }
  }

  const wallet =
    obj.wallet && typeof obj.wallet === "object"
      ? asRecord(obj.wallet)
      : undefined;

  return {
    id,
    name: resolveName(obj),
    firstName: obj.firstName as string | undefined,
    lastName: obj.lastName as string | undefined,
    userCode: (obj.userCode as string | undefined) ?? undefined,
    email: (obj.email as string | undefined) ?? undefined,
    mobile: (obj.mobile as string | undefined) ?? undefined,
    userType: normalizeUserType(obj.userType ?? obj.role, fallbackType),
    status: (obj.status as string | undefined) ?? undefined,
    walletBalance:
      parseAmount(obj.walletBalance) ??
      parseAmount(obj.balance) ??
      parseAmount(wallet?.balance),
    city: (obj.city as string | undefined) ?? undefined,
    state: (obj.state as string | undefined) ?? undefined,
    parentId:
      (obj.parentId as string | null | undefined) ??
      (obj.distributorId as string | null | undefined) ??
      (obj.masterDistributorId as string | null | undefined) ??
      null,
    children,
  };
}

function countByType(
  nodes: HierarchyNetworkUser[],
  type: HierarchyUserType
): number {
  let count = 0;
  const walk = (list: HierarchyNetworkUser[]) => {
    for (const node of list) {
      if (node.userType === type) count += 1;
      if (node.children.length) walk(node.children);
    }
  };
  walk(nodes);
  return count;
}

function countAll(nodes: HierarchyNetworkUser[]): number {
  let count = 0;
  const walk = (list: HierarchyNetworkUser[]) => {
    for (const node of list) {
      count += 1;
      if (node.children.length) walk(node.children);
    }
  };
  walk(nodes);
  return count;
}

function buildSummary(tree: HierarchyNetworkUser[]): HierarchyNetworkSummary {
  return {
    distributors: countByType(tree, "DISTRIBUTOR"),
    retailers: countByType(tree, "RETAILER"),
    totalNodes: countAll(tree),
  };
}

/**
 * Attach orphan retailers under matching distributor, else under MD root.
 */
function assembleTree(
  master: HierarchyNetworkUser | null,
  distributors: HierarchyNetworkUser[],
  retailers: HierarchyNetworkUser[]
): HierarchyNetworkUser[] {
  if (master && master.children.length) {
    return [master];
  }

  const distributorNodes = distributors.map((d) => ({
    ...d,
    children: [...d.children],
  }));

  const usedRetailerIds = new Set<string>();

  for (const retailer of retailers) {
    const parentId = retailer.parentId || undefined;
    const match = parentId
      ? distributorNodes.find((d) => d.id === parentId)
      : undefined;
    if (match) {
      match.children.push(retailer);
      usedRetailerIds.add(retailer.id);
    }
  }

  const orphanRetailers = retailers.filter((r) => !usedRetailerIds.has(r.id));

  if (master) {
    return [
      {
        ...master,
        children: [
          ...distributorNodes,
          ...orphanRetailers.map((r) => ({ ...r, children: [] })),
        ],
      },
    ];
  }

  if (distributorNodes.length) {
    return distributorNodes.map((d) => ({
      ...d,
      children: [
        ...d.children,
        ...orphanRetailers.filter((r) => !usedRetailerIds.has(r.id)),
      ],
    }));
  }

  return orphanRetailers;
}

function normalizeNetworkPayload(
  payload: unknown,
  masterDistributorId: string
): HierarchyNetworkResult {
  if (Array.isArray(payload)) {
    const nodes = payload
      .map((item) => normalizeNode(item, "DISTRIBUTOR"))
      .filter((node): node is HierarchyNetworkUser => Boolean(node));
    const tree = nodes;
    return {
      masterDistributor: null,
      tree,
      summary: buildSummary(tree),
      rawCount: countAll(tree),
    };
  }

  const obj = asRecord(payload);
  const masterRaw =
    obj.masterDistributor ??
    obj.master_distributor ??
    obj.user ??
    obj.root ??
    obj.data;

  let master = normalizeNode(
    masterRaw && typeof masterRaw === "object" && !Array.isArray(masterRaw)
      ? masterRaw
      : {
          id: masterDistributorId,
          name: (obj.name as string | undefined) || "Master Distributor",
          userType: "MASTER_DISTRIBUTOR",
        },
    "MASTER_DISTRIBUTOR"
  );

  const distributors = (
    Array.isArray(obj.distributors)
      ? obj.distributors
      : Array.isArray(obj.distributorList)
        ? obj.distributorList
        : []
  )
    .map((item) => normalizeNode(item, "DISTRIBUTOR"))
    .filter((node): node is HierarchyNetworkUser => Boolean(node));

  const retailers = (
    Array.isArray(obj.retailers)
      ? obj.retailers
      : Array.isArray(obj.retailerList)
        ? obj.retailerList
        : []
  )
    .map((item) => normalizeNode(item, "RETAILER"))
    .filter((node): node is HierarchyNetworkUser => Boolean(node));

  // If payload itself is the MD with nested children already normalized
  if (master && master.children.length && !distributors.length && !retailers.length) {
    return {
      masterDistributor: master,
      tree: [master],
      summary: buildSummary([master]),
      rawCount: countAll([master]),
    };
  }

  const networkArray = Array.isArray(obj.network)
    ? obj.network
    : Array.isArray(obj.children)
      ? obj.children
      : Array.isArray(obj.downline)
        ? obj.downline
        : null;

  if (networkArray && !distributors.length && !retailers.length) {
    const children = networkArray
      .map((item) =>
        normalizeNode(
          item,
          normalizeUserType(asRecord(item).userType, "DISTRIBUTOR")
        )
      )
      .filter((node): node is HierarchyNetworkUser => Boolean(node));

    if (master) {
      master = { ...master, children };
      return {
        masterDistributor: master,
        tree: [master],
        summary: buildSummary([master]),
        rawCount: countAll([master]),
      };
    }

    return {
      masterDistributor: null,
      tree: children,
      summary: buildSummary(children),
      rawCount: countAll(children),
    };
  }

  const tree = assembleTree(master, distributors, retailers);
  return {
    masterDistributor: master,
    tree,
    summary: buildSummary(tree),
    rawCount: countAll(tree),
  };
}

/** GET /api/v1/admin/master-distributors/:masterDistributorId/network */
export async function getMasterDistributorNetwork(
  masterDistributorId: string
): Promise<HierarchyNetworkResult> {
  const { data } = await commissionAdminModuleClient.get<ApiResponse<unknown>>(
    `/master-distributors/${masterDistributorId}/network`
  );
  return normalizeNetworkPayload(data.data, masterDistributorId);
}
