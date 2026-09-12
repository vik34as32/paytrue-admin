import { isAdminOrSuperAdminUserType } from "@/lib/commission/permissions";

export const HIERARCHY_PERMISSIONS = {
  view: "hierarchy.view",
  reassignRetailer: "hierarchy.reassign_retailer",
  reassignDistributor: "hierarchy.reassign_distributor",
} as const;

export type HierarchyPermission =
  (typeof HIERARCHY_PERMISSIONS)[keyof typeof HIERARCHY_PERMISSIONS];

function hasSlug(
  permissions: string[] | null | undefined,
  slug: HierarchyPermission
): boolean {
  return Boolean(permissions?.includes(slug));
}

/** UX-only gate; backend remains the authority. */
export function canViewHierarchy(input: {
  permissions?: string[] | null;
  userType?: string | null;
  role?: string | null;
  isAdminApiAuth?: boolean;
  isSuperAdminAuthenticated?: boolean;
}): boolean {
  if (input.isAdminApiAuth || input.isSuperAdminAuthenticated) return true;
  if (hasSlug(input.permissions, HIERARCHY_PERMISSIONS.view)) return true;
  return isAdminOrSuperAdminUserType(input.userType || input.role);
}

export function canReassignRetailer(input: {
  permissions?: string[] | null;
  userType?: string | null;
  role?: string | null;
  isAdminApiAuth?: boolean;
  isSuperAdminAuthenticated?: boolean;
}): boolean {
  if (input.isAdminApiAuth || input.isSuperAdminAuthenticated) return true;
  if (hasSlug(input.permissions, HIERARCHY_PERMISSIONS.reassignRetailer)) {
    return true;
  }
  // Fall back to update users + view hierarchy when granular slug missing
  if (
    hasSlug(input.permissions, HIERARCHY_PERMISSIONS.view) &&
    (input.permissions?.includes("users.update") ?? false)
  ) {
    return true;
  }
  return isAdminOrSuperAdminUserType(input.userType || input.role);
}

export function canReassignDistributor(input: {
  permissions?: string[] | null;
  userType?: string | null;
  role?: string | null;
  isAdminApiAuth?: boolean;
  isSuperAdminAuthenticated?: boolean;
}): boolean {
  if (input.isAdminApiAuth || input.isSuperAdminAuthenticated) return true;
  if (hasSlug(input.permissions, HIERARCHY_PERMISSIONS.reassignDistributor)) {
    return true;
  }
  if (
    hasSlug(input.permissions, HIERARCHY_PERMISSIONS.view) &&
    (input.permissions?.includes("users.update") ?? false)
  ) {
    return true;
  }
  return isAdminOrSuperAdminUserType(input.userType || input.role);
}

export function getHierarchyFriendlyError(error: unknown): string {
  const message =
    error instanceof Error && error.message.trim()
      ? error.message.trim()
      : "Something went wrong. Please try again.";

  const lower = message.toLowerCase();
  if (lower.includes("prisma") || lower.includes("sql") || lower.includes("database")) {
    return "Something went wrong. Please try again.";
  }
  if (lower.includes("not a distributor")) {
    return "Current parent is not a distributor. This retailer must already belong to a distributor before reassignment.";
  }
  if (lower.includes("not a retailer")) {
    return "Selected user is not a retailer.";
  }
  if (lower.includes("invalid hierarchy") || lower.includes("invalid hierarchy relationship")) {
    return "New parent must be an active distributor.";
  }
  if (
    lower.includes("does not currently belong") ||
    lower.includes("wrong_source") ||
    lower.includes("source distributor")
  ) {
    return "The hierarchy has changed. Please refresh and try again.";
  }
  if (lower.includes("403") || lower.includes("permission") || lower.includes("forbidden")) {
    return "You do not have permission to modify this hierarchy.";
  }
  if (lower.includes("404") || lower.includes("not found")) {
    return "The selected user could not be found.";
  }
  if (lower.includes("409") || lower.includes("conflict") || lower.includes("changed")) {
    return "The hierarchy has changed. Please refresh and try again.";
  }
  if (lower.includes("422") || lower.includes("validation")) {
    return "Please check the entered information.";
  }
  if (lower.includes("500") || lower.includes("internal server")) {
    return "Something went wrong. Please try again.";
  }
  return message;
}
