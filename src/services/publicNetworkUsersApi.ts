import { publicClient } from "@/lib/api/client";
import { ApiResponse } from "@/types";

export type PublicNetworkUserType =
  | "ADMIN"
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
  balance?: number;
  walletBalance?: number;
  holdBalance?: number;
  walletStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PublicNetworkUsersData {
  admins?: PublicNetworkUser[];
  masterDistributors?: PublicNetworkUser[];
  distributors?: PublicNetworkUser[];
  retailers?: PublicNetworkUser[];
  counts?: {
    admins?: number;
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

function parseBalance(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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
  const wallet = asRecord(obj.wallet);
  const balance =
    parseBalance(obj.walletBalance) ??
    parseBalance(obj.balance) ??
    parseBalance(obj.currentWalletBalance) ??
    parseBalance(obj.currentBalance) ??
    parseBalance(wallet.balance) ??
    parseBalance(wallet.walletBalance);

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
    balance,
    walletBalance: balance,
    holdBalance:
      parseBalance(obj.holdBalance) ?? parseBalance(wallet.holdAmount),
    walletStatus:
      (obj.walletStatus as string | undefined) ??
      (wallet.status as string | undefined),
    createdAt: (obj.createdAt as string | undefined) ?? undefined,
    updatedAt: (obj.updatedAt as string | undefined) ?? undefined,
  };
}

function pickUsersByType(
  data: PublicNetworkUsersData,
  userType: PublicNetworkUserType
): PublicNetworkUser[] {
  switch (userType) {
    case "ADMIN":
      return data.admins ?? [];
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

/** Dropdown label: firstName -- userCode -- mobile */
export function getPublicNetworkUserDropdownLabel(
  user: PublicNetworkUser
): string {
  const firstName =
    user.firstName?.trim() ||
    user.fullName?.trim() ||
    user.name?.trim() ||
    "Unknown";
  const userCode = user.userCode?.trim() || "—";
  const mobile = user.mobile?.trim() || "—";
  return `${firstName} -- ${userCode} -- ${mobile}`;
}

/** Dropdown / transfer label: Name - UserType - Mobile - Balance */
export function getPublicNetworkUserTransferLabel(
  user: PublicNetworkUser,
  balance?: number
): string {
  const name =
    user.firstName?.trim() ||
    user.fullName?.trim() ||
    user.name?.trim() ||
    "Unknown";
  const userType = (user.userType || "—")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const mobile = user.mobile?.trim() || "—";
  const amount = balance ?? user.walletBalance ?? user.balance ?? 0;
  const formatted =
    typeof amount === "number" && Number.isFinite(amount)
      ? `₹${amount.toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`
      : "₹0";
  return `${name} - ${userType} - ${mobile} - ${formatted}`;
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
 * Supports userType=ADMIN|Admin|MASTER_DISTRIBUTOR|DISTRIBUTOR|RETAILER
 */
export async function getPublicNetworkUsers(
  userType?: PublicNetworkUserType | "ALL"
): Promise<PublicNetworkUser[]> {
  const apiUserType =
    !userType || userType === "ALL" ? undefined : userType;

  const { data } = await publicClient.get<
    ApiResponse<PublicNetworkUsersData | PublicNetworkUser[]>
  >("/public/network-users", {
    params: apiUserType ? { userType: apiUserType } : undefined,
  });

  const payload = data.data;
  if (Array.isArray(payload)) {
    return payload
      .map(normalizePublicNetworkUser)
      .filter((user) => user.id)
      .filter((user) => {
        if (!apiUserType) return true;
        if (!user.userType) return true;
        return user.userType.toUpperCase() === apiUserType;
      });
  }

  const grouped = payload ?? {};
  if (apiUserType) {
    return pickUsersByType(grouped, apiUserType)
      .map(normalizePublicNetworkUser)
      .filter((user) => user.id);
  }

  return [
    ...(grouped.admins ?? []),
    ...(grouped.masterDistributors ?? []),
    ...(grouped.distributors ?? []),
    ...(grouped.retailers ?? []),
  ]
    .map(normalizePublicNetworkUser)
    .filter((user) => user.id);
}
