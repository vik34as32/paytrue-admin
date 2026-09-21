import { adminClient, superAdminClient } from "@/lib/api/client";
import { getAdmins } from "@/services/superAdminApi";
import {
  getPublicNetworkUsers,
  type PublicNetworkUserType,
} from "@/services/publicNetworkUsersApi";
import { getAdminDisplayName, getAdminId } from "@/services/admin";
import { PERMISSION_ROLE_OPTIONS } from "@/constants/permissionModules";
import type {
  CreatePermissionPayload,
  PermissionDefinitionStatus,
  PermissionRoleType,
  PermissionUserOption,
  ServicePermission,
  UpdatePermissionPayload,
  UserPermissionSnapshot,
} from "@/types/permissions";
import type { ApiResponse } from "@/types";

function roleLabel(role: PermissionRoleType): string {
  return (
    PERMISSION_ROLE_OPTIONS.find((option) => option.value === role)?.label ||
    role
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function unwrap(payload: unknown): unknown {
  const obj = asRecord(payload);
  if (obj.data !== undefined) return unwrap(obj.data);
  return payload;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const obj = asRecord(value);
  for (const key of [
    "permissions",
    "items",
    "rows",
    "list",
    "records",
    "content",
    "result",
  ]) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }
  return [];
}

function toStatus(value: unknown): PermissionDefinitionStatus {
  const raw = String(value ?? "").toUpperCase();
  if (
    raw === "INACTIVE" ||
    raw === "DISABLED" ||
    raw === "DELETED" ||
    raw === "FALSE"
  ) {
    return "INACTIVE";
  }
  return "ACTIVE";
}

export function normalizePermission(raw: unknown): ServicePermission | null {
  const obj = asRecord(raw);
  const nested = asRecord(obj.permission);
  const source = Object.keys(nested).length ? { ...nested, ...obj } : obj;
  const id = String(
    source.id ?? source.permissionId ?? source._id ?? ""
  ).trim();
  const key = String(
    source.key ??
      source.permissionKey ??
      source.slug ??
      source.permission_slug ??
      ""
  )
    .trim()
    .toUpperCase();
  const name = String(
    source.name ?? source.serviceName ?? source.label ?? key ?? ""
  ).trim();
  if (!id && !key) return null;
  const assignedRaw =
    source.assignedUsersCount ??
    source.usersAssigned ??
    source.userCount ??
    source.assignedCount ??
    source.assignedUsers;
  const assignedUsersCount = Array.isArray(assignedRaw)
    ? assignedRaw.length
    : Number(assignedRaw ?? 0) || 0;

  return {
    id: id || key,
    name: name || key,
    key,
    serviceType: String(
      source.serviceType ?? source.service ?? source.module ?? "OTHER"
    ).trim() || "OTHER",
    description: String(source.description ?? source.details ?? "").trim(),
    status: source.isDeleted === true ? "INACTIVE" : toStatus(source.status),
    assignedUsersCount,
  };
}

function normalizePermissionList(payload: unknown): ServicePermission[] {
  const unwrapped = unwrap(payload);
  const rows = asArray(unwrapped);
  const list: ServicePermission[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (typeof row === "string" || typeof row === "number") {
      const key = String(row).trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      list.push({
        id: key,
        name: key,
        key: key.toUpperCase(),
        serviceType: "OTHER",
        description: "",
        status: "ACTIVE",
        assignedUsersCount: 0,
      });
      continue;
    }
    const item = normalizePermission(row);
    if (!item) continue;
    const dedupe = item.id || item.key;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    list.push(item);
  }
  return list;
}

function extractPermissionIds(payload: unknown): string[] {
  const unwrapped = unwrap(payload);
  const obj = asRecord(unwrapped);
  const candidates = [
    obj.permissionIds,
    obj.ids,
    obj.enabledPermissionIds,
    obj.enabledIds,
  ];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    return candidate.map((item) => String(item)).filter(Boolean);
  }

  const list = normalizePermissionList(unwrapped);
  return list.map((item) => item.id).filter(Boolean);
}

