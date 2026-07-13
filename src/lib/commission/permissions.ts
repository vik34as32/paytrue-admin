import { UserRole } from "@/types";
import { resolveAuthRole } from "@/lib/normalizeAuthRole";

/** Backend permission keys used by commission APIs */
export const COMMISSION_PERMISSIONS = {
  create: "commission.create",
  read: "commission.read",
  update: "commission.update",
  delete: "commission.delete",
} as const;

export type CommissionPermission =
  (typeof COMMISSION_PERMISSIONS)[keyof typeof COMMISSION_PERMISSIONS];

const COMMISSION_ALLOWED_USER_TYPES = ["ADMIN", "SUPER_ADMIN"] as const;

export function normalizeUserType(
  value?: string | null
): string {
  if (!value) return "";
  return value.trim().toUpperCase().replace(/-/g, "_");
}

/**
 * Backend-equivalent check:
 * `['ADMIN', 'SUPER_ADMIN'].includes(userType)`
 */
export function isAdminOrSuperAdminUserType(
  userTypeOrRole?: string | null
): boolean {
  const userType = normalizeUserType(userTypeOrRole);
  if (
    (COMMISSION_ALLOWED_USER_TYPES as readonly string[]).includes(userType)
  ) {
    return true;
  }

  const role = resolveAuthRole({
    role: userTypeOrRole ?? undefined,
    userType: userTypeOrRole ?? undefined,
  });
  return role === "admin" || role === "super_admin";
}

/**
 * Backend-equivalent check:
 * `permissions.includes('commission.create')`
 * Falls back to ADMIN / SUPER_ADMIN userType when permissions are absent.
 */
export function hasCommissionPermission(
  input: {
    permissions?: string[] | null;
    userType?: string | null;
    role?: string | null;
  },
  permission: CommissionPermission = COMMISSION_PERMISSIONS.create
): boolean {
  const permissions = input.permissions ?? [];
  if (permissions.includes(permission)) {
    return true;
  }

  return isAdminOrSuperAdminUserType(input.userType || input.role);
}

export function canAccessCommissionManagement(input: {
  permissions?: string[] | null;
  userType?: string | null;
  role?: UserRole | string | null;
  isAdminApiAuth?: boolean;
  isSuperAdminAuthenticated?: boolean;
}): boolean {
  if (input.isAdminApiAuth || input.isSuperAdminAuthenticated) {
    return true;
  }

  return hasCommissionPermission(
    {
      permissions: input.permissions,
      userType: input.userType,
      role: input.role,
    },
    COMMISSION_PERMISSIONS.read
  ) || hasCommissionPermission(input, COMMISSION_PERMISSIONS.create);
}
