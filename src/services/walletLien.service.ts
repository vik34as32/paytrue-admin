import { AxiosError } from "axios";
import { superAdminModuleClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/messages";
import { ApiResponse } from "@/types";
import {
  ApplyWalletLienPayload,
  ReleaseWalletLienPayload,
  WalletLienDetail,
  WalletLienHistoryItem,
  WalletLienListParams,
  WalletLienListResult,
  WalletLienRecord,
  WalletLienSummaryStats,
} from "@/types/walletLien";

const BASE = "/main-wallet-lien";

export class WalletLienApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "WalletLienApiError";
    this.status = status;
  }
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function emptyStats(): WalletLienSummaryStats {
  return {
    totalActiveLiens: 0,
    totalReleasedLiens: 0,
    totalLienAmount: 0,
    totalAvailableBalanceUnderHold: 0,
  };
}

function normalizeRecord(raw: Record<string, unknown>): WalletLienRecord {
  const user =
    raw.user && typeof raw.user === "object"
      ? (raw.user as Record<string, unknown>)
      : null;
  const wallet =
    raw.wallet && typeof raw.wallet === "object"
      ? (raw.wallet as Record<string, unknown>)
      : null;

  const mainWalletBalance = toNumber(
    raw.mainWalletBalance ??
      raw.walletBalance ??
      wallet?.balance ??
      wallet?.mainWalletBalance
  );
  const lienAmount = toNumber(
    raw.lienAmount ?? raw.amount ?? raw.holdAmount ?? wallet?.holdAmount
  );
  const remainingAmount = toNumber(
    raw.remainingAmount ?? raw.remainingLienAmount ?? lienAmount
  );
  const availableBalance = toNumber(
    raw.availableBalance ??
      (mainWalletBalance > 0
        ? Math.max(0, mainWalletBalance - remainingAmount)
        : raw.availableBalance)
  );

  const userName =
    (raw.userName as string) ||
    (user?.name as string) ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "—";

  const createdByObj =
    raw.createdBy && typeof raw.createdBy === "object"
      ? (raw.createdBy as Record<string, unknown>)
      : null;
  const releasedByObj =
    raw.releasedBy && typeof raw.releasedBy === "object"
      ? (raw.releasedBy as Record<string, unknown>)
      : null;

  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? user?.id ?? ""),
    userName,
    mobile:
      (raw.mobile as string) ||
      (user?.mobile as string) ||
      null,
    role: String(
      raw.role ?? raw.userType ?? user?.userType ?? user?.role ?? ""
    ),
    userCode:
      (raw.userCode as string) ||
      (user?.userCode as string) ||
      null,
    mainWalletBalance,
    lienAmount,
    remainingAmount,
    availableBalance,
    status: String(raw.status ?? "ACTIVE"),
    reason: (raw.reason as string) || null,
    remarks: (raw.remarks as string) || null,
    createdBy:
      (raw.createdByName as string) ||
      (createdByObj?.name as string) ||
      (typeof raw.createdBy === "string" ? raw.createdBy : null),
    createdById:
      (raw.createdById as string) ||
      (createdByObj?.id as string) ||
      null,
    releasedBy:
      (raw.releasedByName as string) ||
      (releasedByObj?.name as string) ||
      (typeof raw.releasedBy === "string" ? raw.releasedBy : null),
    createdAt: (raw.createdAt as string) || null,
    releasedAt: (raw.releasedAt as string) || null,
    updatedAt: (raw.updatedAt as string) || undefined,
  };
}

function normalizeHistory(raw: unknown): WalletLienHistoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((item) => {
      const performer =
        item.performedBy && typeof item.performedBy === "object"
          ? (item.performedBy as Record<string, unknown>)
          : null;
      return {
        id: String(item.id ?? `${item.action}-${item.createdAt}`),
        date: (item.date as string) || (item.createdAt as string) || null,
        action: String(item.action ?? item.type ?? "—"),
        amount: toNumber(item.amount),
        remainingAmount: toNumber(item.remainingAmount),
        status: String(item.status ?? ""),
        performedBy:
          (item.performedByName as string) ||
          (performer?.name as string) ||
          (typeof item.performedBy === "string" ? item.performedBy : null),
        remarks: (item.remarks as string) || null,
      };
    });
}

function normalizeStats(
  raw: unknown,
  items: WalletLienRecord[]
): WalletLienSummaryStats {
  if (raw && typeof raw === "object") {
    const s = raw as Record<string, unknown>;
    return {
      totalActiveLiens: toNumber(
        s.totalActiveLiens ?? s.activeCount ?? s.active
      ),
      totalReleasedLiens: toNumber(
        s.totalReleasedLiens ?? s.releasedCount ?? s.released
      ),
      totalLienAmount: toNumber(
        s.totalLienAmount ?? s.totalAmount ?? s.totalHold
      ),
      totalAvailableBalanceUnderHold: toNumber(
        s.totalAvailableBalanceUnderHold ??
          s.totalHoldBalance ??
          s.totalAvailableUnderHold
      ),
    };
  }

  const active = items.filter((i) => i.status.toUpperCase() === "ACTIVE");
  const released = items.filter((i) =>
    ["RELEASED", "PARTIALLY_RELEASED"].includes(i.status.toUpperCase())
  );
  return {
    totalActiveLiens: active.length,
    totalReleasedLiens: released.filter(
      (i) => i.status.toUpperCase() === "RELEASED"
    ).length,
    totalLienAmount: items.reduce((sum, i) => sum + i.remainingAmount, 0),
    totalAvailableBalanceUnderHold: items.reduce(
      (sum, i) => sum + i.remainingAmount,
      0
    ),
  };
}

