import dayjs from "dayjs";
import { adminClient, superAdminClient, adminModuleClient } from "@/lib/api/client";
import { STORAGE_KEYS } from "@/constants/storage";
import { WALLET_API } from "@/constants/walletApi";
import { getErrorMessage } from "@/lib/api/messages";
import { ApiResponse } from "@/types";
import {
  LedgerDetail,
  LedgerFilters,
  LedgerListResult,
  LedgerPagination,
  LedgerRow,
  LedgerRoleTab,
  LedgerStats,
} from "@/types/ledger";
import { fetchWalletUsers } from "@/services/wallet.service";
import { getUserWalletSummary } from "@/services/walletSummaryApi";
import { getWalletHistory } from "@/services/adminApi";

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

function emptyStats(): LedgerStats {
  return {
    totalTransactions: 0,
    totalCredits: 0,
    totalDebits: 0,
    totalCharges: 0,
    totalCommission: 0,
    todayTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
  };
}

function emptyResult(limit = 20): LedgerListResult {
  return {
    items: [],
    pagination: { total: 0, page: 1, limit, totalPages: 1 },
    stats: emptyStats(),
    summary: {
      totalCredit: 0,
      totalDebit: 0,
      totalCharge: 0,
      totalCommission: 0,
      netAmount: 0,
    },
  };
}

function normalizePagination(
  raw: Record<string, unknown> | undefined,
  fallbackLimit: number
): LedgerPagination {
  const total = toNumber(raw?.total);
  const page = toNumber(raw?.page) || 1;
  const limit = toNumber(raw?.limit ?? raw?.pageSize) || fallbackLimit;
  const totalPages =
    toNumber(raw?.totalPages) ||
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
  return { total, page, limit, totalPages };
}

function isCreditType(type: string): boolean {
  const t = type.toUpperCase();
  return t === "CREDIT" || t === "REFUND" || t.includes("CREDIT");
}

function isDebitType(type: string): boolean {
  const t = type.toUpperCase();
  return (
    t === "DEBIT" ||
    t === "DEDUCT" ||
    t.includes("DEBIT") ||
    t.includes("DEDUCT")
  );
}

export function normalizeLedgerRow(raw: Record<string, unknown>): LedgerRow {
  const type = String(
    raw.transactionType ?? raw.type ?? raw.operationType ?? raw.action ?? ""
  ).toUpperCase();
  const amount = toNumber(raw.amount ?? raw.transactionAmount);
  const credit = toNumber(
    raw.credit ?? (isCreditType(type) ? amount : 0)
  );
  const debit = toNumber(
    raw.debit ?? (isDebitType(type) ? amount : 0)
  );

  const user =
    raw.user && typeof raw.user === "object"
      ? (raw.user as Record<string, unknown>)
      : null;
  const performedBy =
    raw.performedBy && typeof raw.performedBy === "object"
      ? (raw.performedBy as Record<string, unknown>)
      : null;

  const userName =
    (raw.userName as string) ||
    (user?.name as string) ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    (raw.recipientName as string) ||
    (raw.receiverName as string) ||
    (raw.adminName as string) ||
    "—";

  return {
    id: String(raw.id ?? raw.transactionId ?? cryptoRandom()),
    transactionId: String(
      raw.transactionId ?? raw.id ?? raw.transferId ?? "—"
    ),
    referenceId:
      (raw.referenceId as string) ||
      (raw.reference as string) ||
      (raw.fundRequestRef as string) ||
      (raw.externalRef as string) ||
      null,
    userId:
      (raw.userId as string) ||
      (user?.id as string) ||
      (raw.receiverId as string) ||
      null,
    userName,
    userCode:
      (raw.userCode as string) ||
      (user?.userCode as string) ||
      null,
    role: String(
      raw.role ?? raw.userType ?? user?.userType ?? user?.role ?? ""
    ),
    serviceType: String(
      raw.serviceType ?? raw.service ?? raw.source ?? "WALLET"
    ),
    credit,
    debit,
    openingBalance:
      raw.openingBalance != null
        ? toNumber(raw.openingBalance)
        : raw.previousBalance != null
          ? toNumber(raw.previousBalance)
          : raw.balanceBefore != null
            ? toNumber(raw.balanceBefore)
            : null,
    closingBalance:
      raw.closingBalance != null
        ? toNumber(raw.closingBalance)
        : raw.updatedBalance != null
          ? toNumber(raw.updatedBalance)
          : raw.currentBalance != null
            ? toNumber(raw.currentBalance)
            : raw.balanceAfter != null
              ? toNumber(raw.balanceAfter)
              : null,
    charge: toNumber(raw.charge ?? raw.charges ?? raw.fee),
    commission: toNumber(raw.commission ?? raw.commissionAmount),
    gst: toNumber(raw.gst ?? raw.gstAmount),
    status: String(raw.status ?? "SUCCESS"),
    transactionType: type || (credit > 0 ? "CREDIT" : debit > 0 ? "DEBIT" : "—"),
    narration:
      (raw.narration as string) ||
      (raw.remarks as string) ||
      (raw.description as string) ||
      (raw.message as string) ||
      null,
    createdBy:
      (raw.createdBy as string) ||
      (raw.performedByName as string) ||
      (performedBy?.name as string) ||
      null,
    createdByRole:
      (raw.createdByRole as string) ||
      (raw.performedByRole as string) ||
      (performedBy?.role as string) ||
      (performedBy?.roleLabel as string) ||
      null,
    createdAt:
      (raw.createdAt as string) ||
      (raw.date as string) ||
      null,
    updatedAt: (raw.updatedAt as string) || null,
  };
}

