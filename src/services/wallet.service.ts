import { adminClient, superAdminClient } from "@/lib/api/client";
import { STORAGE_KEYS } from "@/constants/storage";
import { getErrorMessage } from "@/lib/api/messages";
import {
  buildWalletDeductPayload,
  buildWalletTransferPayload,
  normalizeTransferAmount,
} from "@/lib/walletAmount";
import { ApiResponse } from "@/types";
import {
  WalletListPagination,
  WalletListSummary,
  WalletUser,
  WalletUsersListParams,
  WalletUsersListResult,
} from "@/types/wallet";

/**
 * Prefer session token for the active panel.
 * Admin and Super Admin both call GET /api/v1/wallet/users.
 */
export function getWalletUsersClient() {
  if (typeof window === "undefined") {
    return adminClient;
  }

  const adminToken =
    localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  if (adminToken) return adminClient;

  const saToken =
    localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
  if (saToken) return superAdminClient;

  return adminClient;
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function balanceFromWalletsArray(
  wallets: unknown,
  walletType: string
): number | undefined {
  if (!Array.isArray(wallets)) return undefined;
  const match = wallets.find((item) => {
    if (!item || typeof item !== "object") return false;
    const type = String(
      (item as Record<string, unknown>).walletType ||
        (item as Record<string, unknown>).type ||
        ""
    ).toUpperCase();
    return type === walletType.toUpperCase();
  }) as Record<string, unknown> | undefined;
  if (!match) return undefined;
  return toNumber(match.balance ?? match.amount ?? match.walletBalance);
}

/** Normalize live API row from GET /wallet/users */
export function normalizeWalletUser(raw: Record<string, unknown>): WalletUser {
  const fromWalletsMain = balanceFromWalletsArray(raw.wallets, "MAIN");
  const fromWalletsCommission = balanceFromWalletsArray(
    raw.wallets,
    "COMMISSION"
  );
  const fromWalletsAeps = balanceFromWalletsArray(raw.wallets, "AEPS");

  const mainWallet = toNumber(
    raw.mainWallet ??
      raw.walletBalance ??
      raw.balance ??
      fromWalletsMain ??
      (raw.wallet && typeof raw.wallet === "object"
        ? (raw.wallet as Record<string, unknown>).balance
        : 0)
  );
  const walletObj =
    raw.wallet && typeof raw.wallet === "object"
      ? (raw.wallet as Record<string, unknown>)
      : null;

  const holdBalanceRaw = toNumber(
    raw.holdBalance ??
      raw.holdAmount ??
      raw.lienAmount ??
      raw.lienBalance ??
      walletObj?.holdAmount ??
      walletObj?.holdBalance ??
      walletObj?.lienAmount
  );

  const walletStatusRaw = String(
    raw.walletStatus ?? walletObj?.status ?? ""
  ).toUpperCase();
  const walletIsFrozen =
    walletStatusRaw.includes("FROZEN") || walletStatusRaw === "FREEZE";

  const availableFromApi =
    raw.availableBalance != null && raw.availableBalance !== ""
      ? toNumber(raw.availableBalance)
      : null;

  // Freeze amount — API may use several field names after /wallet/freeze
  let frozenBalance = toNumber(
    raw.frozenBalance ??
      raw.freezeBalance ??
      raw.frozenAmount ??
      raw.freezeAmount ??
      raw.blockedAmount ??
      raw.blockedBalance ??
      walletObj?.frozenBalance ??
      walletObj?.freezeBalance ??
      walletObj?.frozenAmount ??
      walletObj?.freezeAmount ??
      walletObj?.blockedAmount
  );

  // Fallbacks when API marks wallet FROZEN but doesn't send a dedicated freeze field
  if (frozenBalance <= 0 && walletIsFrozen) {
    if (availableFromApi != null) {
      frozenBalance = Math.max(0, mainWallet - availableFromApi);
    }
    if (frozenBalance <= 0) {
      frozenBalance = holdBalanceRaw > 0 ? holdBalanceRaw : mainWallet;
    }
  }

  // If freeze reused holdBalance field, don't double-count as lien
  const holdBalance =
    walletIsFrozen &&
    frozenBalance > 0 &&
    holdBalanceRaw > 0 &&
    Math.abs(holdBalanceRaw - frozenBalance) < 0.01
      ? 0
      : holdBalanceRaw;

  const commissionWallet = toNumber(
    raw.commissionWallet ??
      raw.commissionWalletBalance ??
      fromWalletsCommission
  );
  const aepsWallet = toNumber(
    raw.aepsWallet ?? raw.aepsWalletBalance ?? fromWalletsAeps
  );
  const lockedTotal = holdBalance + frozenBalance;
  const availableBalance = toNumber(
    availableFromApi ?? Math.max(0, mainWallet - lockedTotal)
  );
  const totalBalance = toNumber(
    raw.totalBalance ?? mainWallet + commissionWallet + aepsWallet
  );

  const firstName =
    typeof raw.firstName === "string" ? raw.firstName.trim() || null : null;
  const lastName =
    typeof raw.lastName === "string" ? raw.lastName.trim() || null : null;
  const rawName =
    typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : null;
  const nameFromParts = [firstName, lastName].filter(Boolean).join(" ").trim();

  const id = String(raw.userId ?? raw.id ?? "");
  const role = String(raw.role ?? raw.userType ?? "") as WalletUser["role"];

  // Retailers: show first name only (no last name)
  const name =
    role === "RETAILER"
      ? firstName ||
        (rawName ? rawName.split(/\s+/)[0] : null) ||
        null
      : rawName || nameFromParts || null;

  const outletRaw =
    raw.outlet && typeof raw.outlet === "object"
      ? (raw.outlet as Record<string, unknown>)
      : null;
  const kycRaw =
    raw.kyc && typeof raw.kyc === "object"
      ? (raw.kyc as Record<string, unknown>)
      : raw.kycDocument && typeof raw.kycDocument === "object"
        ? (raw.kycDocument as Record<string, unknown>)
        : null;

  const pickStr = (
    source: Record<string, unknown> | null,
    ...keys: string[]
  ): string | null => {
    if (!source) return null;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
      }
    }
    return null;
  };

  const outletId =
    pickStr(outletRaw, "instantpayOutletId", "outletId", "id") ||
    pickStr(raw, "instantpayOutletId", "outletId") ||
    null;

  const panNumber =
    pickStr(kycRaw, "panNumber", "pan", "pan_number") ||
    pickStr(raw, "panNumber", "pan", "pan_number");

  const aadhaarNumber =
    pickStr(kycRaw, "aadhaarNumber", "aadhaar", "aadhaar_number") ||
    pickStr(raw, "aadhaarNumber", "aadhaar", "aadhaar_number");

  return {
    userId: id,
    id,
    userCode: (raw.userCode as string | null) ?? null,
    name,
    firstName,
    lastName,
    email: (raw.email as string | null) ?? null,
    mobile: (raw.mobile as string | null) ?? null,
    role,
    status: String(raw.status ?? "PENDING"),
    verificationStatus: String(raw.verificationStatus ?? ""),
    mainWallet,
    commissionWallet,
    aepsWallet,
    holdBalance,
    frozenBalance,
    availableBalance,
    totalBalance,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    wallet: (raw.wallet as WalletUser["wallet"]) ?? null,
    outlet: (raw.outlet as WalletUser["outlet"]) ?? null,
    outletId,
    panNumber,
    aadhaarNumber,
    kycVerifiedAt:
      typeof raw.kycVerifiedAt === "string" ? raw.kycVerifiedAt : null,
    walletStatus: (() => {
      if (typeof raw.walletStatus === "string" && raw.walletStatus.trim()) {
        return raw.walletStatus;
      }
      if (walletObj) {
        const status = walletObj.status;
        if (typeof status === "string" && status.trim()) return status;
      }
      // Some list payloads put freeze flag at root
      if (raw.isFrozen === true || raw.frozen === true) return "FROZEN";
      if (
        typeof raw.status === "string" &&
        raw.status.toUpperCase().includes("FROZEN")
      ) {
        return raw.status;
      }
      return frozenBalance > 0 ? "FROZEN" : "ACTIVE";
    })(),
  };
}

