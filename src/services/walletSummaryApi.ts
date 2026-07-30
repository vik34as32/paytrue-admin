import { adminClient, superAdminClient } from "@/lib/api/client";
import { WALLET_API } from "@/constants/walletApi";
import {
  getPublicNetworkUsers,
  type PublicNetworkUser,
} from "@/services/publicNetworkUsersApi";
import { ApiResponse } from "@/types";
import {
  WalletSummaryActivityRecord,
  WalletSummaryHeader,
  WalletSummaryPageResult,
  WalletSummaryQueryParams,
  WalletSummaryScope,
  WalletSummaryUserOption,
  WalletSummaryUserType,
} from "@/types/walletSummary";

function parseAmount(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalAmount(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveName(user: {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  fullName?: string;
}): string {
  if (user.fullName?.trim()) return user.fullName.trim();
  if (user.name?.trim()) return user.name.trim();
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  return user.email || "—";
}

function mapPublicNetworkUserOption(
  user: PublicNetworkUser,
  fallbackType: WalletSummaryUserType
): WalletSummaryUserOption {
  const isRetailer =
    ((user.userType as string) || fallbackType) === "RETAILER";
  const displayName = isRetailer
    ? user.firstName?.trim() ||
      user.fullName?.trim()?.split(/\s+/)[0] ||
      resolveName(user)
    : resolveName(user);

  return {
    id: user.id,
    name: displayName,
    userCode: user.userCode,
    email: user.email,
    mobile: user.mobile,
    userType: (user.userType as string) || fallbackType,
    walletBalance: Number(user.walletBalance ?? user.balance ?? 0),
    status: user.status,
  };
}

function mapSummaryListItem(
  raw: Record<string, unknown>
): WalletSummaryUserOption {
  const role = String(raw.role ?? raw.userType ?? "");
  const firstName =
    typeof raw.firstName === "string" ? raw.firstName.trim() : "";
  const lastName = typeof raw.lastName === "string" ? raw.lastName.trim() : "";
  const full =
    (typeof raw.name === "string" && raw.name.trim()) ||
    [firstName, lastName].filter(Boolean).join(" ").trim();
  const name =
    role === "RETAILER"
      ? firstName || full.split(/\s+/)[0] || "—"
      : full || "—";

  return {
    id: String(raw.userId ?? raw.id ?? ""),
    name,
    userCode: (raw.userCode as string | undefined) ?? undefined,
    email: (raw.email as string | undefined) ?? undefined,
    mobile: (raw.mobile as string | undefined) ?? undefined,
    userType: role,
    walletBalance: Number(
      raw.mainWallet ?? raw.walletBalance ?? raw.availableBalance ?? 0
    ),
    status: (raw.status as string | undefined) ?? undefined,
  };
}

function mapNetworkUsers(payload: Record<string, unknown>): WalletSummaryUserOption[] {
  const users = Array.isArray(payload.users) ? payload.users : [];
  return users
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map(mapSummaryListItem)
    .filter((u) => u.id)
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

/**
 * GET /api/v1/wallet/summaries?userType=ALL|ADMIN|RETAILER|...
 * Production shape: { scope, filters, users[], transactions[], meta, viewedBy }
 */
export async function fetchNetworkWalletSummaries(
  scope: WalletSummaryScope,
  userType: WalletSummaryUserType,
  params: WalletSummaryQueryParams = {}
): Promise<WalletSummaryPageResult> {
  const client = scope === "super_admin" ? superAdminClient : adminClient;
  const pageSize = Math.min(params.pageSize ?? params.limit ?? 20, 100);
  const operationType =
    params.type && params.type !== "ALL" ? params.type : undefined;

  const { data } = await client.get<ApiResponse<unknown>>(WALLET_API.summaries, {
    params: {
      userType: userType === "ALL" ? "ALL" : userType,
      page: params.page ?? 1,
      limit: pageSize,
      sortBy: params.sortBy || "createdAt",
      sortOrder: params.sortOrder || "desc",
      ...(operationType
        ? { type: operationType, transactionType: operationType }
        : {}),
      status: params.status || undefined,
      startDate: params.startDate || params.fromDate || undefined,
      endDate: params.endDate || params.toDate || undefined,
      search: params.search || undefined,
    },
  });

  const payload =
    data?.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : {};

  const transactions = (
    Array.isArray(payload.transactions) ? payload.transactions : []
  )
    .map(normalizeActivityRecord)
    .sort((a, b) => {
      const order = (params.sortOrder || "desc") === "asc" ? 1 : -1;
      const av = new Date(a.createdAt || 0).getTime();
      const bv = new Date(b.createdAt || 0).getTime();
      if (av === bv) return 0;
      return av > bv ? order : -order;
    });

  const meta =
    payload.meta && typeof payload.meta === "object"
      ? (payload.meta as Record<string, unknown>)
      : {};
  const scopeInfo =
    payload.scope && typeof payload.scope === "object"
      ? (payload.scope as Record<string, unknown>)
      : {};

  const total = Number(meta.total ?? transactions.length) || transactions.length;
  const limit = Number(meta.limit ?? pageSize) || pageSize;
  const page = Number(meta.page ?? params.page ?? 1) || 1;
  const totalPages =
    Number(meta.totalPages) ||
    Math.max(1, Math.ceil(total / Math.max(limit, 1)));

  const users = mapNetworkUsers(payload);

  return {
    data: transactions,
    total,
    page,
    pageSize: limit,
    totalPages,
    users,
    header: {
      scopeUserType: String(scopeInfo.userType ?? userType),
      scopeUserCount: Number(scopeInfo.userCount ?? users.length) || users.length,
      totalCreditAmount: transactions
        .filter((t) => formatOp(t.operationType) === "CREDIT")
        .reduce((s, t) => s + t.amount, 0),
      totalDeductAmount: transactions
        .filter((t) => formatOp(t.operationType) === "DEDUCT")
        .reduce((s, t) => s + t.amount, 0),
      totalCreditCount: transactions.filter(
        (t) => formatOp(t.operationType) === "CREDIT"
      ).length,
      totalDeductCount: transactions.filter(
        (t) => formatOp(t.operationType) === "DEDUCT"
      ).length,
    },
  };
}

function formatOp(type?: string): string {
  const upper = (type || "").toUpperCase();
  if (upper.includes("DEDUCT") || upper.includes("DEBIT")) return "DEDUCT";
  if (upper.includes("CREDIT") || upper.includes("ADD") || upper === "TRANSFER")
    return "CREDIT";
  return upper || "—";
}

/** Loads users for dropdown from /wallet/summaries `users` array */
export async function fetchWalletSummaryUsers(
  scope: WalletSummaryScope,
  userType: WalletSummaryUserType
): Promise<WalletSummaryUserOption[]> {
  try {
    const result = await fetchNetworkWalletSummaries(scope, userType, {
      page: 1,
      pageSize: 100,
      sortBy: "createdAt",
      sortOrder: "asc",
    });
    if (result.users && result.users.length > 0) return result.users;
  } catch {
    // fall through
  }

  if (userType === "ADMIN") {
    const users = await getPublicNetworkUsers("ADMIN");
    return users.map((user) => mapPublicNetworkUserOption(user, "ADMIN"));
  }

  if (userType === "ALL") {
    const users = await getPublicNetworkUsers();
    return users.map((user) =>
      mapPublicNetworkUserOption(
        user,
        (user.userType as WalletSummaryUserType) || "RETAILER"
      )
    );
  }

  const users = await getPublicNetworkUsers(userType);
  return users.map((user) => mapPublicNetworkUserOption(user, userType));
}

function readNestedPerson(
  value: unknown
): { name?: string; role?: string; code?: string } | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  const firstName = obj.firstName as string | undefined;
  const lastName = obj.lastName as string | undefined;
  const full = [firstName, lastName].filter(Boolean).join(" ");
  return {
    name:
      (obj.name as string | undefined) ||
      full ||
      (obj.fullName as string | undefined),
    role:
      (obj.userType as string | undefined) ||
      (obj.role as string | undefined) ||
      (obj.performedByRole as string | undefined),
    code:
      (obj.userCode as string | undefined) ||
      (obj.code as string | undefined),
  };
}

function normalizeActivityRecord(raw: unknown): WalletSummaryActivityRecord {
  if (!raw || typeof raw !== "object") {
    return { id: "", amount: 0 };
  }

  const obj = raw as Record<string, unknown>;
  const performer =
    readNestedPerson(obj.performedBy) ||
    readNestedPerson(obj.performer) ||
    readNestedPerson(obj.actionBy) ||
    readNestedPerson(obj.admin);

  const target =
    obj.targetUser && typeof obj.targetUser === "object"
      ? (obj.targetUser as Record<string, unknown>)
      : obj.user && typeof obj.user === "object"
        ? (obj.user as Record<string, unknown>)
        : undefined;

  return {
    id: String(obj.id ?? obj._id ?? obj.transactionId ?? obj.reference ?? ""),
    reference:
      (obj.reference as string | undefined) ||
      (obj.referenceNumber as string | undefined) ||
      (obj.transactionId as string | undefined),
    amount: parseAmount(obj.amount ?? obj.topupAmount ?? obj.addedAmount),
    status: (obj.status as string | undefined) ?? undefined,
    operationType:
      (obj.operationType as string | undefined) ||
      (obj.type as string | undefined) ||
      (obj.transactionType as string | undefined),
    remarks:
      (obj.remarks as string | undefined) ||
      (obj.description as string | undefined),
    message: (obj.message as string | undefined) ?? undefined,
    performedByName:
      (obj.performedByName as string | undefined) ||
      performer?.name,
    performedByRole:
      (obj.performedByRole as string | undefined) ||
      performer?.role,
    performedByCode:
      (obj.performedByCode as string | undefined) ||
      performer?.code,
    fundRequestRef:
      (obj.fundRequestRef as string | undefined) ||
      (obj.fundRequestReference as string | undefined) ||
      (typeof obj.fundRequest === "object" && obj.fundRequest
        ? ((obj.fundRequest as Record<string, unknown>).reference as
            | string
            | undefined)
        : undefined),
    previousBalance: parseOptionalAmount(
      obj.previousBalance ?? obj.openingBalance ?? obj.balanceBefore
    ),
    updatedBalance: parseOptionalAmount(
      obj.updatedBalance ??
        obj.closingBalance ??
        obj.currentBalance ??
        obj.balanceAfter
    ),
    createdAt: (obj.createdAt as string | undefined) ?? undefined,
    date: (obj.date as string | undefined) ?? undefined,
    time: (obj.time as string | undefined) ?? undefined,
    targetUserId: target?.id ? String(target.id) : undefined,
    targetUserName: target
      ? resolveName({
          name: target.name as string | undefined,
          firstName: target.firstName as string | undefined,
          lastName: target.lastName as string | undefined,
          email: target.email as string | undefined,
        })
      : undefined,
    targetUserCode: (target?.userCode as string | undefined) ?? undefined,
    targetUserRole: String(
      target?.role ?? target?.userType ?? target?.roleLabel ?? ""
    ) || undefined,
    targetUserMobile: (target?.mobile as string | undefined) ?? undefined,
  };
}

function normalizeHeader(
  payload: Record<string, unknown>,
  userId: string
): WalletSummaryHeader | null {
  const user =
    payload.user && typeof payload.user === "object"
      ? (payload.user as Record<string, unknown>)
      : payload.targetUser && typeof payload.targetUser === "object"
        ? (payload.targetUser as Record<string, unknown>)
        : undefined;

  const summary =
    payload.summary && typeof payload.summary === "object"
      ? (payload.summary as Record<string, unknown>)
      : payload;

  const name = user
    ? resolveName({
        name: user.name as string | undefined,
        firstName: user.firstName as string | undefined,
        lastName: user.lastName as string | undefined,
        email: user.email as string | undefined,
      })
    : (payload.name as string | undefined);

  const currentBalance =
    parseOptionalAmount(summary.currentWalletBalance) ??
    parseOptionalAmount(summary.currentBalance) ??
    parseOptionalAmount(summary.walletBalance) ??
    parseOptionalAmount(user?.walletBalance) ??
    parseOptionalAmount(
      user?.wallet && typeof user.wallet === "object"
        ? (user.wallet as Record<string, unknown>).balance
        : undefined
    );

  if (!name && currentBalance === undefined && !user) {
    return {
      userId,
      currentBalance: parseOptionalAmount(summary.currentWalletBalance),
      totalCreditAmount: parseOptionalAmount(
        summary.totalCreditAmount ?? summary.totalCredit
      ),
      totalDeductAmount: parseOptionalAmount(
        summary.totalDeductAmount ?? summary.totalDeduct
      ),
      totalCreditCount: parseOptionalAmount(
        summary.totalCreditCount ?? summary.creditCount
      ),
      totalDeductCount: parseOptionalAmount(
        summary.totalDeductCount ?? summary.deductCount
      ),
    };
  }

  return {
    userId: String(user?.id ?? userId),
    name,
    userCode: (user?.userCode as string | undefined) ?? undefined,
    email: (user?.email as string | undefined) ?? undefined,
    mobile: (user?.mobile as string | undefined) ?? undefined,
    userType: (user?.userType as string | undefined) ?? undefined,
    city: (user?.city as string | undefined) ?? undefined,
    state: (user?.state as string | undefined) ?? undefined,
    currentBalance,
    totalCreditAmount: parseOptionalAmount(
      summary.totalCreditAmount ?? summary.totalCredit
    ),
    totalDeductAmount: parseOptionalAmount(
      summary.totalDeductAmount ?? summary.totalDeduct
    ),
    totalCreditCount: parseOptionalAmount(
      summary.totalCreditCount ?? summary.creditCount
    ),
    totalDeductCount: parseOptionalAmount(
      summary.totalDeductCount ?? summary.deductCount
    ),
  };
}

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of [
    "items",
    "transactions",
    "history",
    "records",
    "data",
    "walletHistory",
  ]) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }
  return [];
}