function cryptoRandom() {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function computeStats(items: LedgerRow[], total: number): LedgerStats {
  const today = dayjs().format("YYYY-MM-DD");
  let totalCredits = 0;
  let totalDebits = 0;
  let totalCharges = 0;
  let totalCommission = 0;
  let todayTransactions = 0;
  let pendingTransactions = 0;
  let failedTransactions = 0;

  for (const row of items) {
    totalCredits += row.credit;
    totalDebits += row.debit;
    totalCharges += row.charge;
    totalCommission += row.commission;
    if (row.createdAt && dayjs(row.createdAt).format("YYYY-MM-DD") === today) {
      todayTransactions += 1;
    }
    const status = row.status.toUpperCase();
    if (status === "PENDING" || status === "PROCESSING") pendingTransactions += 1;
    if (status === "FAILED") failedTransactions += 1;
  }

  return {
    totalTransactions: total,
    totalCredits,
    totalDebits,
    totalCharges,
    totalCommission,
    todayTransactions,
    pendingTransactions,
    failedTransactions,
  };
}

function buildSummary(items: LedgerRow[]) {
  const totalCredit = items.reduce((s, r) => s + r.credit, 0);
  const totalDebit = items.reduce((s, r) => s + r.debit, 0);
  const totalCharge = items.reduce((s, r) => s + r.charge, 0);
  const totalCommission = items.reduce((s, r) => s + r.commission, 0);
  return {
    totalCredit,
    totalDebit,
    totalCharge,
    totalCommission,
    netAmount: totalCredit - totalDebit - totalCharge,
  };
}

function parseListPayload(
  payload: Record<string, unknown>,
  limit: number
): LedgerListResult {
  const rawItems = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.entries)
        ? payload.entries
        : Array.isArray(payload.transactions)
          ? payload.transactions
          : Array.isArray(payload.history)
            ? payload.history
            : [];

  const items = rawItems
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map(normalizeLedgerRow);

  const pagination = normalizePagination(
    (payload.pagination ?? payload.meta) as Record<string, unknown> | undefined,
    limit
  );

  const statsRaw = payload.stats as Record<string, unknown> | undefined;
  const stats = statsRaw
    ? {
        totalTransactions: toNumber(
          statsRaw.totalTransactions ?? pagination.total
        ),
        totalCredits: toNumber(statsRaw.totalCredits ?? statsRaw.totalCredit),
        totalDebits: toNumber(statsRaw.totalDebits ?? statsRaw.totalDebit),
        totalCharges: toNumber(statsRaw.totalCharges ?? statsRaw.totalCharge),
        totalCommission: toNumber(statsRaw.totalCommission),
        todayTransactions: toNumber(statsRaw.todayTransactions),
        pendingTransactions: toNumber(statsRaw.pendingTransactions),
        failedTransactions: toNumber(statsRaw.failedTransactions),
        creditTrend: toNumber(statsRaw.creditTrend),
        debitTrend: toNumber(statsRaw.debitTrend),
      }
    : computeStats(items, pagination.total || items.length);

  const summaryRaw = payload.summary as Record<string, unknown> | undefined;

  return {
    items,
    pagination: {
      ...pagination,
      total: pagination.total || items.length,
    },
    stats,
    summary: summaryRaw
      ? {
          totalCredit: toNumber(summaryRaw.totalCredit),
          totalDebit: toNumber(summaryRaw.totalDebit),
          totalCharge: toNumber(summaryRaw.totalCharge),
          totalCommission: toNumber(summaryRaw.totalCommission),
          netAmount: toNumber(summaryRaw.netAmount),
        }
      : buildSummary(items),
  };
}

