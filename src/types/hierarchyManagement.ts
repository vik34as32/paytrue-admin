import { HierarchyNetworkUser, HierarchyUserType } from "@/types/hierarchy";
import { HierarchyStatus } from "@/constants/hierarchyApi";

export interface HierarchyParentRef {
  id: string;
  name: string;
  userCode?: string;
  userType?: HierarchyUserType;
  status?: string;
}

export interface HierarchyListUser {
  id: string;
  name: string;
  userCode?: string;
  email?: string;
  mobile?: string;
  userType: HierarchyUserType;
  status?: string;
  createdAt?: string;
  distributorCount?: number;
  retailerCount?: number;
  distributor?: HierarchyParentRef | null;
  masterDistributor?: HierarchyParentRef | null;
  parentId?: string | null;
}

/** Shared list query — only send fields the target endpoint accepts */
export interface HierarchyListParams {
  search?: string;
  status?: HierarchyStatus | string;
  /** Distributors list + tree only */
  masterDistributorId?: string;
  /** Retailers list only */
  distributorId?: string;
  page?: number;
  limit?: number;
}

export interface HierarchyListResult {
  data: HierarchyListUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HierarchyTreeParams {
  search?: string;
  status?: HierarchyStatus | string;
  masterDistributorId?: string;
}

export interface HierarchyTreeResult {
  tree: HierarchyNetworkUser[];
  summary: {
    masterDistributors: number;
    distributors: number;
    retailers: number;
    totalNodes: number;
  };
}

/** PATCH /hierarchy/retailer/:retailerId/distributor */
export interface ReassignRetailerPayload {
  distributorId: string;
  currentDistributorId?: string;
  reason?: string | null;
}

/** PATCH /hierarchy/distributor/:distributorId/master-distributor */
export interface ReassignDistributorPayload {
  masterDistributorId: string;
  currentMasterDistributorId?: string;
  reason?: string | null;
}

export interface HierarchyMutationResult {
  message?: string;
  data?: unknown;
}
