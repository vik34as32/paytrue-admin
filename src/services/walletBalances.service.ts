import { adminClient, superAdminClient } from "@/lib/api/client";
import { STORAGE_KEYS } from "@/constants/storage";
import { getErrorMessage } from "@/lib/api/messages";
import { ApiResponse } from "@/types";
import {
  WalletBalanceRow,
  WalletBalancesPagination,
  WalletBalancesQuery,
  WalletBalancesResult,
  WalletBalancesStats,
  WalletSummaryDetail,
} from "@/types/walletBalances";

function getClient() {
  if (typeof window === "undefined") return adminClient;
  const adminToken =
    localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  if (adminToken) return adminClient;
  return superAdminClient;
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function emptyStats(): WalletBalancesStats {
  return {
    totalWalletBalance: 0,
    totalCommissionWallet: 0,
    totalCommissionEarned: 0,
    usersCount: 0,
    activeUsers: 0,
  };
}

function normalizePagination(
  raw: Record<string, unknown> | undefined,
  fallbackLimit: number
): WalletBalancesPagination {
  const total = toNumber(raw?.total);
  const page = toNumber(raw?.page) || 1;
  const limit = toNumber(raw?.limit ?? raw?.pageSize) || fallbackLimit;
  const totalPages =
    toNumber(raw?.totalPages) ||
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
  return { total, page, limit, totalPages };
}

function normalizeRow(raw: Record<string, unknown>): WalletBalanceRow {
  const firstName = typeof raw.firstName === "string" ? raw.firstName : "";
  const lastName = typeof raw.lastName === "string" ? raw.lastName : "";
  const name =
    (typeof raw.name === "string" && raw.name.trim()) ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    "—";

  const wallet =
    raw.wallet && typeof raw.wallet === "object"
      ? (raw.wallet as Record<string, unknown>)
      : null;

  return {
    userId: String(raw.userId ?? raw.id ?? ""),
    userCode: (raw.userCode as string | null) ?? null,
    name,
    email: (raw.email as string | null) ?? null,
    mobile: (raw.mobile as string | null) ?? null,
    role: String(raw.role ?? raw.userType ?? ""),
    status: String(raw.status ?? "PENDING"),
    mainWallet: toNumber(
      raw.mainWallet ??
        raw.walletBalance ??
        raw.balance ??
        wallet?.balance
    ),
    commissionWallet: toNumber(
      raw.commissionWallet ?? raw.commissionWalletBalance
    ),
    totalCommissionEarned: toNumber(
      raw.totalCommissionEarned ?? raw.commissionEarned
    ),
    lastWalletUpdated:
      (raw.lastWalletUpdated as string | null) ??
      (raw.walletUpdatedAt as string | null) ??
      (wallet?.updatedAt as string | null) ??
      (raw.updatedAt as string | null) ??
      (raw.createdAt as string | null) ??
      null,
    avatarUrl:
      (raw.avatarUrl as string | null) ??
      (raw.avatar as string | null) ??
      null,
    currency: String(raw.currency ?? wallet?.currency ?? "INR"),
  };
}

function normalizeStats(
  raw: unknown,
  items: WalletBalanceRow[],
  total: number
): WalletBalancesStats {
  if (raw && typeof raw === "object") {
    const s = raw as Record<string, unknown>;
    return {
      totalWalletBalance: toNumber(
        s.totalWalletBalance ?? s.totalMainWalletBalance
      ),
      totalCommissionWallet: toNumber(
        s.totalCommissionWallet ?? s.totalCommissionWalletBalance
      ),
      totalCommissionEarned: toNumber(s.totalCommissionEarned),
      usersCount: toNumber(s.usersCount ?? s.totalUsers ?? total),
      activeUsers: toNumber(
        s.activeUsers ??
          items.filter((i) => i.status.toUpperCase() === "ACTIVE").length
      ),
    };
  }

  return {
    ...emptyStats(),
    usersCount: total,
    activeUsers: items.filter((i) => i.status.toUpperCase() === "ACTIVE")
      .length,
    totalWalletBalance: items.reduce((sum, i) => sum + i.mainWallet, 0),
    totalCommissionWallet: items.reduce(
      (sum, i) => sum + i.commissionWallet,
      0
    ),
    totalCommissionEarned: items.reduce(
      (sum, i) => sum + i.totalCommissionEarned,
      0
    ),
  };
}

function buildQuery(params: WalletBalancesQuery) {
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
  return query;
}

function parseListPayload(
  envelope: Record<string, unknown>,
  limit: number
): WalletBalancesResult {
  const dataNode = envelope.data;
  let rawItems: unknown[] = [];
  let paginationRaw =
    (envelope.pagination as Record<string, unknown> | undefined) ??
    (envelope.meta as Record<string, unknown> | undefined);
  let statsRaw: unknown = envelope.stats ?? envelope.summary;
  let permissions: WalletBalancesResult["permissions"] | undefined;

  if (Array.isArray(envelope.items)) {
    rawItems = envelope.items;
  } else if (Array.isArray(dataNode)) {
    // Live GET /wallet/users: { data: User[], pagination }
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
    statsRaw = nested.stats ?? nested.summary ?? statsRaw;
    if (nested.permissions && typeof nested.permissions === "object") {
      permissions = nested.permissions as WalletBalancesResult["permissions"];
    }
  } else if (Array.isArray(envelope.users)) {
    rawItems = envelope.users;
  }

  if (
    !permissions &&
    envelope.permissions &&
    typeof envelope.permissions === "object"
  ) {
    permissions = envelope.permissions as WalletBalancesResult["permissions"];
  }

  const items = rawItems
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map(normalizeRow);

  const pagination = normalizePagination(paginationRaw, limit);
  if (!pagination.total && items.length) {
    pagination.total = items.length;
  }

  return {
    items,
    pagination,
    stats: normalizeStats(statsRaw, items, pagination.total || items.length),
    permissions,
  };
}

/**
 * Prefer GET /api/v1/wallet/users (Admin + Super Admin).
 * Falls back to GET /api/v1/users/wallet-balances if needed.
 */
export async function fetchWalletBalances(
  params: WalletBalancesQuery = {}
): Promise<WalletBalancesResult> {
  const client = getClient();
  const query = buildQuery(params);
  const limit = Number(query.limit) || 20;

  try {
    let envelope: Record<string, unknown> = {};

    try {
      const { data } = await client.get<Record<string, unknown>>(
        "/wallet/users",
        { params: query }
      );
      envelope = (data as Record<string, unknown>) ?? {};
    } catch {
      const { data } = await client.get<
        ApiResponse<Record<string, unknown>> | Record<string, unknown>
      >("/users/wallet-balances", { params: query });
      envelope =
        data && typeof data === "object" && "data" in data
          ? {
              ...((data as ApiResponse<Record<string, unknown>>).data ?? {}),
              ...(typeof data === "object" ? (data as Record<string, unknown>) : {}),
            }
          : ((data as Record<string, unknown>) ?? {});
    }

    return parseListPayload(envelope, limit);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

function normalizeSummary(raw: Record<string, unknown>): WalletSummaryDetail {
  const row = normalizeRow(raw);
  const wallet =
    raw.wallet && typeof raw.wallet === "object"
      ? (raw.wallet as Record<string, unknown>)
      : null;

  const user =
    raw.user && typeof raw.user === "object"
      ? (raw.user as Record<string, unknown>)
      : null;

  if (user) {
    const fromUser = normalizeRow({ ...raw, ...user });
    return {
      ...fromUser,
      mainWallet: toNumber(
        raw.mainWallet ?? wallet?.balance ?? fromUser.mainWallet
      ),
      commissionWallet: toNumber(
        raw.commissionWallet ?? fromUser.commissionWallet
      ),
      totalCommissionEarned: toNumber(
        raw.totalCommissionEarned ?? fromUser.totalCommissionEarned
      ),
      holdBalance: toNumber(raw.holdBalance ?? wallet?.holdAmount),
      availableBalance: toNumber(raw.availableBalance),
      currency: String(raw.currency ?? wallet?.currency ?? "INR"),
    };
  }

  return {
    ...row,
    holdBalance: toNumber(raw.holdBalance ?? wallet?.holdAmount),
    availableBalance: toNumber(raw.availableBalance),
  };
}

/**
 * GET /api/v1/users/:userId/wallet-summary
 * Falls back to GET /api/v1/wallet/users/:userId
 */
export async function fetchWalletSummary(
  userId: string
): Promise<WalletSummaryDetail> {
  const client = getClient();

  try {
    let payload: Record<string, unknown> = { userId };

    try {
      const { data } = await client.get<
        ApiResponse<Record<string, unknown>> | Record<string, unknown>
      >(`/users/${userId}/wallet-summary`);
      payload =
        data && typeof data === "object" && "data" in data
          ? ((data as ApiResponse<Record<string, unknown>>).data ?? {
              userId,
            })
          : ((data as Record<string, unknown>) ?? { userId });
    } catch {
      const { data } = await client.get<ApiResponse<Record<string, unknown>>>(
        `/wallet/users/${userId}`
      );
      payload = data?.data ?? { userId };
    }

    return normalizeSummary(payload);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