function buildQuery(params: LedgerFilters) {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.role) query.role = params.role;
  if (params.serviceType) query.serviceType = params.serviceType;
  if (params.status) query.status = params.status;
  if (params.transactionType && params.transactionType !== "ALL") {
    query.transactionType = params.transactionType;
    query.type =
      params.transactionType === "DEBIT" ? "DEDUCT" : params.transactionType;
  }
  if (params.startDate) {
    query.startDate = params.startDate;
    query.fromDate = params.startDate;
  }
  if (params.endDate) {
    query.endDate = params.endDate;
    query.toDate = params.endDate;
  }
  if (params.userId) query.userId = params.userId;
  return query;
}

async function tryCentralLedger(
  params: LedgerFilters
): Promise<LedgerListResult | null> {
  const client = getClient();
  const query = buildQuery(params);
  const limit = Number(query.limit) || 20;
  const paths = ["/ledger", "/wallet/ledgers", "/wallet/ledger/all"];

  for (const path of paths) {
    try {
      const { data } = await client.get<
        ApiResponse<Record<string, unknown>> | Record<string, unknown>
      >(path, { params: query });
      const payload =
        data && typeof data === "object" && "data" in data
          ? ((data as ApiResponse<Record<string, unknown>>).data ?? {})
          : ((data as Record<string, unknown>) ?? {});
      return parseListPayload(payload ?? {}, limit);
    } catch {
      // try next candidate path
    }
  }
  return null;
}

