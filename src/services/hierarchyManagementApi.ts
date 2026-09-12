import { commissionClient } from "@/lib/api/commissionClient";
import { HIERARCHY_API, HierarchyStatus } from "@/constants/hierarchyApi";
import { ApiResponse } from "@/types";
import {
  HierarchyNetworkSummary,
  HierarchyNetworkUser,
  HierarchyUserType,
} from "@/types/hierarchy";
import {
  HierarchyListParams,
  HierarchyListResult,
  HierarchyListUser,
  HierarchyMutationResult,
  HierarchyParentRef,
  HierarchyTreeParams,
  HierarchyTreeResult,
  ReassignDistributorPayload,
  ReassignRetailerPayload,
} from "@/types/hierarchyManagement";
import { HIERARCHY_DEFAULT_LIMIT } from "@/lib/hierarchy/pagination";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
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

function normalizeUserType(
  value: unknown,
  fallback: HierarchyUserType = "RETAILER"
): HierarchyUserType {
  const raw = String(value ?? fallback).toUpperCase().replace(/-/g, "_");
  if (raw.includes("MASTER")) return "MASTER_DISTRIBUTOR";
  if (raw.includes("DISTRIBUTOR") && !raw.includes("MASTER")) {
    return "DISTRIBUTOR";
  }
  if (raw.includes("RETAIL")) return "RETAILER";
  return (raw || fallback) as HierarchyUserType;
}

function normalizeParent(raw: unknown): HierarchyParentRef | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = asRecord(raw);
  const id = String(obj.id ?? obj._id ?? obj.userId ?? "");
  if (!id) return null;
  return {
    id,
    name: resolveName(obj),
    userCode: (obj.userCode as string | undefined) ?? undefined,
    userType: normalizeUserType(obj.userType ?? obj.role, "DISTRIBUTOR"),
    status: (obj.status as string | undefined) ?? undefined,
  };
}

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const obj = asRecord(payload);
  for (const key of [
    "items",
    "users",
    "data",
    "results",
    "rows",
    "masterDistributors",
    "distributors",
    "retailers",
    "tree",
    "nodes",
  ]) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }
  const values = Object.keys(obj)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => obj[k]);
  return values.length ? values : [];
}

function isDistributorType(userType?: string): boolean {
  const value = String(userType || "")
    .toUpperCase()
    .replace(/-/g, "_")
    .trim();
  return value === "DISTRIBUTOR" || value === "DD";
}

function isMasterDistributorType(userType?: string): boolean {
  const value = String(userType || "")
    .toUpperCase()
    .replace(/-/g, "_")
    .trim();
  return value === "MASTER_DISTRIBUTOR" || value.includes("MASTER");
}

