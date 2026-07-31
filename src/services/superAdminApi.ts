import {
  superAdminModuleClient,
  superAdminPublicClient,
  superAdminClient,
} from "@/lib/api/client";
import { WALLET_API, SUPER_ADMIN_WALLET_API } from "@/constants/walletApi";
import { buildWalletTransferPayload, buildWalletDeductPayload } from "@/lib/walletAmount";
import { normalizeWalletBalanceData } from "@/lib/walletBalance";
import { STORAGE_KEYS } from "@/constants/storage";
import {
  SuperAdminLoginPayload,
  SuperAdminProfile,
  SuperAdminDashboardData,
  SuperAdminStatisticsData,
  WalletBalanceData,
  AddBalancePayload,
  WalletHistoryRecord,
  WalletHistoryParams,
  WalletHistorySummary,
  PaginatedApiData,
  ListQueryParams,
  UpdateProfilePayload,
  ChangePasswordPayload,
  AdminRecord,
  NetworkUserRecord,
  AdminFundRequest,
} from "@/types/superAdmin";
import type { WalletTransferPayload, WalletDeductInput } from "@/types/wallet";
import { ApiResponse } from "@/types";
import { normalizeNetworkUserRecord } from "@/lib/normalizeUser";
import { normalizeAdminRecord } from "@/lib/normalizeAdmin";

function readPaginationMeta(
  obj: Record<string, unknown>
): Pick<PaginatedApiData<unknown>, "total" | "page" | "pageSize" | "totalPages"> {
  const nested =
    obj.pagination && typeof obj.pagination === "object"
      ? (obj.pagination as Record<string, unknown>)
      : obj.meta && typeof obj.meta === "object"
        ? (obj.meta as Record<string, unknown>)
        : {};

  return {
    total:
      (nested.total as number | undefined) ??
      (obj.total as number | undefined),
    page:
      (nested.page as number | undefined) ?? (obj.page as number | undefined),
    pageSize:
      (nested.limit as number | undefined) ??
      (nested.pageSize as number | undefined) ??
      (obj.pageSize as number | undefined) ??
      (obj.limit as number | undefined),
    totalPages:
      (nested.totalPages as number | undefined) ??
      (obj.totalPages as number | undefined),
  };
}

function withListParams(params: ListQueryParams = {}) {
  const { pageSize = 10, page, fromDate, toDate, startDate, endDate, ...rest } =
    params;
  const limit = Math.min(pageSize, 100);
  const resolvedFrom = fromDate || startDate || undefined;
  const resolvedTo = toDate || endDate || undefined;

  return {
    ...rest,
    page,
    pageSize: limit,
    limit,
    fromDate: resolvedFrom,
    toDate: resolvedTo,
    // Backend compatibility: some routes accept startDate/endDate
    startDate: resolvedFrom,
    endDate: resolvedTo,
  };
}

function normalizePaginated<T>(
  result: unknown,
  nestedKeys: string[] = []
): PaginatedApiData<T> {
  if (Array.isArray(result)) {
    return {
      data: result as T[],
      total: result.length,
      page: 1,
      pageSize: result.length,
    };
  }
  if (result && typeof result === "object") {
    const obj = result as Record<string, unknown>;

    if (Array.isArray(obj.items)) {
      const arr = obj.items as T[];
      const pagination = readPaginationMeta(obj);
      return {
        data: arr,
        total: pagination.total ?? arr.length,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: pagination.totalPages,
      };
    }

    if (Array.isArray(obj.data)) {
      const arr = obj.data as T[];
      const pagination = readPaginationMeta(obj);
      return {
        data: arr,
        total: pagination.total ?? arr.length,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: pagination.totalPages,
      };
    }

    for (const key of nestedKeys) {
      if (Array.isArray(obj[key])) {
        const arr = obj[key] as T[];
        const pagination = readPaginationMeta(obj);
        return {
          data: arr,
          total: pagination.total ?? arr.length,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: pagination.totalPages,
        };
      }
    }
  }
  return { data: [], total: 0, page: 1, pageSize: 10 };
}