async function fetchAdminHistoryLedger(
  params: LedgerFilters
): Promise<LedgerListResult> {
  const limit = params.limit ?? 20;
  const page = params.page ?? 1;

  try {
    const result = await getWalletHistory({
      page,
      pageSize: limit,
      search: params.search,
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status,
    });

    const items = result.data.map((row) =>
      normalizeLedgerRow({
        ...row,
        role: "ADMIN",
        serviceType: "WALLET",
        transactionType: row.transactionType || "CREDIT",
        userName: row.recipientName || row.receiverName || "Admin Wallet",
      } as unknown as Record<string, unknown>)
    );

    const total = result.total ?? items.length;
    const pageSize = result.pageSize ?? limit;

    return {
      items,
      pagination: {
        total,
        page: result.page ?? page,
        limit: pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      stats: computeStats(items, total),
      summary: buildSummary(items),
    };
  } catch {
    // Super-admin path
    try {
      const client = getClient();
      const { data } = await client.get<ApiResponse<Record<string, unknown>>>(
        "/wallet/transfers",
        {
          params: {
            page,
            limit,
            direction: "all",
            search: params.search,
          },
        }
      );
      return parseListPayload(data?.data ?? {}, limit);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

async function fetchRoleUserLedger(
  role: LedgerRoleTab,
  params: LedgerFilters
): Promise<LedgerListResult> {
  const limit = params.limit ?? 20;
  const page = params.page ?? 1;
  const scope =
    typeof window !== "undefined" &&
    (localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN) ||
      sessionStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN)) &&
    !(
      localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
      sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
    )
      ? "super_admin"
      : "admin";

  let userId = params.userId;

  if (!userId) {
    const users = await fetchWalletUsers({
      page: 1,
      limit: 1,
      role: role === "ADMIN" ? "ADMIN" : role,
      search: params.search,
    });
    userId = users.items[0]?.userId;
  }

  if (!userId) {
    return emptyResult(limit);
  }

  const summary = await getUserWalletSummary(
    userId,
    {
      page,
      pageSize: limit,
      search: params.search,
      status: params.status,
      type:
        params.transactionType === "DEBIT"
          ? "DEDUCT"
          : params.transactionType === "CREDIT"
            ? "CREDIT"
            : "ALL",
      startDate: params.startDate,
      endDate: params.endDate,
    },
    scope
  );

  const items = summary.data.map((row) =>
    normalizeLedgerRow({
      ...row,
      userId,
      userName: summary.header?.name,
      userCode: summary.header?.userCode,
      role: summary.header?.userType || role,
      serviceType: "WALLET",
      transactionType: row.operationType,
      previousBalance: row.previousBalance,
      updatedBalance: row.updatedBalance,
      performedByName: row.performedByName,
      performedByRole: row.performedByRole,
      reference: row.reference || row.fundRequestRef,
    } as unknown as Record<string, unknown>)
  );

  const stats = computeStats(items, summary.total);
  if (summary.header) {
    stats.totalCredits = summary.header.totalCreditAmount ?? stats.totalCredits;
    stats.totalDebits = summary.header.totalDeductAmount ?? stats.totalDebits;
  }

  return {
    items,
    pagination: {
      total: summary.total,
      page: summary.page,
      limit: summary.pageSize,
      totalPages: summary.totalPages,
    },
    stats,
    summary: buildSummary(items),
  };
}

/** List ledger entries for dashboard (central API with live fallbacks). */
export async function fetchLedger(
  params: LedgerFilters = {}
): Promise<LedgerListResult> {
  try {
    const central = await tryCentralLedger(params);
    if (central) return central;

    const role = (params.role || "ADMIN") as LedgerRoleTab;
    if (role === "ADMIN" && !params.userId) {
      return fetchAdminHistoryLedger(params);
    }
    return fetchRoleUserLedger(role, params);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function fetchLedgerDetails(
  ledgerId: string
): Promise<LedgerDetail> {
  const client = getClient();

  try {
    try {
      const { data } = await client.get<
        ApiResponse<Record<string, unknown>> | Record<string, unknown>
      >(`/ledger/${ledgerId}`);
      const payload =
        data && typeof data === "object" && "data" in data
          ? ((data as ApiResponse<Record<string, unknown>>).data ?? {})
          : ((data as Record<string, unknown>) ?? {});
      const row = normalizeLedgerRow(payload);
      return {
        ...row,
        timeline: buildTimeline(row),
      };
    } catch {
      // Fallback: try wallet ledger entry / scan recent list
      try {
        const { data } = await adminModuleClient.get<
          ApiResponse<Record<string, unknown>>
        >(`/wallet-history/${ledgerId}`);
        const row = normalizeLedgerRow(data?.data ?? { id: ledgerId });
        return { ...row, timeline: buildTimeline(row) };
      } catch {
        const list = await fetchLedger({ page: 1, limit: 100, search: ledgerId });
        const found =
          list.items.find(
            (i) => i.id === ledgerId || i.transactionId === ledgerId
          ) || list.items[0];
        if (!found) {
          throw new Error("Ledger entry not found");
        }
        return { ...found, timeline: buildTimeline(found) };
      }
    }
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

function buildTimeline(row: LedgerRow): LedgerDetail["timeline"] {
  const status = row.status.toUpperCase();
  const steps = [
    { key: "CREATED", label: "Created" },
    { key: "PROCESSING", label: "Processing" },
    { key: "SUCCESS", label: "Success" },
    { key: "FAILED", label: "Failed" },
    { key: "REFUND", label: "Refund" },
  ];

  return steps.map((step) => {
    let active = false;
    if (step.key === "CREATED") active = true;
    if (step.key === "PROCESSING" && ["PROCESSING", "PENDING"].includes(status))
      active = true;
    if (step.key === "SUCCESS" && status === "SUCCESS") active = true;
    if (step.key === "FAILED" && status === "FAILED") active = true;
    if (
      step.key === "REFUND" &&
      (status === "REFUNDED" || row.transactionType === "REFUND")
    )
      active = true;

    return {
      ...step,
      at: step.key === "CREATED" || active ? row.createdAt : null,
      active,
    };
  });
}