function emptySummary(): WalletListSummary {
  return {
    totalUsers: 0,
    totalMainWalletBalance: 0,
    totalCommissionWalletBalance: 0,
    totalAepsWalletBalance: 0,
    totalHoldBalance: 0,
    totalFrozenBalance: 0,
    totalAvailableBalance: 0,
    totalBalance: 0,
  };
}

function normalizePagination(
  raw: Record<string, unknown> | undefined,
  fallbackLimit: number
): WalletListPagination {
  const total = toNumber(raw?.total);
  const page = toNumber(raw?.page) || 1;
  const limit = toNumber(raw?.limit ?? raw?.pageSize) || fallbackLimit;
  const totalPages =
    toNumber(raw?.totalPages) ||
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return { total, page, limit, totalPages };
}

function summarizeFromItems(
  items: WalletUser[],
  totalUsers: number
): WalletListSummary {
  const totalMainWalletBalance = items.reduce((s, i) => s + i.mainWallet, 0);
  const totalCommissionWalletBalance = items.reduce(
    (s, i) => s + i.commissionWallet,
    0
  );
  const totalAepsWalletBalance = items.reduce((s, i) => s + i.aepsWallet, 0);
  return {
    totalUsers,
    totalMainWalletBalance,
    totalCommissionWalletBalance,
    totalAepsWalletBalance,
    totalHoldBalance: items.reduce((s, i) => s + i.holdBalance, 0),
    totalFrozenBalance: items.reduce((s, i) => s + (i.frozenBalance || 0), 0),
    totalAvailableBalance: items.reduce((s, i) => s + i.availableBalance, 0),
    totalBalance:
      totalMainWalletBalance +
      totalCommissionWalletBalance +
      totalAepsWalletBalance,
  };
}

