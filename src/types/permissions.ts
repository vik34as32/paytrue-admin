export type PermissionRoleType =
  | "ADMIN"
  | "MASTER_DISTRIBUTOR"
  | "DISTRIBUTOR"
  | "RETAILER";

export type PermissionDefinitionStatus = "ACTIVE" | "INACTIVE";

export interface ServicePermission {
  id: string;
  name: string;
  key: string;
  serviceType: string;
  description: string;
  status: PermissionDefinitionStatus;
  assignedUsersCount: number;
}

export interface CreatePermissionPayload {
  name: string;
  permissionKey: string;
  serviceType: string;
  description?: string;
  status?: PermissionDefinitionStatus;
}

export type UpdatePermissionPayload = Partial<CreatePermissionPayload>;

export interface UserPermissionSnapshot {
  userId: string;
  permissionIds: string[];
  permissions: ServicePermission[];
}

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
