import {
  superAdminModuleClient,
  superAdminPublicClient,
} from "@/lib/api/client";
import { STORAGE_KEYS } from "@/constants/storage";
import {
  SuperAdminLoginPayload,
  SuperAdminProfile,
  SuperAdminDashboardData,
  SuperAdminStatisticsData,
  WalletBalanceData,
  AddBalancePayload,
  TransferBalancePayload,
  WalletHistoryRecord,
  WalletHistoryParams,
  PaginatedApiData,
  ListQueryParams,
  UpdateProfilePayload,
  ChangePasswordPayload,
  AdminRecord,
  NetworkUserRecord,
  AdminFundRequest,
} from "@/types/superAdmin";
import { ApiResponse } from "@/types";
import { normalizeNetworkUserRecord } from "@/lib/normalizeUser";
import { normalizeAdminRecord } from "@/lib/normalizeAdmin";

function readPaginationMeta(
  obj: Record<string, unknown>
): Pick<PaginatedApiData<unknown>, "total" | "page" | "pageSize" | "totalPages"> {
  const meta =
    obj.meta && typeof obj.meta === "object"
      ? (obj.meta as Record<string, unknown>)
      : obj;

  return {
    total:
      (meta.total as number | undefined) ??
      (obj.total as number | undefined),
    page:
      (meta.page as number | undefined) ?? (obj.page as number | undefined),
    pageSize:
      (meta.limit as number | undefined) ??
      (meta.pageSize as number | undefined) ??
      (obj.pageSize as number | undefined) ??
      (obj.limit as number | undefined),
    totalPages:
      (meta.totalPages as number | undefined) ??
      (obj.totalPages as number | undefined),
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
  const { data } = await superAdminModuleClient.get<
    ApiResponse<WalletBalanceData>
  >("/wallet-balance");
  return data.data;
}

export async function addBalance(payload: AddBalancePayload) {
  const { data } = await superAdminModuleClient.post<
    ApiResponse<WalletBalanceData>
  >("/add-balance", payload);
  return data.data;
}

export async function transferBalance(payload: TransferBalancePayload) {
  const { data } = await superAdminModuleClient.post<ApiResponse<unknown>>(
    "/transfer-balance",
    payload
  );
  return data.data;
}

interface WalletHistoryApiItem {
  id: string;
  superAdminId?: string;
  adminId?: string | null;
  transactionType: string;
  amount?: string | number;
  openingBalance?: string | number;
  closingBalance?: string | number;
  previousBalance?: string | number;
  currentBalance?: string | number;
  updatedBalance?: string | number;
  remarks?: string | null;
  createdAt?: string;
  adminName?: string;
  receiverName?: string;
  receiverRole?: string;
  receiverEmail?: string;
  status?: string;
}

function parseWalletHistoryNumber(
  value: string | number | null | undefined
): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapWalletHistoryRecord(item: WalletHistoryApiItem): WalletHistoryRecord {
  const opening = item.openingBalance ?? item.previousBalance;
  const closing =
    item.closingBalance ?? item.currentBalance ?? item.updatedBalance;

  return {
    id: item.id,
    transactionId: item.id,
    adminId: item.adminId ?? undefined,
    transactionType: item.transactionType,
    amount: parseWalletHistoryNumber(item.amount),
    previousBalance: parseWalletHistoryNumber(opening),
    currentBalance: parseWalletHistoryNumber(closing),
    balanceBefore: parseWalletHistoryNumber(opening),
    balanceAfter: parseWalletHistoryNumber(closing),
    remarks: item.remarks ?? undefined,
    adminName: item.adminName,
    receiverName: item.receiverName,
    receiverRole: item.receiverRole,
    receiverEmail: item.receiverEmail,
    status: item.status,
    createdAt: item.createdAt,
  };
}

export async function getWalletHistory(
  params: WalletHistoryParams = {}
): Promise<PaginatedApiData<WalletHistoryRecord>> {
  const { pageSize, page, ...rest } = params;
  const { data } = await superAdminModuleClient.get<
    ApiResponse<
      | WalletHistoryApiItem[]
      | PaginatedApiData<WalletHistoryApiItem>
      | { history: WalletHistoryApiItem[] }
      | { items: WalletHistoryApiItem[]; meta?: Record<string, unknown> }
    >
  >("/wallet-history", {
    params: {
      ...rest,
      page,
      limit: pageSize,
      pageSize,
    },
  });

  const normalized = normalizePaginated<WalletHistoryApiItem>(data.data, [
    "history",
    "items",
  ]);

  return {
    ...normalized,
    data: normalized.data.map(mapWalletHistoryRecord),
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
  const { data } = await superAdminModuleClient.put<ApiResponse<unknown>>(
    "/change-password",
    payload
  );
  return data.data;
}

export async function getRetailers(
  params: ListQueryParams = {}
): Promise<PaginatedApiData<NetworkUserRecord>> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<PaginatedApiData<NetworkUserRecord> | NetworkUserRecord[]>
  >("/retailers", { params });
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
  >("/master-distributors", { params });
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
  >("/distributors", { params });
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
  >("/admins", { params });
  const normalized = normalizePaginated<AdminRecord>(data.data, ["admins"]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeAdminRecord),
  };
}

export async function getAdminFundRequests(
  adminId: string,
  params: ListQueryParams = {}
): Promise<PaginatedApiData<AdminFundRequest>> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<PaginatedApiData<AdminFundRequest> | AdminFundRequest[]>
  >(`/admins/${adminId}/fund-requests`, { params });
  return normalizePaginated<AdminFundRequest>(data.data, ["fundRequests"]);
}
