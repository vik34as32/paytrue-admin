import { superAdminClient, superAdminModuleClient } from "@/lib/api/client";
import { getAdmins } from "@/services/superAdminApi";
import {
  getPublicNetworkUsers,
  type PublicNetworkUserType,
} from "@/services/publicNetworkUsersApi";
import { getAdminDisplayName, getAdminId } from "@/services/admin";
import {
  getDefaultEnabledSlugs,
  getModuleOptionsForRole,
  getPermissionModulesForRole,
  PERMISSION_ROLE_OPTIONS,
} from "@/constants/permissionModules";
import type {
  PermissionRoleType,
  PermissionUserOption,
  UserPermissionState,
} from "@/types/permissions";
import type { ApiResponse } from "@/types";

const LOCAL_STORE_KEY = "paytrue.userPermissions.v1";

function roleLabel(role: PermissionRoleType): string {
  return (
    PERMISSION_ROLE_OPTIONS.find((option) => option.value === role)?.label ||
    role
  );
}

function readLocalStore(): Record<string, UserPermissionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, UserPermissionState>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalStore(store: Record<string, UserPermissionState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function extractSlugs(payload: unknown): string[] {
  const obj = asRecord(payload);
  const candidates = [
    obj.enabledSlugs,
    obj.permissionSlugs,
    obj.permissions,
    obj.slugs,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    return candidate
      .map((item) => {
        if (typeof item === "string") return item;
        const row = asRecord(item);
        return String(row.slug ?? row.permissionSlug ?? row.id ?? "");
      })
      .filter(Boolean);
  }

  return [];
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

/**
 * Fetch enabled permission slugs for a user.
 * Tries live API first, then local persistence, then role defaults.
 */
export async function getUserPermissionState(
  userId: string,
  role: PermissionRoleType
): Promise<UserPermissionState> {
  const endpoints = [
    () =>
      superAdminModuleClient.get<ApiResponse<unknown>>(
        `/users/${userId}/permissions`
      ),
    () =>
      superAdminClient.get<ApiResponse<unknown>>(
        `/users/${userId}/permissions`
      ),
  ];

  for (const request of endpoints) {
    try {
      const { data } = await request();
      const slugs = extractSlugs(data.data ?? data);
      if (slugs.length || data.success) {
        return {
          userId,
          enabledSlugs: slugs,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Try next endpoint / fallback
    }
  }

  const local = readLocalStore()[userId];
  if (local) return local;

  return {
    userId,
    enabledSlugs: getDefaultEnabledSlugs(role),
    updatedAt: undefined,
  };
}

/**
 * Persist user permissions.
 * Tries live API; on failure stores locally so UI remains fully usable.
 */
export async function saveUserPermissionState(
  userId: string,
  enabledSlugs: string[]
): Promise<UserPermissionState> {
  const body = {
    permissionSlugs: enabledSlugs,
    enabledSlugs,
    permissions: enabledSlugs,
  };

  const endpoints = [
    () =>
      superAdminModuleClient.put<ApiResponse<unknown>>(
        `/users/${userId}/permissions`,
        body
      ),
    () =>
      superAdminClient.put<ApiResponse<unknown>>(
        `/users/${userId}/permissions`,
        body
      ),
    () =>
      superAdminClient.post<ApiResponse<unknown>>(
        `/users/${userId}/permissions`,
        body
      ),
  ];

  for (const request of endpoints) {
    try {
      await request();
      const state: UserPermissionState = {
        userId,
        enabledSlugs,
        updatedAt: new Date().toISOString(),
      };
      const store = readLocalStore();
      store[userId] = state;
      writeLocalStore(store);
      return state;
    } catch {
      // Try next / local fallback
    }
  }

  const state: UserPermissionState = {
    userId,
    enabledSlugs,
    updatedAt: new Date().toISOString(),
  };
  const store = readLocalStore();
  store[userId] = state;
  writeLocalStore(store);
  return state;
}

export function listPermissionModules(role?: PermissionRoleType) {
  if (!role) return [];
  return getPermissionModulesForRole(role);
}

export function listPermissionModuleOptions(role?: PermissionRoleType) {
  if (!role) return [{ value: "", label: "All Modules" }];
  return getModuleOptionsForRole(role);
}