function extractMeta(payload: unknown): {
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
} {
  if (!payload || typeof payload !== "object") return {};
  const obj = payload as Record<string, unknown>;
  const meta =
    obj.meta && typeof obj.meta === "object"
      ? (obj.meta as Record<string, unknown>)
      : obj.pagination && typeof obj.pagination === "object"
        ? (obj.pagination as Record<string, unknown>)
        : obj;

  return {
    total: parseOptionalAmount(meta.total),
    page: parseOptionalAmount(meta.page),
    pageSize: parseOptionalAmount(
      meta.pageSize ?? meta.limit ?? meta.perPage
    ),
    totalPages: parseOptionalAmount(meta.totalPages),
  };
}

function toQueryParams(params: WalletSummaryQueryParams) {
  const pageSize = params.pageSize ?? params.limit ?? 10;
  // Backend validates `transactionType` as CREDIT | DEDUCT (not ALL / DEBIT).
  // Omit when "ALL" so the enum check is not triggered.
  const operationType =
    params.type && params.type !== "ALL" ? params.type : undefined;

  return {
    page: params.page ?? 1,
    pageSize,
    limit: pageSize,
    ...(operationType
      ? { type: operationType, transactionType: operationType }
      : {}),
    status: params.status || undefined,
    startDate: params.startDate || params.fromDate || undefined,
    endDate: params.endDate || params.toDate || undefined,
    fromDate: params.fromDate || params.startDate || undefined,
    toDate: params.toDate || params.endDate || undefined,
    search: params.search || undefined,
    sortBy: params.sortBy || "createdAt",
    sortOrder: params.sortOrder || "desc",
  };
}

