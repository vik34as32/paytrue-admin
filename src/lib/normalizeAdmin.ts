import {
  AdminDetailRecord,
  AdminRecord,
  UserProfileRecord,
  UserWalletRecord,
} from "@/types/superAdmin";
import { getAdminBalance, getAdminDisplayName, getAdminId } from "@/services/admin";

function parseAmount(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeAdminRecord(raw: unknown): AdminRecord {
  if (!raw || typeof raw !== "object") {
    return { id: "" };
  }

  const obj = raw as Record<string, unknown>;
  const profile =
    obj.profile && typeof obj.profile === "object"
      ? (obj.profile as UserProfileRecord)
      : undefined;
  const wallet =
    obj.wallet && typeof obj.wallet === "object"
      ? (obj.wallet as UserWalletRecord)
      : undefined;

  const walletBalance =
    parseAmount(obj.walletBalance) ??
    parseAmount(obj.currentWalletBalance) ??
    parseAmount(obj.balance) ??
    parseAmount(wallet?.balance) ??
    0;

  const profileImage =
    profile?.profileImage ?? (obj.profileImage as string | undefined);

  return {
    id: String(obj.id ?? obj._id ?? ""),
    adminId: (obj.adminId as string | undefined) ?? String(obj.id ?? ""),
    firstName: obj.firstName as string | undefined,
    lastName: obj.lastName as string | undefined,
    name:
      (obj.name as string | undefined) ||
      [obj.firstName, obj.lastName].filter(Boolean).join(" ") ||
      undefined,
    email: obj.email as string | undefined,
    mobile: obj.mobile as string | undefined,
    userType: (obj.userType as string | undefined) || "ADMIN",
    status: obj.status as string | undefined,
    userCode: obj.userCode as string | undefined,
    profileImage,
    walletBalance,
    currentWalletBalance: walletBalance,
    balance: walletBalance,
    createdAt: obj.createdAt as string | undefined,
    updatedAt: obj.updatedAt as string | undefined,
    wallet,
    profile,
  };
}

export function normalizeAdminDetail(raw: unknown): AdminDetailRecord {
  const base = normalizeAdminRecord(raw);
  if (!raw || typeof raw !== "object") {
    return { id: "" };
  }

  const obj = raw as Record<string, unknown>;
  const profile = base.profile;

  return {
    ...base,
    alternateMobileNumber:
      profile?.alternateMobileNumber ??
      (obj.alternateMobileNumber as string | undefined),
    parentId: obj.parentId as string | undefined,
    createdById: obj.createdById as string | undefined,
    tenantId: (obj.tenantId as string | null | undefined) ?? null,
    lastLoginAt: obj.lastLoginAt as string | undefined,
    lastLoginIp: obj.lastLoginIp as string | undefined,
    isEmailVerified: obj.isEmailVerified as boolean | undefined,
    mobileVerified: obj.mobileVerified as boolean | undefined,
    mobileVerifiedAt: obj.mobileVerifiedAt as string | undefined,
    deletedAt: (obj.deletedAt as string | null | undefined) ?? null,
  };
}

export function formatAdminUserType(userType?: string): string {
  if (!userType) return "Admin";
  return userType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatBooleanLabel(value?: boolean): string {
  if (value === undefined || value === null) return "—";
  return value ? "Yes" : "No";
}

export { getAdminDisplayName, getAdminBalance, getAdminId };