function extractUser(data: {
  user?: SuperAdminProfile;
  superAdmin?: SuperAdminProfile;
}): SuperAdminProfile {
  const user = data.user || data.superAdmin;
  if (!user) return { id: "", email: "" };
  return {
    ...user,
    name:
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email,
  };
}

export async function login(credentials: SuperAdminLoginPayload) {
  const { data } = await superAdminPublicClient.post<
    ApiResponse<{
      accessToken: string;
      refreshToken?: string;
      user?: SuperAdminProfile;
      superAdmin?: SuperAdminProfile;
    }>
  >("/login", credentials);

  const payload = data.data;
  const token = payload.accessToken;
  const user = extractUser(payload);

  localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_USER, JSON.stringify(user));
  if (payload.refreshToken) {
    localStorage.setItem(
      STORAGE_KEYS.SUPER_ADMIN_REFRESH_TOKEN,
      payload.refreshToken
    );
  }

  return { accessToken: token, user };
}

export async function getDashboard(): Promise<SuperAdminDashboardData> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<SuperAdminDashboardData>
  >("/dashboard");
  return data.data;
}

export async function getStatistics(): Promise<SuperAdminStatisticsData> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<SuperAdminStatisticsData>
  >("/statistics");
  return data.data;
}

export async function getWalletBalance(): Promise<WalletBalanceData> {
  const { data } = await superAdminModuleClient.get<ApiResponse<unknown>>(
    SUPER_ADMIN_WALLET_API.balance
  );
  return normalizeWalletBalanceData(data.data);
}

export async function transferBalance(payload: WalletTransferPayload) {
  const { data } = await superAdminClient.post<ApiResponse<unknown>>(
    WALLET_API.transfer,
    buildWalletTransferPayload(payload)
  );
  return data.data;
}

export async function deductBalance(payload: WalletDeductInput) {
  const { data } = await superAdminClient.post<ApiResponse<unknown>>(
    WALLET_API.deduct,
    buildWalletDeductPayload(payload)
  );
  return data.data;
}

export async function addBalance(payload: AddBalancePayload) {
  const { data } = await superAdminModuleClient.post<ApiResponse<unknown>>(
    "/add-balance",
    payload
  );
  return normalizeWalletBalanceData(data.data);
}

interface WalletHistoryApiItem {
  id: string;
  superAdminId?: string;
  adminId?: string | null;
  transactionType?: string;
  amount?: string | number;
  addedAmount?: string | number;
  topupAmount?: string | number;
  openingBalance?: string | number;
  closingBalance?: string | number;
  previousBalance?: string | number;
  currentBalance?: string | number;
  updatedBalance?: string | number;
  remarks?: string | null;
  date?: string;
  time?: string;
  createdAt?: string;
  adminName?: string;
  receiverName?: string;
  receiverRole?: string;
  receiverEmail?: string;
  status?: string;
}

interface WalletHistoryApiSummary {
  currentWalletBalance?: string | number;
  totalTopupAmount?: string | number;
  totalTopupCount?: string | number;
}

function parseWalletHistoryNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapWalletHistoryRecord(item: WalletHistoryApiItem): WalletHistoryRecord {
  const opening = item.openingBalance ?? item.previousBalance;
  const closing =
    item.closingBalance ?? item.updatedBalance ?? item.currentBalance;
  const topup =
    item.topupAmount ?? item.addedAmount ?? item.amount;

  return {
    id: item.id,
    transactionId: item.id,
    adminId: item.adminId ?? undefined,
    transactionType: item.transactionType || "ADD_BALANCE",
    amount: parseWalletHistoryNumber(topup),
    topupAmount: parseWalletHistoryNumber(topup),
    previousBalance: parseWalletHistoryNumber(opening),
    currentBalance: parseWalletHistoryNumber(closing),
    updatedBalance: parseWalletHistoryNumber(closing),
    balanceBefore: parseWalletHistoryNumber(opening),
    balanceAfter: parseWalletHistoryNumber(closing),
    remarks: item.remarks ?? undefined,
    adminName: item.adminName,
    receiverName: item.receiverName,
    receiverRole: item.receiverRole,
    receiverEmail: item.receiverEmail,
    status: item.status,
    date: item.date,
    time: item.time,
    createdAt: item.createdAt,
  };
}

