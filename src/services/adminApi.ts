import { adminModuleClient, adminClient } from "@/lib/api/client";
import { WALLET_API } from "@/constants/walletApi";
import { buildWalletTransferPayload, buildWalletDeductPayload } from "@/lib/walletAmount";
import { normalizeWalletBalanceData } from "@/lib/walletBalance";
import { STORAGE_KEYS } from "@/constants/storage";
import {
  AdminDashboardData,
  AdminWalletBalanceData,
  AdminWalletHistoryRecord,
  AdminTransferPayload,
  AdminFundRequestPayload,
  AdminApproveFundRequestPayload,
  AdminRejectFundRequestPayload,
  AdminFundRequestRecord,
  AdminProfile,
  AdminUpdateProfilePayload,
  AdminChangePasswordPayload,
  AdminNetworkUser,
  AdminBusinessReportData,
  AdminListQueryParams,
  PaginatedAdminData,
  AdminAssignBankAccountPayload,
  AdminRemoveBankAssignmentPayload,
  AdminAssignedBankAccount,
} from "@/types/admin";
import { UserFormValues } from "@/validations/userStepSchemas";
import {
  buildUserFormData,
  extractUserFiles,
} from "@/lib/buildUserFormData";
import { ApiResponse } from "@/types";

function readPaginationMeta(
  obj: Record<string, unknown>
): Pick<PaginatedAdminData<unknown>, "total" | "page" | "pageSize" | "totalPages"> {
  const meta =
    obj.meta && typeof obj.meta === "object"
      ? (obj.meta as Record<string, unknown>)
      : obj;

  return {
    total:
      (meta.total as number | undefined) ?? (obj.total as number | undefined),
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

function toApiListParams(params: AdminListQueryParams = {}) {
  const limit = Math.min(params.pageSize ?? 10, 100);
  const transactionType = params.transactionType?.trim() || undefined;

  return {
    page: params.page ?? 1,
    limit,
    search: params.search,
    status: params.status,
    userType: params.userType,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    startDate: params.startDate,
    endDate: params.endDate,
    city: params.city,
    state: params.state,
    // Only send when set — empty string fails API enum validation
    ...(transactionType ? { transactionType } : {}),
  };
}

function parseWalletAmount(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseRecordAmount(value: unknown): number {
  const parsed = parseWalletAmount(value);
  return parsed ?? 0;
}

function normalizeAssignedBankAccount(
  raw: unknown
): AdminAssignedBankAccount | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const bank =
    obj.bankAccount && typeof obj.bankAccount === "object"
      ? (obj.bankAccount as Record<string, unknown>)
      : obj;

  const bankAccountId = String(
    obj.bankAccountId ||
      bank.id ||
      obj.id ||
      obj.assignmentId ||
      ""
  );

  if (!bankAccountId && !bank.bankName && !obj.bankName) return null;

  return {
    id: bankAccountId || undefined,
    bankAccountId: bankAccountId || undefined,
    assignmentId: (obj.assignmentId as string | undefined) ?? undefined,
    accountHolderName: String(
      bank.accountHolderName || obj.accountHolderName || ""
    ),
    bankName: String(bank.bankName || obj.bankName || ""),
    accountNumber: String(bank.accountNumber || obj.accountNumber || ""),
    ifscCode: String(bank.ifscCode || obj.ifscCode || ""),
    status: (obj.status as string | undefined) ?? (bank.status as string | undefined),
    assignedAt: (obj.assignedAt as string | undefined) ?? (obj.createdAt as string | undefined),
  };
}

function normalizeNetworkUser(raw: unknown): AdminNetworkUser {
  if (!raw || typeof raw !== "object") {
    return { id: "" };
  }

  const obj = raw as Record<string, unknown>;
  const wallet =
    obj.wallet && typeof obj.wallet === "object"
      ? (obj.wallet as Record<string, unknown>)
      : undefined;
  const outlet =
    obj.outlet && typeof obj.outlet === "object"
      ? (obj.outlet as Record<string, unknown>)
      : undefined;

  const walletBalance =
    parseWalletAmount(obj.walletBalance) ??
    parseWalletAmount(wallet?.balance) ??
    parseWalletAmount(wallet?.walletBalance) ??
    0;

  const assignedBankAccount =
    normalizeAssignedBankAccount(obj.assignedBankAccount) ||
    normalizeAssignedBankAccount(obj.bankAccountAssignment) ||
    normalizeAssignedBankAccount(obj.systemBankAccount);

  return {
    ...(obj as AdminNetworkUser),
    id: String(obj.id ?? obj._id ?? ""),
    firstName: (obj.firstName as string | undefined) ?? undefined,
    lastName: (obj.lastName as string | undefined) ?? undefined,
    email: (obj.email as string | undefined) ?? undefined,
    mobile: (obj.mobile as string | undefined) ?? undefined,
    status: (obj.status as string | undefined) ?? undefined,
    userType: (obj.userType as string | undefined) ?? undefined,
    city: (obj.city as string | undefined) ?? (outlet?.city as string | undefined),
    state: (obj.state as string | undefined) ?? (outlet?.state as string | undefined),
    walletBalance,
    createdAt: (obj.createdAt as string | undefined) ?? undefined,
    assignedBankAccount,
  };
}

function normalizeTransferRecord(raw: unknown): AdminWalletHistoryRecord {
  if (!raw || typeof raw !== "object") {
    return { id: "", amount: 0 };
  }

  const obj = raw as Record<string, unknown>;
  const receiver =
    obj.receiver && typeof obj.receiver === "object"
      ? (obj.receiver as Record<string, unknown>)
      : undefined;

  const receiverFirstName = receiver?.firstName as string | undefined;
  const receiverLastName = receiver?.lastName as string | undefined;
  const receiverFullName = [receiverFirstName, receiverLastName]
    .filter(Boolean)
    .join(" ");

  const description =
    (obj.description as string | undefined) ??
    (obj.remarks as string | undefined);

  return {
    id: String(obj.id ?? obj.transferId ?? obj.transactionId ?? ""),
    transactionId: String(
      obj.transferId ?? obj.transactionId ?? obj.id ?? ""
    ),
    transferId: String(obj.transferId ?? obj.id ?? ""),
    amount: parseRecordAmount(obj.amount),
    description,
    remarks: description,
    receiverName:
      (obj.receiverName as string | undefined) ||
      receiverFullName ||
      (obj.masterDistributorName as string | undefined) ||
      (obj.recipientName as string | undefined),
    masterDistributorName:
      (obj.masterDistributorName as string | undefined) || receiverFullName,
    recipientName:
      (obj.recipientName as string | undefined) || receiverFullName,
    status: (obj.status as string | undefined) ?? undefined,
    transactionType: (obj.transactionType as string | undefined) ?? "TRANSFER",
    createdAt:
      (obj.createdAt as string | undefined) ??
      (obj.date as string | undefined),
    date: (obj.date as string | undefined) ?? (obj.createdAt as string | undefined),
    previousBalance: parseWalletAmount(obj.previousBalance ?? obj.balanceBefore),
    currentBalance: parseWalletAmount(obj.currentBalance ?? obj.balanceAfter),
    updatedBalance: parseWalletAmount(obj.updatedBalance ?? obj.balanceAfter),
    balanceBefore: parseWalletAmount(obj.balanceBefore ?? obj.previousBalance),
    balanceAfter: parseWalletAmount(obj.balanceAfter ?? obj.currentBalance),
  };
}

export async function createUser(data: UserFormValues, userType: string) {
  const files = extractUserFiles(data);
  const formData = buildUserFormData(data, files, {
    userType,
    includePassword: true,
  });

  const { data: response } = await adminClient.post<
    ApiResponse<AdminNetworkUser>
  >("/users", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeNetworkUser(response.data);
}

export async function getDashboard(): Promise<AdminDashboardData> {
  const { data } = await adminModuleClient.get<ApiResponse<AdminDashboardData>>(
    "/dashboard"
  );
  return data.data;
}

function normalizeWalletBalance(payload: unknown): AdminWalletBalanceData {
  if (!payload || typeof payload !== "object") {
    return { balance: 0, walletBalance: 0 };
  }

  const obj = payload as Record<string, unknown>;

  if (obj.wallet && typeof obj.wallet === "object") {
    const wallet = obj.wallet as Record<string, unknown>;
    const balance =
      parseWalletAmount(wallet.balance) ??
      parseWalletAmount(wallet.walletBalance) ??
      parseWalletAmount(wallet.availableBalance) ??
      0;
    return {
      ...wallet,
      balance,
      walletBalance: balance,
    };
  }

  const balance =
    parseWalletAmount(obj.balance) ??
    parseWalletAmount(obj.walletBalance) ??
    parseWalletAmount(obj.availableBalance) ??
    0;

  return {
    ...(obj as AdminWalletBalanceData),
    balance,
    walletBalance:
      parseWalletAmount(obj.walletBalance) ??
      parseWalletAmount(obj.balance) ??
      balance,
  };
}

export async function getWalletBalance(): Promise<AdminWalletBalanceData> {
  const { data } = await adminClient.get<ApiResponse<unknown>>(WALLET_API.balance);
  return normalizeWalletBalanceData(data.data) as AdminWalletBalanceData;
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
  >("/wallet-history", { params: toApiListParams(params) });
  const normalized = normalizePaginated<unknown>(data.data, ["history"]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeTransferRecord),
  };
}

export async function getTransferHistory(
  params: AdminListQueryParams = {}
): Promise<PaginatedAdminData<AdminWalletHistoryRecord>> {
  const { data } = await adminClient.get<ApiResponse<unknown>>(
    WALLET_API.transfers,
    { params: toApiListParams(params) }
  );
  const normalized = normalizePaginated<unknown>(data.data, [
    "transfers",
    "history",
    "items",
  ]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeTransferRecord),
  };
}

export async function transferBalance(payload: AdminTransferPayload) {
  const { data } = await adminClient.post<ApiResponse<unknown>>(
    WALLET_API.transfer,
    buildWalletTransferPayload(payload)
  );
  return data.data;
}

export async function deductBalance(payload: AdminTransferPayload) {
  const { data } = await adminClient.post<ApiResponse<unknown>>(
    WALLET_API.deduct,
    buildWalletDeductPayload(payload)
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
  const { data } = await adminClient.get<ApiResponse<unknown>>("/users", {
    params: {
      ...toApiListParams(params),
      userType: "MASTER_DISTRIBUTOR",
    },
  });
  const normalized = normalizePaginated<unknown>(data.data, [
    "users",
    "masterDistributors",
    "items",
  ]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeNetworkUser),
  };
}

export async function getDistributors(
  params: AdminListQueryParams = {}
): Promise<PaginatedAdminData<AdminNetworkUser>> {
  const { data } = await adminModuleClient.get<
    ApiResponse<PaginatedAdminData<AdminNetworkUser> | AdminNetworkUser[]>
  >("/distributors", { params: toApiListParams(params) });
  const normalized = normalizePaginated<unknown>(data.data, ["distributors"]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeNetworkUser),
  };
}