function unwrapError(error: unknown): never {
  if (error instanceof WalletLienApiError) throw error;

  const message = getErrorMessage(error);
  const status =
    error instanceof AxiosError
      ? error.response?.status
      : /permission|forbidden|403/i.test(message)
        ? 403
        : undefined;

  throw new WalletLienApiError(message, status);
}

function buildQuery(params: WalletLienListParams) {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.status) query.status = params.status;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortOrder) query.sortOrder = params.sortOrder;
  if (params.fromDate) {
    query.fromDate = params.fromDate;
    query.startDate = params.fromDate;
  }
  if (params.toDate) {
    query.toDate = params.toDate;
    query.endDate = params.toDate;
  }
  if (params.userId) query.userId = params.userId;
  return query;
}

/** GET /api/v1/super-admin/main-wallet-lien */
export async function fetchWalletLiens(
  params: WalletLienListParams = {}
): Promise<WalletLienListResult> {
  try {
    const { data } = await superAdminModuleClient.get<
      ApiResponse<Record<string, unknown>> | Record<string, unknown>
    >(BASE, { params: buildQuery(params) });

    const payload =
      data && typeof data === "object" && "data" in data
        ? ((data as ApiResponse<Record<string, unknown>>).data ?? {})
        : ((data as Record<string, unknown>) ?? {});

    const rawItems = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.liens)
          ? payload.liens
          : [];

    const items = rawItems
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .map(normalizeRecord);

    const meta =
      (payload.pagination as Record<string, unknown> | undefined) ||
      (payload.meta as Record<string, unknown> | undefined) ||
      {};

    const total = toNumber(meta.total ?? payload.total ?? items.length);
    const page = toNumber(meta.page ?? params.page ?? 1) || 1;
    const pageSize =
      toNumber(meta.limit ?? meta.pageSize ?? params.limit ?? 20) || 20;

    return {
      items,
      total,
      page,
      pageSize,
      totalPages:
        toNumber(meta.totalPages) ||
        Math.max(1, Math.ceil(total / pageSize)),
      stats: normalizeStats(payload.stats ?? payload.summary, items),
    };
  } catch (error) {
    unwrapError(error);
  }
}

/** GET /api/v1/super-admin/main-wallet-lien/:id */
export async function fetchWalletLienById(
  id: string
): Promise<WalletLienDetail> {
  try {
    const { data } = await superAdminModuleClient.get<
      ApiResponse<Record<string, unknown>> | Record<string, unknown>
    >(`${BASE}/${id}`);

    const payload =
      data && typeof data === "object" && "data" in data
        ? ((data as ApiResponse<Record<string, unknown>>).data ?? {})
        : ((data as Record<string, unknown>) ?? {});

    const record = normalizeRecord(payload);
    const history = normalizeHistory(
      payload.history ?? payload.events ?? payload.timeline
    );

    const walletRaw =
      payload.wallet && typeof payload.wallet === "object"
        ? (payload.wallet as Record<string, unknown>)
        : null;

    return {
      ...record,
      history,
      wallet: {
        mainWalletBalance: toNumber(
          walletRaw?.mainWalletBalance ??
            walletRaw?.balance ??
            record.mainWalletBalance
        ),
        lienAmount: toNumber(
          walletRaw?.lienAmount ??
            walletRaw?.holdAmount ??
            record.remainingAmount
        ),
        availableBalance: toNumber(
          walletRaw?.availableBalance ?? record.availableBalance
        ),
      },
    };
  } catch (error) {
    unwrapError(error);
  }
}

/** POST /api/v1/super-admin/main-wallet-lien */
export async function applyWalletLien(
  payload: ApplyWalletLienPayload
): Promise<WalletLienRecord> {
  try {
    const { data } = await superAdminModuleClient.post<
      ApiResponse<Record<string, unknown>> | Record<string, unknown>
    >(BASE, {
      userId: payload.userId,
      amount: payload.amount,
      reason: payload.reason,
      remarks: payload.remarks?.trim() || undefined,
    });

    const body =
      data && typeof data === "object" && "data" in data
        ? ((data as ApiResponse<Record<string, unknown>>).data ?? {})
        : ((data as Record<string, unknown>) ?? {});

    return normalizeRecord(body);
  } catch (error) {
    unwrapError(error);
  }
}

/** POST /api/v1/super-admin/main-wallet-lien/release */
export async function releaseWalletLien(
  payload: ReleaseWalletLienPayload
): Promise<WalletLienRecord> {
  try {
    const { data } = await superAdminModuleClient.post<
      ApiResponse<Record<string, unknown>> | Record<string, unknown>
    >(`${BASE}/release`, {
      lienId: payload.lienId,
      id: payload.lienId,
      amount: payload.amount,
      remarks: payload.remarks?.trim() || undefined,
    });

    const body =
      data && typeof data === "object" && "data" in data
        ? ((data as ApiResponse<Record<string, unknown>>).data ?? {})
        : ((data as Record<string, unknown>) ?? {});

    return normalizeRecord(body);
  } catch (error) {
    unwrapError(error);
  }
}