/** Map `/wallet/transfers` rows into the shared wallet history table shape */
function mapTransferHistoryRecord(raw: unknown): WalletHistoryRecord {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      transactionType: "TRANSFER",
      amount: 0,
      previousBalance: 0,
      currentBalance: 0,
    };
  }

  const obj = raw as Record<string, unknown>;
  const receiver =
    obj.receiver && typeof obj.receiver === "object"
      ? (obj.receiver as Record<string, unknown>)
      : undefined;
  const receiverName =
    (obj.receiverName as string | undefined) ||
    (obj.adminName as string | undefined) ||
    (obj.recipientName as string | undefined) ||
    [receiver?.firstName, receiver?.lastName].filter(Boolean).join(" ") ||
    undefined;
  const opening = obj.previousBalance ?? obj.balanceBefore ?? obj.openingBalance;
  const closing =
    obj.updatedBalance ??
    obj.balanceAfter ??
    obj.currentBalance ??
    obj.closingBalance;
  const amount = parseWalletHistoryNumber(obj.amount);
  const id = String(obj.id ?? obj.transferId ?? obj.transactionId ?? "");

  return {
    id,
    transactionId: String(obj.transferId ?? obj.transactionId ?? obj.id ?? id),
    transactionType:
      (obj.transactionType as string | undefined) ||
      (obj.type as string | undefined) ||
      "TRANSFER",
    amount,
    previousBalance: parseWalletHistoryNumber(opening),
    currentBalance: parseWalletHistoryNumber(closing),
    updatedBalance: parseWalletHistoryNumber(closing),
    balanceBefore: parseWalletHistoryNumber(opening),
    balanceAfter: parseWalletHistoryNumber(closing),
    remarks:
      (obj.remarks as string | undefined) ||
      (obj.description as string | undefined) ||
      undefined,
    adminName: obj.adminName as string | undefined,
    adminId: (obj.adminId as string | undefined) || undefined,
    receiverName,
    receiverRole:
      (obj.receiverRole as string | undefined) ||
      (obj.userType as string | undefined) ||
      (receiver?.userType as string | undefined),
    receiverEmail:
      (obj.receiverEmail as string | undefined) ||
      (receiver?.email as string | undefined),
    recipientName: (obj.recipientName as string | undefined) || receiverName,
    status: obj.status as string | undefined,
    date: obj.date as string | undefined,
    createdAt:
      (obj.createdAt as string | undefined) ||
      (obj.date as string | undefined),
  };
}

function extractWalletHistorySummary(
  payload: unknown
): WalletHistorySummary | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const summary = (payload as { summary?: WalletHistoryApiSummary }).summary;
  if (!summary || typeof summary !== "object") return undefined;
  return {
    currentWalletBalance: parseWalletHistoryNumber(summary.currentWalletBalance),
    totalTopupAmount: parseWalletHistoryNumber(summary.totalTopupAmount),
    totalTopupCount: parseWalletHistoryNumber(summary.totalTopupCount),
  };
}