export async function getRetailers(
  params: AdminListQueryParams = {}
): Promise<PaginatedAdminData<AdminNetworkUser>> {
  const { data } = await adminModuleClient.get<
    ApiResponse<PaginatedAdminData<AdminNetworkUser> | AdminNetworkUser[]>
  >("/retailers", { params: toApiListParams(params) });
  const normalized = normalizePaginated<unknown>(data.data, ["retailers"]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeNetworkUser),
  };
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
  const { data } = await adminClient.get<
    ApiResponse<
      PaginatedAdminData<AdminFundRequestRecord> | AdminFundRequestRecord[]
    >
  >("/fund-requests/admin/all", { params: toApiListParams(params) });
  const normalized = normalizePaginated<unknown>(data.data, [
    "fundRequests",
    "requests",
    "items",
  ]);
  return {
    ...normalized,
    data: normalized.data.map(normalizeFundRequestRecord),
  };
}

function normalizeFundRequestRecord(raw: unknown): AdminFundRequestRecord {
  if (!raw || typeof raw !== "object") {
    return { id: "", amount: 0, status: "PENDING" };
  }

  const obj = raw as Record<string, unknown>;
  const requester =
    obj.requester && typeof obj.requester === "object"
      ? (obj.requester as Record<string, unknown>)
      : obj.user && typeof obj.user === "object"
        ? (obj.user as Record<string, unknown>)
        : undefined;

  const companyAccount =
    obj.companyAccount && typeof obj.companyAccount === "object"
      ? (obj.companyAccount as Record<string, unknown>)
      : obj.bankAccount && typeof obj.bankAccount === "object"
        ? (obj.bankAccount as Record<string, unknown>)
        : undefined;

  const approver =
    obj.approver && typeof obj.approver === "object"
      ? (obj.approver as Record<string, unknown>)
      : undefined;

  const actionBy =
    obj.actionBy && typeof obj.actionBy === "object"
      ? (obj.actionBy as Record<string, unknown>)
      : obj.approvedBy && typeof obj.approvedBy === "object"
        ? (obj.approvedBy as Record<string, unknown>)
        : obj.rejectedBy && typeof obj.rejectedBy === "object"
          ? (obj.rejectedBy as Record<string, unknown>)
          : obj.admin && typeof obj.admin === "object"
            ? (obj.admin as Record<string, unknown>)
            : approver;

  const requesterFirstName = requester?.firstName as string | undefined;
  const requesterLastName = requester?.lastName as string | undefined;
  const requesterFullName = [requesterFirstName, requesterLastName]
    .filter(Boolean)
    .join(" ");

  const actionFirstName = actionBy?.firstName as string | undefined;
  const actionLastName = actionBy?.lastName as string | undefined;
  const actionFullName = [actionFirstName, actionLastName]
    .filter(Boolean)
    .join(" ");

  const approverFirstName = approver?.firstName as string | undefined;
  const approverLastName = approver?.lastName as string | undefined;
  const approverFullName = [approverFirstName, approverLastName]
    .filter(Boolean)
    .join(" ");

  return {
    id: String(obj.id ?? obj._id ?? ""),
    amount: parseRecordAmount(obj.amount),
    status: String(obj.status ?? "PENDING"),
    remarks: (obj.remarks as string | undefined) ?? undefined,
    adminRemarks:
      (obj.adminRemarks as string | undefined) ??
      (obj.approvalRemarks as string | undefined) ??
      (obj.rejectRemarks as string | undefined) ??
      (obj.rejectionRemarks as string | undefined) ??
      undefined,
    createdAt: (obj.createdAt as string | undefined) ?? undefined,
    updatedAt: (obj.updatedAt as string | undefined) ?? undefined,
    reference: (obj.reference as string | undefined) ?? undefined,
    utr: (obj.utr as string | undefined) ?? undefined,
    referenceNumber:
      (obj.referenceNumber as string | undefined) ??
      (obj.utr as string | undefined) ??
      undefined,
    imageUrl: (obj.imageUrl as string | null | undefined) ?? null,
    paymentMode: (obj.paymentMode as string | undefined) ?? undefined,
    fundingMode: (obj.fundingMode as string | undefined) ?? undefined,
    depositDate: (obj.depositDate as string | undefined) ?? undefined,
    bankName:
      (companyAccount?.bankName as string | undefined) ??
      (obj.bankName as string | undefined),
    accountHolderName:
      (companyAccount?.accountHolderName as string | undefined) ??
      (obj.accountHolderName as string | undefined),
    accountNumber:
      (companyAccount?.accountNumber as string | undefined) ??
      (obj.accountNumber as string | undefined),
    ifscCode:
      (companyAccount?.ifscCode as string | undefined) ??
      (obj.ifscCode as string | undefined),
    branchName:
      (companyAccount?.branchName as string | undefined) ??
      (obj.branchName as string | undefined),
    requesterId:
      String(obj.requesterId ?? obj.userId ?? requester?.id ?? "") || undefined,
    requesterName:
      (obj.requesterName as string | undefined) ||
      (obj.userName as string | undefined) ||
      requesterFullName ||
      (requester?.name as string | undefined) ||
      (requester?.fullName as string | undefined),
    requesterFirstName: requesterFirstName,
    requesterLastName: requesterLastName,
    requesterType:
      (obj.requesterType as string | undefined) ||
      (obj.userType as string | undefined) ||
      (requester?.userType as string | undefined),
    requesterMobile:
      (obj.requesterMobile as string | undefined) ||
      (obj.mobile as string | undefined) ||
      (requester?.mobile as string | undefined),
    requesterEmail:
      (obj.requesterEmail as string | undefined) ||
      (requester?.email as string | undefined),
    requesterUserCode:
      (obj.requesterUserCode as string | undefined) ||
      (requester?.userCode as string | undefined),
    userId: (obj.userId as string | undefined) ?? undefined,
    userName: (obj.userName as string | undefined) ?? undefined,
    userType:
      (obj.userType as string | undefined) ||
      (requester?.userType as string | undefined),
    actionById: String(obj.actionById ?? actionBy?.id ?? "") || undefined,
    actionByName:
      (obj.actionByName as string | undefined) ||
      (obj.approvedByName as string | undefined) ||
      (obj.rejectedByName as string | undefined) ||
      actionFullName ||
      (actionBy?.name as string | undefined) ||
      (actionBy?.fullName as string | undefined),
    actionByType:
      (obj.actionByType as string | undefined) ||
      (actionBy?.userType as string | undefined),
    approverName:
      approverFullName ||
      (approver?.name as string | undefined) ||
      (approver?.fullName as string | undefined),
    approverType: (approver?.userType as string | undefined) ?? undefined,
    approvedAt: (obj.approvedAt as string | undefined) ?? undefined,
    rejectedAt: (obj.rejectedAt as string | undefined) ?? undefined,
  };
}