function normalizeSummary(
  raw: unknown,
  items: WalletUser[],
  totalUsers: number
): WalletListSummary {
  const fromItems = summarizeFromItems(items, totalUsers);

  if (raw && typeof raw === "object") {
    const s = raw as Record<string, unknown>;
    const hasAny =
      s.totalUsers != null ||
      s.totalMainWalletBalance != null ||
      s.totalCommissionWalletBalance != null;
    if (hasAny) {
      const totalMainWalletBalance = toNumber(s.totalMainWalletBalance);
      const totalCommissionWalletBalance = toNumber(
        s.totalCommissionWalletBalance
      );
      const totalAepsWalletBalance = toNumber(s.totalAepsWalletBalance);
      const apiFrozen = toNumber(
        s.totalFrozenBalance ??
          s.totalFreezeBalance ??
          s.totalFrozenAmount ??
          s.frozenBalance
      );
      return {
        totalUsers: toNumber(s.totalUsers ?? totalUsers),
        totalMainWalletBalance,
        totalCommissionWalletBalance,
        totalAepsWalletBalance,
        totalHoldBalance: toNumber(s.totalHoldBalance),
        // Prefer API total; otherwise sum frozen from current page rows
        totalFrozenBalance:
          apiFrozen > 0 || s.totalFrozenBalance != null
            ? apiFrozen
            : fromItems.totalFrozenBalance,
        totalAvailableBalance: toNumber(s.totalAvailableBalance),
        totalBalance: toNumber(
          s.totalBalance ??
            totalMainWalletBalance +
              totalCommissionWalletBalance +
              totalAepsWalletBalance
        ),
      };
    }
  }
  return fromItems;
}

