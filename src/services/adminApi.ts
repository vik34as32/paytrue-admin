import { adminModuleClient } from "@/lib/api/client";
import { STORAGE_KEYS } from "@/constants/storage";
import {
  AdminDashboardData,
  AdminWalletBalanceData,
  AdminWalletHistoryRecord,
  AdminTransferPayload,
  AdminFundRequestPayload,
  AdminFundRequestRecord,
  AdminProfile,
  AdminUpdateProfilePayload,
  AdminChangePasswordPayload,
  AdminNetworkUser,
  AdminBusinessReportData,
  AdminListQueryParams,
  PaginatedAdminData,
  CreateMasterDistributorApiPayload,
} from "@/types/admin";
import { ApiResponse } from "@/types";

function normalizePaginated<T>(
  result: unknown,
  nestedKeys: string[] = []
): PaginatedAdminData<T> {
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
    if (Array.isArray(obj.data)) {
      return {
        data: obj.data as T[],
        total: (obj.total as number) ?? (obj.data as T[]).length,
        page: obj.page as number | undefined,
        pageSize: obj.pageSize as number | undefined,
        totalPages: obj.totalPages as number | undefined,
      };
    }
    for (const key of nestedKeys) {
      if (Array.isArray(obj[key])) {
        const arr = obj[key] as T[];
        return {
          data: arr,
          total: (obj.total as number) ?? arr.length,
          page: obj.page as number | undefined,
          pageSize: obj.pageSize as number | undefined,
          totalPages: obj.totalPages as number | undefined,
        };
      }
    }
  }
  return { data: [], total: 0, page: 1, pageSize: 10 };
}

export async function getDashboard(): Promise<AdminDashboardData> {
  const { data } = await adminModuleClient.get<ApiResponse<AdminDashboardData>>(
    "/dashboard"
  );
  return data.data;
}

export async function getWalletBalance(): Promise<AdminWalletBalanceData> {
  const { data } = await adminModuleClient.get<
    ApiResponse<AdminWalletBalanceData>
  >("/wallet-balance");
  return data.data;
}

export async function getWalletHistory(
  params: AdminListQueryParams = {}
): Promise<PaginatedAdminData<AdminWalletHistoryRecord>> {
  const { data } = await adminModuleClient.get<
    ApiResponse<
      | AdminWalletHistoryRecord[]
      | PaginatedAdminData<AdminWalletHistoryRecord>
      | { history: AdminWalletHistoryRecord[] }
    >
  >("/wallet-history", { params });
  return normalizePaginated<AdminWalletHistoryRecord>(data.data, ["history"]);
}

export async function getTransferHistory(
  params: AdminListQueryParams = {}
): Promise<PaginatedAdminData<AdminWalletHistoryRecord>> {
  const { data } = await adminModuleClient.get<
    ApiResponse<
      | AdminWalletHistoryRecord[]
      | PaginatedAdminData<AdminWalletHistoryRecord>
    >
  >("/transfer-history", { params });
  return normalizePaginated<AdminWalletHistoryRecord>(data.data, [
    "transfers",
    "history",
  ]);
}

export async function transferBalance(payload: AdminTransferPayload) {
  const { data } = await adminModuleClient.post<ApiResponse<unknown>>(
    "/transfer-balance",
    payload
  );
  return data.data;
}

export async function getProfile(): Promise<AdminProfile> {
  const { data } = await adminModuleClient.get<ApiResponse<AdminProfile>>(
    "/profile"
  );
  const profile = data.data;
  return {
    ...profile,
    name:
      profile.name ||
      [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      profile.email,
  };
}

export async function updateProfile(payload: AdminUpdateProfilePayload) {
  const { data } = await adminModuleClient.patch<ApiResponse<AdminProfile>>(
    "/profile",
    payload
  );
  const profile = data.data;
  const normalized = {
    ...profile,
    name:
      profile.name ||
      [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      profile.email,
  };
  localStorage.setItem(
    STORAGE_KEYS.ADMIN_USER,
    JSON.stringify({
      ...normalized,
      role: "admin",
      status: "active",
      balance: 0,
    })
  );
  return normalized;
}

export async function changePassword(payload: AdminChangePasswordPayload) {
  const { data } = await adminModuleClient.put<ApiResponse<unknown>>(
    "/change-password",
    payload
  );
  return data.data;
}

export async function getMasterDistributors(
  params: AdminListQueryParams = {}
): Promise<PaginatedAdminData<AdminNetworkUser>> {
  const { data } = await adminModuleClient.get<
    ApiResponse<PaginatedAdminData<AdminNetworkUser> | AdminNetworkUser[]>
  >("/master-distributors", { params });
  return normalizePaginated<AdminNetworkUser>(data.data, [
    "masterDistributors",
  ]);
}

export async function createMasterDistributor(
  payload: CreateMasterDistributorApiPayload
) {
  const { data } = await adminModuleClient.post<
    ApiResponse<AdminNetworkUser>
  >("/master-distributors", payload);
  return data.data;
}

export async function getDistributors(
  params: AdminListQueryParams = {}
): Promise<PaginatedAdminData<AdminNetworkUser>> {
  const { data } = await adminModuleClient.get<
    ApiResponse<PaginatedAdminData<AdminNetworkUser> | AdminNetworkUser[]>
  >("/distributors", { params });
  return normalizePaginated<AdminNetworkUser>(data.data, ["distributors"]);
}

export async function getRetailers(
  params: AdminListQueryParams = {}
): Promise<PaginatedAdminData<AdminNetworkUser>> {
  const { data } = await adminModuleClient.get<
    ApiResponse<PaginatedAdminData<AdminNetworkUser> | AdminNetworkUser[]>
  >("/retailers", { params });
  return normalizePaginated<AdminNetworkUser>(data.data, ["retailers"]);
}

export async function createFundRequest(payload: AdminFundRequestPayload) {
  const { data } = await adminModuleClient.post<
    ApiResponse<AdminFundRequestRecord>
  >("/fund-requests", payload);
  return data.data;
}

export async function getFundRequests(
  params: AdminListQueryParams = {}
): Promise<PaginatedAdminData<AdminFundRequestRecord>> {
  const { data } = await adminModuleClient.get<
    ApiResponse<
      PaginatedAdminData<AdminFundRequestRecord> | AdminFundRequestRecord[]
    >
  >("/fund-requests", { params });
  return normalizePaginated<AdminFundRequestRecord>(data.data, [
    "fundRequests",
  ]);
}

export async function getBusinessReport(
  params: AdminListQueryParams = {}
): Promise<AdminBusinessReportData> {
  const { data } = await adminModuleClient.get<
    ApiResponse<AdminBusinessReportData>
  >("/business-report", { params });
  return data.data;
}

export function getNetworkUserName(user: AdminNetworkUser): string {
  if (user.name) return user.name;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return full || user.email || user.mobile || "—";
}

export function getNetworkUserId(user: AdminNetworkUser): string {
  return user.id;
}
