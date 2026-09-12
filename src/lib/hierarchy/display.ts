import { HierarchyNetworkUser } from "@/types/hierarchy";
import { HierarchyListUser } from "@/types/hierarchyManagement";

export function roleShortLabel(userType?: string): string {
  const value = (userType || "").toUpperCase();
  if (value.includes("MASTER")) return "MD";
  if (value.includes("DISTRIBUTOR")) return "DD";
  if (value.includes("RETAIL")) return "RT";
  return "U";
}

export function roleFullLabel(userType?: string): string {
  const value = (userType || "").toUpperCase();
  if (value.includes("MASTER")) return "MASTER DISTRIBUTOR";
  if (value.includes("DISTRIBUTOR") && !value.includes("MASTER")) {
    return "DISTRIBUTOR";
  }
  if (value.includes("RETAIL")) return "RETAILER";
  return value.replace(/_/g, " ") || "USER";
}

export function statusBadgeVariant(
  status?: string
): "success" | "pending" | "rejected" | "default" | "inactive" | "suspended" {
  const value = (status || "").toLowerCase();
  if (value.includes("active") && !value.includes("inactive")) return "success";
  if (value.includes("pending")) return "pending";
  if (value.includes("suspend")) return "suspended";
  if (value.includes("inactive") || value.includes("block")) return "inactive";
  return "default";
}

export function isDistributorRole(userType?: string): boolean {
  const value = (userType || "").toUpperCase().replace(/-/g, "_").trim();
  return value === "DISTRIBUTOR" || value === "DD";
}

export function isMasterDistributorRole(userType?: string): boolean {
  const value = (userType || "").toUpperCase().replace(/-/g, "_").trim();
  return (
    value === "MASTER_DISTRIBUTOR" ||
    value === "MD" ||
    value.includes("MASTER")
  );
}

export function isRetailerRole(userType?: string): boolean {
  const value = (userType || "").toUpperCase().replace(/-/g, "_").trim();
  return value === "RETAILER" || value === "RT" || value.includes("RETAIL");
}

/** Reject clear non-distributor userCode prefixes (MD / RET / RT / ADM). */
export function looksLikeDistributorCode(userCode?: string): boolean {
  const code = (userCode || "").toUpperCase().trim();
  if (!code) return true;
  if (code.startsWith("MD")) return false;
  if (code.startsWith("RET") || code.startsWith("RT")) return false;
  if (code.startsWith("ADM")) return false;
  return true;
}

export function looksLikeRetailerCode(userCode?: string): boolean {
  const code = (userCode || "").toUpperCase().trim();
  if (!code) return true;
  if (code.startsWith("MD")) return false;
  if (code.startsWith("DIS") || code.startsWith("DD")) return false;
  if (code.startsWith("ADM")) return false;
  return true;
}

export function isActiveStatus(status?: string): boolean {
  const value = (status || "").toLowerCase();
  if (!value) return true;
  if (
    value.includes("inactive") ||
    value.includes("block") ||
    value.includes("suspend")
  ) {
    return false;
  }
  return value.includes("active") || value === "enabled" || value === "verified";
}

export function formatUserOptionLabel(user: {
  name: string;
  userCode?: string;
  status?: string;
}): string {
  const code = user.userCode ? ` · ${user.userCode}` : "";
  const status = user.status ? ` (${user.status})` : "";
  return `${user.name}${code}${status}`;
}

export function collectTreeIds(nodes: HierarchyNetworkUser[]): string[] {
  const ids: string[] = [];
  const walk = (list: HierarchyNetworkUser[]) => {
    for (const node of list) {
      ids.push(node.id);
      if (node.children.length) walk(node.children);
    }
  };
  walk(nodes);
  return ids;
}

export function collectExpandableIds(nodes: HierarchyNetworkUser[]): string[] {
  const ids: string[] = [];
  const walk = (list: HierarchyNetworkUser[]) => {
    for (const node of list) {
      if (node.children.length) {
        ids.push(node.id);
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return ids;
}

export function findNodeById(
  nodes: HierarchyNetworkUser[],
  id: string
): HierarchyNetworkUser | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findNodeById(node.children, id);
    if (child) return child;
  }
  return null;
}

export function findParentChain(
  nodes: HierarchyNetworkUser[],
  id: string,
  chain: HierarchyNetworkUser[] = []
): HierarchyNetworkUser[] | null {
  for (const node of nodes) {
    if (node.id === id) return [...chain, node];
    const found = findParentChain(node.children, id, [...chain, node]);
    if (found) return found;
  }
  return null;
}

export function countDescendants(node: HierarchyNetworkUser): number {
  return node.children.reduce(
    (sum, child) => sum + 1 + countDescendants(child),
    0
  );
}

export function toListUserFromNode(
  node: HierarchyNetworkUser,
  parents?: {
    distributor?: HierarchyListUser["distributor"];
    masterDistributor?: HierarchyListUser["masterDistributor"];
  }
): HierarchyListUser {
  return {
    id: node.id,
    name: node.name,
    userCode: node.userCode,
    email: node.email,
    mobile: node.mobile,
    userType: node.userType,
    status: node.status,
    distributor: parents?.distributor ?? null,
    masterDistributor: parents?.masterDistributor ?? null,
    parentId: node.parentId,
    retailerCount: node.children.filter((c) =>
      String(c.userType).toUpperCase().includes("RETAIL")
    ).length,
    distributorCount: node.children.filter((c) => {
      const t = String(c.userType).toUpperCase();
      return t.includes("DISTRIBUTOR") && !t.includes("MASTER");
    }).length,
  };
}
