export type PermissionRoleType =
  | "ADMIN"
  | "MASTER_DISTRIBUTOR"
  | "DISTRIBUTOR"
  | "RETAILER";

export type PermissionStatusFilter = "ALL" | "ENABLED" | "DISABLED";

export interface PermissionItemDef {
  slug: string;
  label: string;
  description?: string;
}

export interface PermissionModuleDef {
  key: string;
  label: string;
  description?: string;
  permissions: PermissionItemDef[];
  /** UI grouping */
  section?: "common" | "role";
}

export interface PermissionUserOption {
  id: string;
  name: string;
  role: PermissionRoleType;
  roleLabel: string;
  mobile?: string;
  email?: string;
  status?: string;
  userCode?: string;
  createdAt?: string;
}

export interface UserPermissionState {
  userId: string;
  enabledSlugs: string[];
  updatedAt?: string;
}

export interface PermissionFiltersValue {
  role: PermissionRoleType | "";
  userId: string;
  module: string;
  status: PermissionStatusFilter;
}