function normalizeListUser(
  raw: unknown,
  fallbackType: HierarchyUserType
): HierarchyListUser | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = asRecord(raw);
  const id = String(obj.id ?? obj._id ?? obj.userId ?? "");
  if (!id) return null;

  const userType = normalizeUserType(obj.userType ?? obj.role, fallbackType);

  const distributorIdField = String(
    obj.distributorId ?? obj.distributor_id ?? ""
  ).trim();
  const masterDistributorIdField = String(
    obj.masterDistributorId ?? obj.master_distributor_id ?? ""
  ).trim();

  let distributor =
    normalizeParent(obj.distributor) ||
    normalizeParent(obj.parentDistributor) ||
    null;

  // Retailer.parent is often the distributor — never treat MD as distributor.
  if (!distributor && userType === "RETAILER") {
    const parent = normalizeParent(obj.parent);
    if (parent && isDistributorType(parent.userType)) {
      distributor = parent;
    }
  }

  if (!distributor && distributorIdField) {
    distributor = {
      id: distributorIdField,
      name:
        (obj.distributorName as string | undefined) ||
        (obj.distributor_name as string | undefined) ||
        "Distributor",
      userType: "DISTRIBUTOR",
    };
  }

  if (distributor && isMasterDistributorType(distributor.userType)) {
    distributor = distributorIdField
      ? {
          id: distributorIdField,
          name: "Distributor",
          userType: "DISTRIBUTOR",
        }
      : null;
  }

  let masterDistributor =
    normalizeParent(obj.masterDistributor) ||
    normalizeParent(obj.master_distributor) ||
    null;

  if (!masterDistributor && userType === "DISTRIBUTOR") {
    const parent = normalizeParent(obj.parent);
    if (parent) {
      masterDistributor = {
        ...parent,
        userType: parent.userType || "MASTER_DISTRIBUTOR",
      };
    }
  }

  if (!masterDistributor && masterDistributorIdField) {
    masterDistributor = {
      id: masterDistributorIdField,
      name:
        (obj.masterDistributorName as string | undefined) ||
        (obj.master_distributor_name as string | undefined) ||
        "Master Distributor",
      userType: "MASTER_DISTRIBUTOR",
    };
  }

  if (
    !masterDistributor &&
    userType === "RETAILER" &&
    asRecord(obj.distributor).masterDistributor
  ) {
    masterDistributor = normalizeParent(
      asRecord(obj.distributor).masterDistributor
    );
  }

  const resolvedParentId =
    (obj.parentId as string | null | undefined) ||
    (userType === "RETAILER"
      ? distributor?.id || distributorIdField || null
      : null) ||
    (userType === "DISTRIBUTOR"
      ? masterDistributor?.id || masterDistributorIdField || null
      : null) ||
    null;

  return {
    id,
    name: resolveName(obj),
    userCode: (obj.userCode as string | undefined) ?? undefined,
    email: (obj.email as string | undefined) ?? undefined,
    mobile: (obj.mobile as string | undefined) ?? undefined,
    userType,
    status: (obj.status as string | undefined) ?? undefined,
    createdAt:
      (obj.createdAt as string | undefined) ||
      (obj.created_at as string | undefined) ||
      undefined,
    distributorCount:
      Number(obj.distributorCount ?? obj.distributorsCount ?? 0) || undefined,
    retailerCount:
      Number(obj.retailerCount ?? obj.retailersCount ?? 0) || undefined,
    distributor,
    masterDistributor,
    parentId: resolvedParentId,
  };
}

function normalizePaginated(
  body: ApiResponse<unknown> & Record<string, unknown>,
  params: HierarchyListParams,
  fallbackType: HierarchyUserType
): HierarchyListResult {
  const payload = body.data;
  const items = extractList(payload)
    .map((item) => normalizeListUser(item, fallbackType))
    .filter((item): item is HierarchyListUser => Boolean(item));

  const payloadObj = asRecord(payload);
  const meta = asRecord(
    body.pagination ?? body.meta ?? payloadObj.pagination ?? payloadObj.meta
  );

  const total =
    Number(
      meta.totalRecords ??
        meta.total ??
        body.totalRecords ??
        body.total ??
        payloadObj.total ??
        items.length
    ) || items.length;
  const page =
    Number(
      meta.currentPage ??
        meta.page ??
        body.page ??
        payloadObj.page ??
        params.page ??
        1
    ) || 1;
  const pageSize =
    Number(
      meta.pageSize ??
        meta.limit ??
        body.pageSize ??
        body.limit ??
        payloadObj.pageSize ??
        payloadObj.limit ??
        params.limit ??
        HIERARCHY_DEFAULT_LIMIT
    ) || HIERARCHY_DEFAULT_LIMIT;
  const totalPages =
    Number(meta.totalPages ?? body.totalPages ?? payloadObj.totalPages) ||
    Math.max(1, Math.ceil(total / pageSize));

  return { data: items, total, page, pageSize, totalPages };
}