function toSaveIds(ids: string[]): number[] | string[] {
  if (ids.every((id) => /^\d+$/.test(id))) {
    return ids.map((id) => Number(id));
  }
  return ids;
}

/** Load users for a role from existing Super Admin / public APIs. */
export async function listPermissionUsersByRole(
  role: PermissionRoleType
): Promise<PermissionUserOption[]> {
  if (role === "ADMIN") {
    const result = await getAdmins({ page: 1, pageSize: 200 });
    const options: PermissionUserOption[] = [];
    for (const admin of result.data) {
      const id = getAdminId(admin);
      if (!id) continue;
      options.push({
        id,
        name: getAdminDisplayName(admin),
        role: "ADMIN",
        roleLabel: roleLabel("ADMIN"),
        mobile: admin.mobile,
        email: admin.email,
        status: admin.status || "ACTIVE",
        userCode: admin.adminId || admin.userCode,
        createdAt: admin.createdAt,
      });
    }
    return options;
  }

  const userType = role as PublicNetworkUserType;
  const users = await getPublicNetworkUsers(userType);
  return users.map((user) => ({
    id: user.id,
    name:
      user.firstName?.trim() ||
      user.fullName?.trim() ||
      user.name?.trim() ||
      user.mobile ||
      "Unknown",
    role,
    roleLabel: roleLabel(role),
    mobile: user.mobile,
    email: user.email,
    status: user.status || "ACTIVE",
    userCode: user.userCode,
  }));
}

export async function getPermissions(): Promise<ServicePermission[]> {
  const { data } = await superAdminClient.get<ApiResponse<unknown> | unknown>(
    "/permissions"
  );
  return normalizePermissionList(data);
}

export async function getPermissionById(
  permissionId: string
): Promise<ServicePermission> {
  const { data } = await superAdminClient.get<ApiResponse<unknown> | unknown>(
    `/permissions/${permissionId}`
  );
  const item = normalizePermission(unwrap(data));
  if (!item) {
    throw new Error("Permission not found");
  }
  return item;
}

export async function createPermission(
  payload: CreatePermissionPayload
): Promise<ServicePermission> {
  const body = {
    name: payload.name.trim(),
    serviceName: payload.name.trim(),
    permissionKey: payload.permissionKey.trim().toUpperCase(),
    key: payload.permissionKey.trim().toUpperCase(),
    serviceType: payload.serviceType.trim(),
    service: payload.serviceType.trim(),
    description: payload.description?.trim() || undefined,
    status: payload.status || "ACTIVE",
  };
  const { data } = await superAdminClient.post<ApiResponse<unknown> | unknown>(
    "/permissions",
    body
  );
  return (
    normalizePermission(unwrap(data)) || {
      id: "",
      name: body.name,
      key: body.key,
      serviceType: body.serviceType,
      description: body.description || "",
      status: body.status,
      assignedUsersCount: 0,
    }
  );
}

export async function updatePermission(
  permissionId: string,
  payload: UpdatePermissionPayload
): Promise<ServicePermission> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) {
    body.name = payload.name.trim();
    body.serviceName = payload.name.trim();
  }
  if (payload.permissionKey !== undefined) {
    const key = payload.permissionKey.trim().toUpperCase();
    body.permissionKey = key;
    body.key = key;
  }
  if (payload.serviceType !== undefined) {
    body.serviceType = payload.serviceType.trim();
    body.service = payload.serviceType.trim();
  }
  if (payload.description !== undefined) {
    body.description = payload.description.trim();
  }
  if (payload.status !== undefined) {
    body.status = payload.status;
  }
  const { data } = await superAdminClient.put<ApiResponse<unknown> | unknown>(
    `/permissions/${permissionId}`,
    body
  );
  const item = normalizePermission(unwrap(data));
  if (item) return item;
  return getPermissionById(permissionId);
}

