import { UserRole } from "@/types";

/** Normalize API role / userType values into app UserRole */
export function resolveAuthRole(raw: {
  role?: string;
  userType?: string;
}): UserRole {
  const role = (raw.role ?? "").toLowerCase().replace(/-/g, "_");
  const userType = (raw.userType ?? "").toUpperCase();

  if (role === "super_admin" || userType === "SUPER_ADMIN") {
    return "super_admin";
  }
  if (role === "admin" || userType === "ADMIN") {
    return "admin";
  }
  if (role === "master_distributor" || userType === "MASTER_DISTRIBUTOR") {
    return "master_distributor";
  }
  if (role === "distributor" || userType === "DISTRIBUTOR") {
    return "distributor";
  }
  if (role === "retailer" || userType === "RETAILER") {
    return "retailer";
  }

  return "admin";
}

export function isAdminRole(user: {
  role?: string;
  userType?: string;
} | null | undefined): boolean {
  if (!user) return false;
  return resolveAuthRole(user) === "admin";
}