export async function getWalletHistory(
  params: WalletHistoryParams = {}
): Promise<PaginatedApiData<WalletHistoryRecord>> {
  const { pageSize, page, transactionType, ...rest } = params;
  const normalizedType = transactionType?.trim() || undefined;
  const { data } = await superAdminModuleClient.get<
    ApiResponse<
      | WalletHistoryApiItem[]
      | PaginatedApiData<WalletHistoryApiItem>
      | { history: WalletHistoryApiItem[] }
      | {
          items: WalletHistoryApiItem[];
          meta?: Record<string, unknown>;
          summary?: WalletHistoryApiSummary;
        }
    >
  >("/wallet-history", {
    params: {
      ...rest,
      page,
      limit: pageSize,
      pageSize,
      ...(normalizedType ? { transactionType: normalizedType } : {}),
    },
  });

  const normalized = normalizePaginated<WalletHistoryApiItem>(data.data, [
    "history",
    "items",
  ]);

  return {
    ...normalized,
    data: normalized.data.map(mapWalletHistoryRecord),
    summary: extractWalletHistorySummary(data.data),
  };
}

/**
 * Transfer / deduct movement history.
 * Uses GET `/wallet/transfers` — do NOT filter `/super-admin/wallet-history`
 * with `transactionType=TRANSFER` (that enum only allows ADD_BALANCE).
 */
export async function getTransferHistory(
  params: ListQueryParams = {}
): Promise<PaginatedApiData<WalletHistoryRecord>> {
  const { data } = await superAdminClient.get<ApiResponse<unknown>>(
    WALLET_API.transfers,
    { params: withListParams(params) }
  );

  const normalized = normalizePaginated<unknown>(data.data, [
    "transfers",
    "history",
    "items",
  ]);

  return {
    ...normalized,
    data: normalized.data.map(mapTransferHistoryRecord),
  };
}

export async function getProfile(): Promise<SuperAdminProfile> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<SuperAdminProfile>
  >("/profile");
  const profile = data.data;
  return {
    ...profile,
    name:
      profile.name ||
      [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      profile.email,
  };
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const { data } = await superAdminModuleClient.patch<
    ApiResponse<SuperAdminProfile>
  >("/profile", payload);
  const profile = data.data;
  const normalized = {
    ...profile,
    name:
      profile.name ||
      [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      profile.email,
  };
  localStorage.setItem(
    STORAGE_KEYS.SUPER_ADMIN_USER,
    JSON.stringify(normalized)
  );
  return normalized;
}

export async function changePassword(payload: ChangePasswordPayload) {
  const body = {
    oldPassword: payload.oldPassword,
    newPassword: payload.newPassword,
    confirmPassword: payload.confirmPassword,
  };

  const { data } = await superAdminModuleClient.put<ApiResponse<unknown>>(
    "/change-password",
    body,
    { headers: { "Content-Type": "application/json" } }
  );
  return data.data;
}

export async function getRetailers(
  params: ListQueryParams = {}
): Promise<PaginatedApiData<NetworkUserRecord>> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<PaginatedApiData<NetworkUserRecord> | NetworkUserRecord[]>
  >("/retailers", { params: withListParams(params) });
  const normalized = normalizePaginated<NetworkUserRecord>(data.data, ["retailers"]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeNetworkUserRecord),
  };
}

export async function getMasterDistributors(
  params: ListQueryParams = {}
): Promise<PaginatedApiData<NetworkUserRecord>> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<PaginatedApiData<NetworkUserRecord> | NetworkUserRecord[]>
  >("/master-distributors", { params: withListParams(params) });
  const normalized = normalizePaginated<NetworkUserRecord>(data.data, [
    "masterDistributors",
  ]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeNetworkUserRecord),
  };
}

export async function getDistributors(
  params: ListQueryParams = {}
): Promise<PaginatedApiData<NetworkUserRecord>> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<PaginatedApiData<NetworkUserRecord> | NetworkUserRecord[]>
  >("/distributors", { params: withListParams(params) });
  const normalized = normalizePaginated<NetworkUserRecord>(data.data, ["distributors"]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeNetworkUserRecord),
  };
}

export async function getAdmins(
  params: ListQueryParams = {}
): Promise<PaginatedApiData<AdminRecord>> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<PaginatedApiData<AdminRecord> | AdminRecord[]>
  >("/admins", { params: withListParams(params) });
  const normalized = normalizePaginated<AdminRecord>(data.data, ["admins"]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeAdminRecord),
  };
}