function normalizeTreeNode(
  raw: unknown,
  fallbackType: HierarchyUserType = "MASTER_DISTRIBUTOR",
  forcedParentId?: string | null
): HierarchyNetworkUser | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = asRecord(raw);
  const id = String(obj.id ?? obj._id ?? obj.userId ?? "");
  if (!id) return null;

  const userType = normalizeUserType(obj.userType ?? obj.role, fallbackType);

  const children: HierarchyNetworkUser[] = [];
  if (userType === "MASTER_DISTRIBUTOR" && Array.isArray(obj.distributors)) {
    for (const item of obj.distributors) {
      const child = normalizeTreeNode(item, "DISTRIBUTOR", id);
      if (child) children.push(child);
    }
  } else if (userType === "DISTRIBUTOR" && Array.isArray(obj.retailers)) {
    for (const item of obj.retailers) {
      const child = normalizeTreeNode(item, "RETAILER", id);
      if (child) children.push(child);
    }
  } else {
    const nestedCandidates = [
      obj.children,
      obj.distributors,
      obj.retailers,
      obj.network,
      obj.downline,
      obj.users,
    ];
    for (const candidate of nestedCandidates) {
      if (!Array.isArray(candidate)) continue;
      for (const item of candidate) {
        const childFallback =
          userType === "MASTER_DISTRIBUTOR" ? "DISTRIBUTOR" : "RETAILER";
        const child = normalizeTreeNode(item, childFallback, id);
        if (child) children.push(child);
      }
    }
  }

  return {
    id,
    name: resolveName(obj),
    firstName: obj.firstName as string | undefined,
    lastName: obj.lastName as string | undefined,
    userCode: (obj.userCode as string | undefined) ?? undefined,
    email: (obj.email as string | undefined) ?? undefined,
    mobile: (obj.mobile as string | undefined) ?? undefined,
    userType,
    status: (obj.status as string | undefined) ?? undefined,
    city: (obj.city as string | undefined) ?? undefined,
    state: (obj.state as string | undefined) ?? undefined,
    parentId:
      forcedParentId ?? (obj.parentId as string | null | undefined) ?? null,
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

function buildTreeSummary(
  tree: HierarchyNetworkUser[]
): HierarchyTreeResult["summary"] {
  return {
    masterDistributors: countByType(tree, "MASTER_DISTRIBUTOR"),
    distributors: countByType(tree, "DISTRIBUTOR"),
    retailers: countByType(tree, "RETAILER"),
    totalNodes: countAll(tree),
  };
}

function clampLimit(limit?: number): number {
  const allowed = [10, 20, 30] as const;
  const raw = Number(limit) || HIERARCHY_DEFAULT_LIMIT;
  return (allowed as readonly number[]).includes(raw)
    ? raw
    : HIERARCHY_DEFAULT_LIMIT;
}

function normalizeStatus(
  status?: string
): HierarchyStatus | undefined {
  if (!status) return undefined;
  const value = status.toUpperCase().trim();
  if (
    value === "ACTIVE" ||
    value === "INACTIVE" ||
    value === "SUSPENDED" ||
    value === "PENDING"
  ) {
    return value;
  }
  return undefined;
}

/** Shared pagination + search + status for list endpoints */
function toPaginationQuery(params: HierarchyListParams = {}) {
  return {
    search: params.search?.trim() || undefined,
    status: normalizeStatus(params.status),
    page: params.page || 1,
    limit: clampLimit(params.limit),
  };
}

/** GET /api/v1/hierarchy/tree */
export async function getHierarchyTree(
  params: HierarchyTreeParams = {}
): Promise<HierarchyTreeResult> {
  const { data } = await commissionClient.get<ApiResponse<unknown>>(
    HIERARCHY_API.tree,
    {
      params: {
        search: params.search?.trim() || undefined,
        status: normalizeStatus(params.status),
        masterDistributorId: params.masterDistributorId || undefined,
      },
    }
  );

  const payload = data.data;
  let roots: unknown[] = [];

  if (Array.isArray(payload)) {
    roots = payload;
  } else {
    const obj = asRecord(payload);
    if (Array.isArray(obj.masterDistributors)) {
      roots = obj.masterDistributors as unknown[];
    } else if (
      obj.masterDistributor &&
      typeof obj.masterDistributor === "object"
    ) {
      roots = [obj.masterDistributor];
    } else {
      roots = extractList(
        obj.tree ?? obj.nodes ?? obj.roots ?? obj.masterDistributors ?? payload
      );
    }
    if (!roots.length && obj.id) {
      roots = [payload];
    }
  }

  const tree = roots
    .map((item) => normalizeTreeNode(item, "MASTER_DISTRIBUTOR"))
    .filter((node): node is HierarchyNetworkUser => Boolean(node));

  return {
    tree,
    summary: buildTreeSummary(tree),
  };
}

/** GET /api/v1/hierarchy/master-distributors */
export async function getHierarchyMasterDistributors(
  params: HierarchyListParams = {}
): Promise<HierarchyListResult> {
  const { data } = await commissionClient.get<
    ApiResponse<unknown> & Record<string, unknown>
  >(HIERARCHY_API.masterDistributors, {
    params: toPaginationQuery(params),
  });
  return normalizePaginated(data, params, "MASTER_DISTRIBUTOR");
}

/** GET /api/v1/hierarchy/distributors */
export async function getHierarchyDistributors(
  params: HierarchyListParams = {}
): Promise<HierarchyListResult> {
  const { data } = await commissionClient.get<
    ApiResponse<unknown> & Record<string, unknown>
  >(HIERARCHY_API.distributors, {
    params: {
      ...toPaginationQuery(params),
      masterDistributorId: params.masterDistributorId || undefined,
    },
  });
  const result = normalizePaginated(data, params, "DISTRIBUTOR");
  return {
    ...result,
    data: result.data.filter((item) => {
      const type = String(item.userType || "")
        .toUpperCase()
        .replace(/-/g, "_")
        .trim();
      const code = String(item.userCode || "")
        .toUpperCase()
        .trim();
      if (type === "MASTER_DISTRIBUTOR" || type.includes("MASTER")) return false;
      if (type === "RETAILER" || type.includes("RETAIL")) return false;
      if (type && type !== "DISTRIBUTOR" && type !== "DD") return false;
      if (
        code.startsWith("MD") ||
        code.startsWith("RET") ||
        code.startsWith("RT") ||
        code.startsWith("ADM")
      ) {
        return false;
      }
      return true;
    }),
  };
}

/** GET /api/v1/hierarchy/retailers */
export async function getHierarchyRetailers(
  params: HierarchyListParams = {}
): Promise<HierarchyListResult> {
  const { data } = await commissionClient.get<
    ApiResponse<unknown> & Record<string, unknown>
  >(HIERARCHY_API.retailers, {
    params: {
      ...toPaginationQuery(params),
      distributorId: params.distributorId || undefined,
    },
  });
  const result = normalizePaginated(data, params, "RETAILER");
  return {
    ...result,
    data: result.data.filter((item) =>
      String(item.userType || "")
        .toUpperCase()
        .includes("RETAIL")
    ),
  };
}

/** PATCH /api/v1/hierarchy/retailer/:retailerId/distributor */
export async function reassignRetailer(
  retailerId: string,
  payload: ReassignRetailerPayload
): Promise<HierarchyMutationResult> {
  const body: Record<string, string> = {
    distributorId: payload.distributorId,
  };
  if (payload.currentDistributorId?.trim()) {
    body.currentDistributorId = payload.currentDistributorId.trim();
  }
  if (payload.reason?.trim()) {
    body.reason = payload.reason.trim();
  }

  const { data } = await commissionClient.patch<ApiResponse<unknown>>(
    HIERARCHY_API.reassignRetailer(retailerId),
    body
  );
  return {
    message: data.message,
    data: data.data,
  };
}

/** PATCH /api/v1/hierarchy/distributor/:distributorId/master-distributor */
export async function reassignDistributor(
  distributorId: string,
  payload: ReassignDistributorPayload
): Promise<HierarchyMutationResult> {
  const body: Record<string, string> = {
    masterDistributorId: payload.masterDistributorId,
  };
  if (payload.currentMasterDistributorId?.trim()) {
    body.currentMasterDistributorId = payload.currentMasterDistributorId.trim();
  }
  if (payload.reason?.trim()) {
    body.reason = payload.reason.trim();
  }

  const { data } = await commissionClient.patch<ApiResponse<unknown>>(
    HIERARCHY_API.reassignDistributor(distributorId),
    body
  );
  return {
    message: data.message,
    data: data.data,
  };
}

export type { HierarchyNetworkSummary };