function buildListQuery(
  params: WalletUsersListParams
): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };

  if (params.search?.trim()) query.search = params.search.trim();
  if (params.role) query.role = params.role;
  if (params.status) {
    query.status =
      params.status === "BLOCKED" ? "SUSPENDED" : params.status;
  }
  if (params.verificationStatus) {
    query.verificationStatus = params.verificationStatus;
  }
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortOrder) query.sortOrder = params.sortOrder;

  return query;
}

type WalletUsersApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: unknown;
  items?: unknown[];
  pagination?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  summary?: unknown;
};

/**
 * Parse GET /api/v1/wallet/users response.
 * Live shape:
 * { success, message, data: User[], pagination: { total, page, limit, totalPages } }
 */
export function parseWalletUsersResponse(
  envelope: WalletUsersApiEnvelope,
  fallbackLimit: number
): WalletUsersListResult {
  const root = envelope ?? {};
  const dataNode = root.data;

  let rawItems: unknown[] = [];
  let paginationRaw: Record<string, unknown> | undefined =
    root.pagination ?? root.meta;
  let summaryRaw: unknown = root.summary;

  if (Array.isArray(dataNode)) {
    rawItems = dataNode;
  } else if (dataNode && typeof dataNode === "object") {
    const nested = dataNode as Record<string, unknown>;
    rawItems = Array.isArray(nested.items)
      ? nested.items
      : Array.isArray(nested.data)
        ? nested.data
        : Array.isArray(nested.users)
          ? nested.users
          : [];
    paginationRaw =
      (nested.pagination as Record<string, unknown> | undefined) ??
      (nested.meta as Record<string, unknown> | undefined) ??
      paginationRaw;
    summaryRaw = nested.summary ?? summaryRaw;
  } else if (Array.isArray(root.items)) {
    rawItems = root.items;
  }

  const items = rawItems
    .filter(
      (row): row is Record<string, unknown> => !!row && typeof row === "object"
    )
    .map(normalizeWalletUser);

  const pagination = normalizePagination(paginationRaw, fallbackLimit);
  if (!pagination.total && items.length) {
    pagination.total = items.length;
  }

  return {
    items,
    pagination,
    summary: normalizeSummary(
      summaryRaw,
      items,
      pagination.total || items.length
    ),
  };
}

