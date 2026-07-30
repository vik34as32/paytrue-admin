import {
  getNetworkUserBalance,
  getNetworkUserId,
  getNetworkUserName,
} from "@/services/adminApi";
import type { AdminNetworkUser } from "@/types/admin";
import {
  getAdminBalance,
  getAdminDisplayName,
  getAdminId,
} from "@/services/admin";
import { getWalletBalance } from "@/lib/normalizeUser";
import { formatUserTypeLabel } from "@/lib/normalizeUser";
import type { WalletTransferReceiver } from "@/types/wallet";
import type { AdminRecord, NetworkUserRecord } from "@/types/superAdmin";
import type { PublicNetworkUser } from "@/services/publicNetworkUsersApi";
import { getPublicNetworkUserTransferLabel } from "@/services/publicNetworkUsersApi";
import { formatCurrency } from "@/lib/utils";

export function formatWalletTransferRole(role: string): string {
  return formatUserTypeLabel(role);
}

export function normalizeTransferRole(value?: string): string {
  if (!value) return "";
  return value.trim().toUpperCase().replace(/-/g, "_").replace(/\s+/g, "_");
}

export function getNetworkUserRecordId(user: NetworkUserRecord): string {
  const raw = user as Record<string, unknown>;
  return String(user.id || raw._id || raw.userId || "");
}

/** Dropdown label: Name - UserType - Mobile - Balance */
export function formatWalletReceiverDropdownLabel(
  receiver: WalletTransferReceiver
): string {
  const name = receiver.name?.trim() || "Unknown";
  const userType = receiver.roleLabel || formatWalletTransferRole(receiver.role);
  const mobile = receiver.mobile?.trim() || "—";
  return `${name} - ${userType} - ${mobile} - ${formatCurrency(receiver.balance ?? 0)}`;
}

export function networkUserToReceiver(
  user: NetworkUserRecord,
  role: string
): WalletTransferReceiver | null {
  const id = getNetworkUserRecordId(user);
  if (!id) return null;

  const resolvedRole =
    normalizeTransferRole(user.userType || user.role) ||
    normalizeTransferRole(role);

  return {
    id,
    name:
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email ||
      user.mobile ||
      "—",
    role: resolvedRole || normalizeTransferRole(role),
    roleLabel: formatWalletTransferRole(resolvedRole || role),
    balance: getWalletBalance(user),
    email: user.email,
    mobile: user.mobile,
  };
}

export function adminRecordToReceiver(
  admin: AdminRecord
): WalletTransferReceiver | null {
  const id = getAdminId(admin);
  if (!id) return null;

  return {
    id,
    name: getAdminDisplayName(admin),
    role: "ADMIN",
    roleLabel: "Admin",
    balance: getAdminBalance(admin),
    email: admin.email,
    mobile: admin.mobile,
  };
}

export function adminNetworkUserToReceiver(
  user: AdminNetworkUser,
  role: string
): WalletTransferReceiver | null {
  const id = getNetworkUserId(user);
  if (!id) return null;

  const resolvedRole =
    normalizeTransferRole(user.userType) || normalizeTransferRole(role);

  return {
    id,
    name: getNetworkUserName(user),
    role: resolvedRole || normalizeTransferRole(role),
    roleLabel: formatWalletTransferRole(resolvedRole || role),
    balance: getNetworkUserBalance(user),
    email: user.email,
    mobile: user.mobile,
  };
}

export function publicNetworkUserToReceiver(
  user: PublicNetworkUser,
  role: string
): WalletTransferReceiver | null {
  if (!user.id) return null;

  const resolvedRole =
    normalizeTransferRole(user.userType) || normalizeTransferRole(role);
  const name =
    user.firstName?.trim() ||
    user.fullName?.trim() ||
    user.name?.trim() ||
    user.mobile ||
    "—";

  return {
    id: user.id,
    name,
    role: resolvedRole || normalizeTransferRole(role),
    roleLabel: formatWalletTransferRole(resolvedRole || role),
    balance: user.walletBalance ?? user.balance ?? 0,
    email: user.email,
    mobile: user.mobile,
  };
}

export function publicNetworkUserDropdownLabel(
  user: PublicNetworkUser,
  balance?: number
): string {
  return getPublicNetworkUserTransferLabel(user, balance);
}

export function filterWalletTransferReceivers(
  receivers: WalletTransferReceiver[],
  query: string,
  roleFilter: string
): WalletTransferReceiver[] {
  const normalizedQuery = query.trim().toLowerCase();

  return receivers.filter((receiver) => {
    const matchesRole = roleFilter === "ALL" || receiver.role === roleFilter;
    if (!matchesRole) return false;
    if (!normalizedQuery) return true;

    return [
      receiver.name,
      receiver.email,
      receiver.mobile,
      receiver.roleLabel,
      formatWalletReceiverDropdownLabel(receiver),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });
}