export async function deletePermission(permissionId: string): Promise<void> {
  await superAdminClient.delete(`/permissions/${permissionId}`);
}

export async function getUserPermissions(
  userId: string
): Promise<UserPermissionSnapshot> {
  const { data } = await superAdminClient.get<ApiResponse<unknown> | unknown>(
    `/permissions/users/${userId}`
  );
  const permissions = normalizePermissionList(data);
  const permissionIds = extractPermissionIds(data);
  return {
    userId,
    permissionIds: permissionIds.length
      ? permissionIds
      : permissions.map((item) => item.id),
    permissions,
  };
}

export async function assignUserPermissions(
  userId: string,
  permissionIds: string[]
): Promise<UserPermissionSnapshot> {
  await superAdminClient.post(`/permissions/users/${userId}`, {
    permissionIds: toSaveIds(permissionIds),
  });
  return getUserPermissions(userId);
}

export async function updateUserPermissions(
  userId: string,
  permissionIds: string[]
): Promise<UserPermissionSnapshot> {
  await superAdminClient.put(`/permissions/users/${userId}`, {
    permissionIds: toSaveIds(permissionIds),
  });
  return getUserPermissions(userId);
}

export async function removeUserPermission(
  userId: string,
  permissionId: string
): Promise<void> {
  await superAdminClient.delete(
    `/permissions/users/${userId}/${permissionId}`
  );
}

export async function checkPermission(permissionKey: string): Promise<boolean> {
  const key = permissionKey.trim().toUpperCase();
  const { data } = await superAdminClient.get<ApiResponse<unknown> | unknown>(
    `/permissions/check/${encodeURIComponent(key)}`
  );
  const unwrapped = unwrap(data);
  if (typeof unwrapped === "boolean") return unwrapped;
  const obj = asRecord(unwrapped);
  if (typeof obj.allowed === "boolean") return obj.allowed;
  if (typeof obj.hasPermission === "boolean") return obj.hasPermission;
  if (typeof obj.enabled === "boolean") return obj.enabled;
  return Boolean(obj.success ?? true);
}

export async function getMyUserPermissions(
  userId: string
): Promise<UserPermissionSnapshot> {
  const { data } = await adminClient.get<ApiResponse<unknown> | unknown>(
    `/permissions/users/${userId}`
  );
  const permissions = normalizePermissionList(data);
  const permissionIds = extractPermissionIds(data);
  return {
    userId,
    permissionIds: permissionIds.length
      ? permissionIds
      : permissions.map((item) => item.id),
    permissions,
  };
}

export async function getMyPermissionsCatalog(): Promise<ServicePermission[]> {
  const { data } = await adminClient.get<ApiResponse<unknown> | unknown>(
    "/permissions"
  );
  return normalizePermissionList(data);
}

export async function checkMyPermission(
  permissionKey: string
): Promise<boolean> {
  const key = permissionKey.trim().toUpperCase();
  const { data } = await adminClient.get<ApiResponse<unknown> | unknown>(
    `/permissions/check/${encodeURIComponent(key)}`
  );
  const unwrapped = unwrap(data);
  if (typeof unwrapped === "boolean") return unwrapped;
  const obj = asRecord(unwrapped);
  if (typeof obj.allowed === "boolean") return obj.allowed;
  if (typeof obj.hasPermission === "boolean") return obj.hasPermission;
  if (typeof obj.enabled === "boolean") return obj.enabled;
  return Boolean(obj.success ?? true);
}

export function groupPermissionsByService(items: ServicePermission[]) {
  const groups = new Map<string, ServicePermission[]>();
  for (const item of items) {
    const type = item.serviceType || "OTHER";
    const list = groups.get(type) || [];
    list.push(item);
    groups.set(type, list);
  }
  return Array.from(groups.entries()).map(([serviceType, permissions]) => ({
    serviceType,
    permissions,
  }));
}
