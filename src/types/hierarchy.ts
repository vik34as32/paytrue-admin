export type HierarchyUserType =
  | "MASTER_DISTRIBUTOR"
  | "DISTRIBUTOR"
  | "RETAILER"
  | string;

export interface HierarchyNetworkUser {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  userCode?: string;
  email?: string;
  mobile?: string;
  userType: HierarchyUserType;
  status?: string;
  walletBalance?: number;
  city?: string;
  state?: string;
  parentId?: string | null;
  children: HierarchyNetworkUser[];
}

export interface HierarchyNetworkSummary {
  distributors: number;
  retailers: number;
  totalNodes: number;
}

export interface HierarchyNetworkResult {
  masterDistributor: HierarchyNetworkUser | null;
  tree: HierarchyNetworkUser[];
  summary: HierarchyNetworkSummary;
  rawCount: number;
}