/** GET /api/v1/wallet/users — Admin + Super Admin */
export async function fetchWalletUsers(
  params: WalletUsersListParams = {}
): Promise<WalletUsersListResult> {
  try {
    const client = getWalletUsersClient();
    const { data } = await client.get<WalletUsersApiEnvelope>(
      "/wallet/users",
      { params: buildListQuery(params) }
    );

    return parseWalletUsersResponse(data ?? {}, params.limit ?? 20);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/** GET /api/v1/wallet/users/:userId — Admin + Super Admin */
export async function fetchWalletUserDetails(
  userId: string
): Promise<WalletUser> {
  try {
    const client = getWalletUsersClient();
    const { data } = await client.get<
      ApiResponse<Record<string, unknown>> | Record<string, unknown>
    >(`/wallet/users/${userId}`);

    const raw =
      data && typeof data === "object" && "data" in data
        ? (((data as ApiResponse<Record<string, unknown>>).data as
            | Record<string, unknown>
            | undefined) ?? {})
        : ((data as Record<string, unknown>) ?? {});

    return normalizeWalletUser(raw);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Same wallet data as Wallet Management filters:
 * 1) GET /wallet/users/:userId
 * 2) fallback GET /wallet/users?role=&search= (match userId)
 */
export async function fetchWalletUserBalances(params: {
  userId: string;
  role?: string;
  search?: string;
}): Promise<WalletUser> {
  const { userId, role, search } = params;

  try {
    const details = await fetchWalletUserDetails(userId);
    if (
      details.mainWallet ||
      details.commissionWallet ||
      details.aepsWallet ||
      details.holdBalance ||
      details.frozenBalance
    ) {
      return details;
    }

    // Details returned but all zeros — still try list filter (may have split wallets)
    const listed = await fetchWalletUsers({
      page: 1,
      limit: 50,
      role: (role as WalletUsersListParams["role"]) || undefined,
      search: search?.trim() || undefined,
    });
    const match =
      listed.items.find((item) => item.userId === userId || item.id === userId) ||
      null;
    return match || details;
  } catch {
    const listed = await fetchWalletUsers({
      page: 1,
      limit: 50,
      role: (role as WalletUsersListParams["role"]) || undefined,
      search: search?.trim() || undefined,
    });
    const match = listed.items.find(
      (item) => item.userId === userId || item.id === userId
    );
    if (match) return match;
    throw new Error("Failed to load wallet balances for this user");
  }
}

/** POST /wallet/transfer — same payload as Transfer Balance pages */
export async function transferWalletBalance(payload: {
  receiverId: string;
  amount: number;
  description: string;
}) {
  try {
    const client = getWalletUsersClient();
    const { data } = await client.post<ApiResponse<unknown>>(
      "/wallet/transfer",
      buildWalletTransferPayload(payload)
    );
    return data?.data ?? data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/** POST /wallet/deduct — same payload builder as Deduct Balance pages */
export async function deductWalletBalance(payload: {
  userId?: string;
  receiverId?: string;
  amount: number;
  description: string;
}) {
  try {
    const client = getWalletUsersClient();
    const { data } = await client.post<ApiResponse<unknown>>(
      "/wallet/deduct",
      buildWalletDeductPayload(payload)
    );
    return data?.data ?? data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/** POST /wallet/hold — Lien / hold amount on target user (Admin / SA) */
export async function holdWalletBalance(payload: {
  userId: string;
  amount: number;
  reason: string;
  description?: string;
  type?: string;
}) {
  try {
    const client = getWalletUsersClient();
    const reason = (payload.reason || payload.description || "").trim();
    if (!reason) {
      throw new Error("Reason is required");
    }
    const { data } = await client.post<ApiResponse<unknown>>("/wallet/hold", {
      userId: payload.userId,
      amount: normalizeTransferAmount(payload.amount),
      reason,
      type: payload.type || "HOLD",
    });
    return data?.data ?? data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/** POST /wallet/release — Release held / lien amount */
export async function releaseWalletHold(payload: {
  userId: string;
  amount: number;
  reason?: string;
  description?: string;
  type?: string;
}) {
  try {
    const client = getWalletUsersClient();
    const reason = (payload.reason || payload.description || "").trim();
    const { data } = await client.post<ApiResponse<unknown>>(
      "/wallet/release",
      {
        userId: payload.userId,
        amount: normalizeTransferAmount(payload.amount),
        // Backend requires `type` — release of wallet hold / lien
        type: payload.type || "HOLD",
        ...(reason ? { reason } : {}),
      }
    );
    return data?.data ?? data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/** POST /wallet/freeze — freeze full available/main wallet amount */
export async function freezeWallet(payload: {
  userId: string;
  amount: number;
  reason?: string;
}) {
  try {
    const client = getWalletUsersClient();
    const amount = normalizeTransferAmount(payload.amount);
    const { data } = await client.post<ApiResponse<unknown>>("/wallet/freeze", {
      userId: payload.userId,
      amount,
      ...(payload.reason?.trim() ? { reason: payload.reason.trim() } : {}),
    });
    return data?.data ?? data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/** POST /wallet/unfreeze — release the previously frozen amount */
export async function unfreezeWallet(payload: {
  userId: string;
  amount: number;
  reason?: string;
}) {
  try {
    const client = getWalletUsersClient();
    const amount = normalizeTransferAmount(payload.amount);
    const { data } = await client.post<ApiResponse<unknown>>(
      "/wallet/unfreeze",
      {
        userId: payload.userId,
        amount,
        ...(payload.reason?.trim() ? { reason: payload.reason.trim() } : {}),
      }
    );
    return data?.data ?? data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