function pickNestedName(source: Record<string, unknown> | null): string | undefined {
  if (!source) return undefined;
  const name = source.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  const first =
    typeof source.firstName === "string" ? source.firstName.trim() : "";
  const last =
    typeof source.lastName === "string" ? source.lastName.trim() : "";
  const joined = [first, last].filter(Boolean).join(" ");
  return joined || undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickStr(
  source: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

export function normalizeAdminFundRequest(raw: unknown): AdminFundRequest {
  const obj = asRecord(raw) || {};
  const user = asRecord(obj.user) || asRecord(obj.requester);
  const admin = asRecord(obj.admin) || asRecord(obj.createdBy);
  const bank = asRecord(obj.bank) || asRecord(obj.bankAccount);

  const createdAt =
    pickStr(obj, "createdAt", "requestedAt", "date", "updatedAt") || undefined;

  const requesterName =
    pickStr(obj, "requesterName", "userName", "name") ||
    pickNestedName(user) ||
    undefined;

  const adminName =
    pickStr(obj, "adminName") || pickNestedName(admin) || undefined;

  return {
    ...obj,
    id: String(obj.id ?? ""),
    amount: Number(obj.amount) || 0,
    status: String(obj.status ?? "PENDING").toUpperCase(),
    createdAt,
    updatedAt: pickStr(obj, "updatedAt"),
    adminId:
      pickStr(obj, "adminId") ||
      (admin ? pickStr(admin, "id", "adminId") : undefined),
    adminName,
    remarks: pickStr(obj, "remarks", "note", "description"),
    adminRemarks: pickStr(obj, "adminRemarks", "actionRemarks"),
    reference: pickStr(obj, "reference", "referenceNumber", "refNo"),
    utr: pickStr(obj, "utr", "utrNumber", "transactionId"),
    referenceNumber: pickStr(obj, "referenceNumber", "reference"),
    paymentMode: pickStr(obj, "paymentMode", "fundingMode", "mode"),
    fundingMode: pickStr(obj, "fundingMode", "paymentMode"),
    bankName:
      pickStr(obj, "bankName") ||
      (bank ? pickStr(bank, "bankName", "name") : undefined),
    accountHolderName:
      pickStr(obj, "accountHolderName") ||
      (bank ? pickStr(bank, "accountHolderName", "holderName") : undefined),
    accountNumber:
      pickStr(obj, "accountNumber") ||
      (bank ? pickStr(bank, "accountNumber") : undefined),
    ifscCode:
      pickStr(obj, "ifscCode", "ifsc") ||
      (bank ? pickStr(bank, "ifscCode", "ifsc") : undefined),
    requesterId:
      pickStr(obj, "requesterId", "userId") ||
      (user ? pickStr(user, "id") : undefined),
    requesterName,
    requesterType:
      pickStr(obj, "requesterType", "userType", "role") ||
      (user ? pickStr(user, "userType", "role") : undefined),
    requesterMobile:
      pickStr(obj, "requesterMobile", "mobile", "phone") ||
      (user ? pickStr(user, "mobile", "phone") : undefined),
    requesterEmail:
      pickStr(obj, "requesterEmail", "email") ||
      (user ? pickStr(user, "email") : undefined),
    requesterUserCode:
      pickStr(obj, "requesterUserCode", "userCode") ||
      (user ? pickStr(user, "userCode") : undefined),
    userId:
      pickStr(obj, "userId") || (user ? pickStr(user, "id") : undefined),
    userName: requesterName,
    userType:
      pickStr(obj, "userType", "requesterType") ||
      (user ? pickStr(user, "userType", "role") : undefined),
    actionByName: pickStr(obj, "actionByName", "approverName", "reviewedBy"),
    approverName: pickStr(obj, "approverName", "actionByName"),
    approvedAt: pickStr(obj, "approvedAt"),
    rejectedAt: pickStr(obj, "rejectedAt"),
    imageUrl:
      (typeof obj.imageUrl === "string" && obj.imageUrl) ||
      (typeof obj.paymentProof === "string" && obj.paymentProof) ||
      null,
  };
}

/**
 * GET /api/v1/super-admin/fund-requests?page=&pageSize=
 * Global Super Admin fund requests list.
 */
export async function getSuperAdminFundRequests(
  params: ListQueryParams = {}
): Promise<PaginatedApiData<AdminFundRequest>> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<PaginatedApiData<AdminFundRequest> | AdminFundRequest[]> |
      Record<string, unknown>
  >("/fund-requests", { params: withListParams(params) });

  const envelope = asRecord(data) || {};
  // Prefer full envelope when `data` is an array + sibling `pagination`
  const payload =
    Array.isArray(envelope.data) || envelope.pagination
      ? envelope
      : envelope.data ?? data;

  const normalized = normalizePaginated<AdminFundRequest>(payload, [
    "fundRequests",
    "requests",
    "items",
  ]);

  return {
    ...normalized,
    data: normalized.data.map(normalizeAdminFundRequest),
  };
}

/** @deprecated Prefer getSuperAdminFundRequests for the global list */
export async function getAdminFundRequests(
  adminId: string,
  params: ListQueryParams = {}
): Promise<PaginatedApiData<AdminFundRequest>> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<PaginatedApiData<AdminFundRequest> | AdminFundRequest[]> |
      Record<string, unknown>
  >(`/admins/${adminId}/fund-requests`, { params: withListParams(params) });
  const normalized = normalizePaginated<AdminFundRequest>(data, [
    "fundRequests",
  ]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeAdminFundRequest),
  };
}

