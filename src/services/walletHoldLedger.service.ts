import { superAdminClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/messages";
import { WALLET_API } from "@/constants/walletApi";
import {
  WalletHoldLedgerQueryParams,
  WalletHoldLedgerResult,
  WalletHoldLedgerRow,
} from "@/types/walletHoldLedger";

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickStr(
  source: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function formatDateTime(raw?: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function normalizeWalletHoldLedgerRow(
  raw: unknown,
  index = 0
): WalletHoldLedgerRow {
  const obj = asRecord(raw);
  const user =
    obj.user && typeof obj.user === "object"
      ? asRecord(obj.user)
      : {};

  const createdAt = pickStr(obj, "createdAt", "dateTime", "date") || null;

  const name =
    pickStr(obj, "name", "userName", "fullName") ||
    [pickStr(user, "firstName"), pickStr(user, "lastName")]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    pickStr(user, "name") ||
    "—";

  return {
    id: String(obj.id ?? obj.ledgerId ?? `${createdAt || "row"}-${index}`),
    walletId: pickStr(obj, "walletId"),
    userId: pickStr(obj, "userId") || pickStr(user, "id"),
    name,
    phone:
      pickStr(obj, "phone", "mobile") ||
      pickStr(user, "phone", "mobile"),
    email: pickStr(obj, "email") || pickStr(user, "email"),
    role: String(
      pickStr(obj, "role", "userType") ||
        pickStr(user, "role", "userType") ||
        ""
    ).toUpperCase(),
    userCode: pickStr(obj, "userCode") || pickStr(user, "userCode"),
    type: String(
      pickStr(obj, "type", "entryType", "transactionType", "action") || "—"
    ).toUpperCase(),
    amount: toNumber(obj.amount ?? obj.txnAmount),
    openingFreezeBalance: toNumber(obj.openingFreezeBalance),
    closingFreezeBalance: toNumber(obj.closingFreezeBalance),
    openingHoldBalance: toNumber(
      obj.openingHoldBalance ?? obj.holdBalanceBefore
    ),
    closingHoldBalance: toNumber(
      obj.closingHoldBalance ?? obj.holdBalanceAfter
    ),
    openingAvailableBalance: toNumber(
      obj.openingAvailableBalance ?? obj.availableBalanceBefore
    ),
    closingAvailableBalance: toNumber(
      obj.closingAvailableBalance ?? obj.availableBalanceAfter
    ),
    reason: pickStr(obj, "reason", "remarks", "description", "message"),
    performedBy: pickStr(obj, "performedBy", "createdBy"),
    performedByRole: pickStr(
      obj,
      "performedByRole",
      "createdByRole",
      "actorRole"
    ),
    createdAt,
    dateTime: formatDateTime(createdAt),
  };
}

/** Parse `{ success, data: [...], pagination }` envelope */
function parseHoldLedgerResponse(
  response: unknown,
  fallback: { page: number; limit: number }
): WalletHoldLedgerResult {
  const root = asRecord(response);

  let rawItems: unknown[] = [];
  if (Array.isArray(response)) {
    rawItems = response;
  } else if (Array.isArray(root.data)) {
    rawItems = root.data;
  } else if (Array.isArray(root.items)) {
    rawItems = root.items;
  } else if (root.data && typeof root.data === "object") {
    const nested = asRecord(root.data);
    if (Array.isArray(nested.items)) rawItems = nested.items;
    else if (Array.isArray(nested.data)) rawItems = nested.data;
  }

  const items = rawItems.map((row, index) =>
    normalizeWalletHoldLedgerRow(row, index)
  );

  const meta = asRecord(
    root.pagination ??
      root.meta ??
      asRecord(root.data).pagination ??
      asRecord(root.data).meta
  );

  const page = toNumber(meta.page ?? root.page ?? fallback.page) || 1;
  const limit =
    toNumber(meta.limit ?? meta.pageSize ?? root.limit ?? fallback.limit) ||
    fallback.limit;
  const total = toNumber(meta.total ?? root.total ?? items.length);
  const totalPages =
    toNumber(meta.totalPages ?? root.totalPages) ||
    Math.max(1, Math.ceil((total || items.length) / limit) || 1);

  return {
    items,
    pagination: {
      page,
      limit,
      total: total || items.length,
      totalPages,
    },
  };
}

const FETCH_LIMIT = 100;
const MAX_PAGES = 50;

function isHoldEntry(row: WalletHoldLedgerRow): boolean {
  const type = (row.type || "").toUpperCase();
  return type === "HOLD" || type === "RELEASE" || type === "LIEN";
}

async function requestLedgerPage(
  endpoint: string,
  query: {
    page: number;
    limit: number;
    search?: string;
  }
): Promise<WalletHoldLedgerResult> {
  const params: Record<string, string | number> = {
    page: query.page,
    limit: query.limit,
  };
  // Do not send `type` — API rejects unknown enum values on these ledgers.
  if (query.search?.trim()) params.search = query.search.trim();

  const { data } = await superAdminClient.get<unknown>(endpoint, { params });

  return parseHoldLedgerResponse(data, {
    page: query.page,
    limit: query.limit,
  });
}

async function fetchLedgerWithOptionalTypeFilter(
  endpoint: string,
  params: WalletHoldLedgerQueryParams,
  filterFn?: (row: WalletHoldLedgerRow) => boolean
): Promise<WalletHoldLedgerResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  if (!filterFn) {
    return requestLedgerPage(endpoint, {
      page,
      limit,
      search: params.search,
    });
  }

  const all: WalletHoldLedgerRow[] = [];
  let apiPage = 1;
  let totalPages = 1;

  do {
    const result = await requestLedgerPage(endpoint, {
      page: apiPage,
      limit: FETCH_LIMIT,
      search: params.search,
    });
    all.push(...result.items);
    totalPages = Math.max(1, result.pagination.totalPages);
    apiPage += 1;
  } while (apiPage <= totalPages && apiPage <= MAX_PAGES);

  const filtered = all.filter(filterFn);
  const total = filtered.length;
  const totalPagesFiltered = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(Math.max(1, page), totalPagesFiltered);
  const start = (safePage - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages: totalPagesFiltered,
    },
  };
}

/**
 * GET /api/v1/wallet/hold/ledger — Super Admin hold ledger
 */
export async function fetchWalletHoldLedger(
  params: WalletHoldLedgerQueryParams = {}
): Promise<WalletHoldLedgerResult> {
  try {
    const wantedType = params.type?.trim().toUpperCase() || "";
    return await fetchLedgerWithOptionalTypeFilter(
      WALLET_API.holdLedger,
      params,
      wantedType === "HOLD" ? isHoldEntry : undefined
    );
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * GET /api/v1/wallet/freeze/ledger — Super Admin freeze ledger
 */
export async function fetchWalletFreezeLedger(
  params: WalletHoldLedgerQueryParams = {}
): Promise<WalletHoldLedgerResult> {
  try {
    // Dedicated freeze ledger API — use server pagination as-is
    return await requestLedgerPage(WALLET_API.freezeLedger, {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
    });
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
