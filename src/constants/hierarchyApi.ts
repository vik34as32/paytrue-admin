/** Hierarchy management — prefix `/api/v1/hierarchy` */
export const HIERARCHY_API = {
  tree: "/hierarchy/tree",
  masterDistributors: "/hierarchy/master-distributors",
  distributors: "/hierarchy/distributors",
  retailers: "/hierarchy/retailers",
  reassignRetailer: (retailerId: string) =>
    `/hierarchy/retailer/${retailerId}/distributor`,
  reassignDistributor: (distributorId: string) =>
    `/hierarchy/distributor/${distributorId}/master-distributor`,
} as const;

/** Matches backend `hierarchyListQuerySchema` / `hierarchyTreeQuerySchema` status enum */
export const HIERARCHY_STATUS = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "PENDING",
] as const;

export type HierarchyStatus = (typeof HIERARCHY_STATUS)[number];