export async function getUserWalletSummary(
  userId: string,
  params: WalletSummaryQueryParams = {},
  scope: WalletSummaryScope = "admin"
): Promise<WalletSummaryPageResult> {
  const client = scope === "super_admin" ? superAdminClient : adminClient;
  const { data } = await client.get<ApiResponse<unknown>>(
    `${WALLET_API.summary}/${userId}`,
    { params: toQueryParams(params) }
  );

  const payload = data.data;
  const sortOrder = (params.sortOrder || "desc") === "asc" ? 1 : -1;
  const items = extractItems(payload)
    .map(normalizeActivityRecord)
    .sort((a, b) => {
      const av = new Date(a.createdAt || 0).getTime();
      const bv = new Date(b.createdAt || 0).getTime();
      if (av === bv) return 0;
      return av > bv ? sortOrder : -sortOrder;
    });
  const meta = extractMeta(payload);
  const pageSize = meta.pageSize ?? params.pageSize ?? 10;
  const total = meta.total ?? items.length;
  const header =
    payload && typeof payload === "object"
      ? normalizeHeader(payload as Record<string, unknown>, userId)
      : null;

  return {
    data: items,
    total,
    page: meta.page ?? params.page ?? 1,
    pageSize,
    totalPages:
      meta.totalPages ?? Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    header,
  };
}

export async function fetchAllUserWalletSummaryPages(
  userId: string,
  params: Omit<WalletSummaryQueryParams, "page" | "pageSize" | "limit">,
  scope: WalletSummaryScope
): Promise<{ records: WalletSummaryActivityRecord[]; header?: WalletSummaryHeader | null }> {
  const first = await getUserWalletSummary(
    userId,
    { ...params, page: 1, pageSize: 100 },
    scope
  );
  const all = [...first.data];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await getUserWalletSummary(
      userId,
      { ...params, page, pageSize: first.pageSize },
      scope
    );
    all.push(...next.data);
  }
  return { records: all, header: first.header };
}
