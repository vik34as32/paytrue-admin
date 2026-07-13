import { publicClient } from "@/lib/api/client";
import { ApiResponse } from "@/types";

export type PublicNetworkUserType =
  | "MASTER_DISTRIBUTOR"
  | "DISTRIBUTOR"
  | "RETAILER";

export interface PublicNetworkUser {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  userCode?: string;
  mobile?: string;
  email?: string;
  userType?: string;
  parentId?: string | null;
  status?: string;
}

interface PublicNetworkUsersData {
  masterDistributors?: PublicNetworkUser[];
  distributors?: PublicNetworkUser[];
  retailers?: PublicNetworkUser[];
  counts?: {
    masterDistributors?: number;
    distributors?: number;
    retailers?: number;
    total?: number;
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function normalizePublicNetworkUser(raw: unknown): PublicNetworkUser {
  const obj = asRecord(raw);
  const firstName = (obj.firstName as string | undefined) ?? undefined;
  const lastName = (obj.lastName as string | undefined) ?? undefined;
  const fullName =
    (obj.fullName as string | undefined) ||
    (obj.name as string | undefined) ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    undefined;

  return {
    id: String(obj.id ?? ""),
    firstName,
    lastName,
    fullName,
    name: fullName,
    userCode: (obj.userCode as string | undefined) ?? undefined,
    mobile: (obj.mobile as string | undefined) ?? undefined,
    email: (obj.email as string | undefined) ?? undefined,
    userType: (obj.userType as string | undefined) ?? undefined,
    parentId: (obj.parentId as string | null | undefined) ?? null,
    status: (obj.status as string | undefined) ?? undefined,
  };
}

function pickUsersByType(
  data: PublicNetworkUsersData,
  userType: PublicNetworkUserType
): PublicNetworkUser[] {
  switch (userType) {
    case "MASTER_DISTRIBUTOR":
      return data.masterDistributors ?? [];
    case "DISTRIBUTOR":
      return data.distributors ?? [];
    case "RETAILER":
      return data.retailers ?? [];
    default:
      return [];
  }
}

export function getPublicNetworkUserLabel(user: PublicNetworkUser): string {
  const name =
    user.fullName ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Unknown";
  const code = user.userCode || user.mobile;
  return code ? `${name} — ${code}` : name;
}

/** Dropdown label: Name + user ID (for wallet summary / pickers) */
export function getPublicNetworkUserNameIdLabel(user: PublicNetworkUser): string {
  const name =
    user.fullName ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Unknown";
  return `${name} (${user.id})`;
}

/**
 * GET /api/v1/public/network-users
 * Optional `userType` filters to one group; without it returns all groups flattened.
 */
export async function getPublicNetworkUsers(
  userType?: PublicNetworkUserType
): Promise<PublicNetworkUser[]> {
  const { data } = await publicClient.get<
    ApiResponse<PublicNetworkUsersData | PublicNetworkUser[]>
  >("/public/network-users", {
    params: userType ? { userType } : undefined,
  });

  const payload = data.data;
  if (Array.isArray(payload)) {
    return payload
      .map(normalizePublicNetworkUser)
      .filter((user) => user.id)
      .filter((user) => {
        if (!userType) return true;
        if (!user.userType) return true;
        return user.userType.toUpperCase() === userType;
      });
  }

  const grouped = payload ?? {};
  if (userType) {
    return pickUsersByType(grouped, userType)
      .map(normalizePublicNetworkUser)
      .filter((user) => user.id);
  }

  return [
    ...(grouped.masterDistributors ?? []),
    ...(grouped.distributors ?? []),
    ...(grouped.retailers ?? []),
  ]
    .map(normalizePublicNetworkUser)
    .filter((user) => user.id);
}