export async function approveFundRequest(
  payload: AdminApproveFundRequestPayload
): Promise<{ record: AdminFundRequestRecord; message: string }> {
  const { data } = await adminClient.put<ApiResponse<AdminFundRequestRecord>>(
    "/fund-requests/approve",
    {
      id: payload.id,
      fundRequestId: payload.id,
      adminRemarks: payload.remarks,
      remarks: payload.remarks,
    }
  );
  return {
    record: normalizeFundRequestRecord(data.data),
    message:
      (typeof data.message === "string" && data.message.trim()) ||
      "Fund request approved successfully",
  };
}

export async function rejectFundRequest(
  payload: AdminRejectFundRequestPayload
): Promise<{ record: AdminFundRequestRecord; message: string }> {
  const { data } = await adminClient.put<ApiResponse<AdminFundRequestRecord>>(
    "/fund-requests/reject",
    {
      id: payload.id,
      fundRequestId: payload.id,
      adminRemarks: payload.remarks,
      remarks: payload.remarks,
    }
  );
  return {
    record: normalizeFundRequestRecord(data.data),
    message:
      (typeof data.message === "string" && data.message.trim()) ||
      "Fund request rejected",
  };
}

export async function getBusinessReport(
  params: AdminListQueryParams = {}
): Promise<AdminBusinessReportData> {
  const { data } = await adminModuleClient.get<
    ApiResponse<AdminBusinessReportData>
  >("/business-report", { params: toApiListParams(params) });
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

export function getNetworkUserBalance(user: AdminNetworkUser): number {
  return user.walletBalance ?? 0;
}

/** Active system bank accounts available for admin assignment */
export { getAdminBankAccounts } from "@/services/bankAccountApi";

export async function assignBankAccountToUser(
  payload: AdminAssignBankAccountPayload | { userId: string; bankAccountId: string }
): Promise<{ data: unknown; message: string }> {
  const body: AdminAssignBankAccountPayload =
    "userIds" in payload
      ? payload
      : {
          userIds: [payload.userId],
          bankAccountId: payload.bankAccountId,
        };

  const { data } = await adminClient.post<ApiResponse<unknown>>(
    "/bank-accounts/assign",
    body
  );
  return {
    data: data.data,
    message:
      (typeof data.message === "string" && data.message.trim()) ||
      "Bank account assigned successfully",
  };
}

export async function removeBankAccountAssignment(
  payload: AdminRemoveBankAssignmentPayload
): Promise<{ data: unknown; message: string }> {
  const { data } = await adminClient.delete<ApiResponse<unknown>>(
    "/bank-accounts/assign",
    { data: payload }
  );
  return {
    data: data.data,
    message:
      (typeof data.message === "string" && data.message.trim()) ||
      "Bank assignment removed",
  };
}