export type SuperAdminNetworkKind =
  | "MASTER_DISTRIBUTOR"
  | "DISTRIBUTOR"
  | "RETAILER";

async function listAllPages(
  fetcher: (
    params: ListQueryParams
  ) => Promise<PaginatedApiData<NetworkUserRecord>>,
  params: Omit<ListQueryParams, "page" | "pageSize"> = {}
): Promise<NetworkUserRecord[]> {
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;
  const collected: NetworkUserRecord[] = [];

  do {
    const result = await fetcher({ ...params, page, pageSize });
    collected.push(...result.data);
    totalPages =
      result.totalPages ||
      Math.max(1, Math.ceil((result.total || 0) / pageSize));
    if (!result.data.length) break;
    page += 1;
  } while (page <= totalPages);

  return collected;
}

export async function listAllMasterDistributors(
  params: Omit<ListQueryParams, "page" | "pageSize"> = {}
) {
  return listAllPages(getMasterDistributors, params);
}

export async function listAllDistributors(
  params: Omit<ListQueryParams, "page" | "pageSize"> = {}
) {
  return listAllPages(getDistributors, params);
}

export async function listAllRetailers(
  params: Omit<ListQueryParams, "page" | "pageSize"> = {}
) {
  return listAllPages(getRetailers, params);
}

export async function listAllSuperAdminNetworkUsers(
  kind: SuperAdminNetworkKind,
  params: Omit<ListQueryParams, "page" | "pageSize"> = {}
): Promise<NetworkUserRecord[]> {
  if (kind === "MASTER_DISTRIBUTOR") return listAllMasterDistributors(params);
  if (kind === "DISTRIBUTOR") return listAllDistributors(params);
  return listAllRetailers(params);
}

export async function listSuperAdminNetworkUsers(
  kind: SuperAdminNetworkKind,
  params: ListQueryParams = {}
): Promise<PaginatedApiData<NetworkUserRecord>> {
  if (kind === "MASTER_DISTRIBUTOR") return getMasterDistributors(params);
  if (kind === "DISTRIBUTOR") return getDistributors(params);
  return getRetailers(params);
}
