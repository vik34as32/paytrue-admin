import { adminClient, superAdminClient } from "@/lib/api/client";
import { normalizeBankAccountRecord } from "@/lib/normalizeBankAccount";
import {
  BankAccountListParams,
  BankAccountRecord,
  BankAccountAssignmentRecord,
  BankAccountAssignmentsParams,
  CreateBankAccountPayload,
  PaginatedBankAccounts,
  PaginatedBankAccountAssignments,
  UpdateBankAccountPayload,
} from "@/types/bankAccount";
import { ApiResponse } from "@/types";

function readPaginationMeta(
  obj: Record<string, unknown>
): Pick<PaginatedBankAccounts, "total" | "page" | "pageSize" | "totalPages"> {
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

function normalizePaginated(
  result: unknown,
  nestedKeys: string[] = []
): PaginatedBankAccounts {
  if (Array.isArray(result)) {
    return {
      data: result.map((item) =>
        normalizeBankAccountRecord(item as Record<string, unknown>)
      ),
      total: result.length,
      page: 1,
      pageSize: result.length,
    };
  }

  if (result && typeof result === "object") {
    const obj = result as Record<string, unknown>;

    const mapItems = (items: unknown[]) =>
      items.map((item) =>
        normalizeBankAccountRecord(item as Record<string, unknown>)
      );

    if (Array.isArray(obj.items)) {
      const pagination = readPaginationMeta(obj);
      return {
        data: mapItems(obj.items),
        total: pagination.total ?? obj.items.length,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: pagination.totalPages,
      };
    }

    if (Array.isArray(obj.data)) {
      const pagination = readPaginationMeta(obj);
      return {
        data: mapItems(obj.data),
        total: pagination.total ?? obj.data.length,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: pagination.totalPages,
      };
    }

    for (const key of nestedKeys) {
      if (Array.isArray(obj[key])) {
        const arr = obj[key] as unknown[];
        const pagination = readPaginationMeta(obj);
        return {
          data: mapItems(arr),
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

function unwrapRecord(data: unknown): Record<string, unknown> {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj.bankAccount && typeof obj.bankAccount === "object") {
      return obj.bankAccount as Record<string, unknown>;
    }
    return obj;
  }
  return {};
}

async function fetchBankAccounts(
  client: typeof adminClient,
  params: BankAccountListParams = {}
): Promise<PaginatedBankAccounts> {
  const { pageSize = 100, page = 1, sortOrder, sortBy, ...rest } = params;
  const { data } = await client.get<
    ApiResponse<PaginatedBankAccounts | BankAccountRecord[]>
  >("/bank-accounts", {
    params: {
      ...rest,
      page,
      limit: pageSize,
      pageSize,
      sortBy,
      sortOrder,
    },
  });

  return normalizePaginated(data.data, ["bankAccounts", "accounts"]);
}

export async function getBankAccounts(
  params: BankAccountListParams = {}
): Promise<PaginatedBankAccounts> {
  return fetchBankAccounts(superAdminClient, params);
}

/** Authorized bank list for admin assign-bank page */
export async function getAdminBankAccounts(
  params: BankAccountListParams = { page: 1, pageSize: 100 }
): Promise<BankAccountRecord[]> {
  const result = await fetchBankAccounts(adminClient, params);
  return result.data.filter(
    (account) =>
      account.isActive !== false &&
      (account.status?.toUpperCase() ?? "ACTIVE") !== "INACTIVE"
  );
}

export async function getBankAccountById(id: string): Promise<BankAccountRecord> {
  const { data } = await superAdminClient.get<
    ApiResponse<Record<string, unknown>>
  >(`/bank-accounts/${id}`);
  return normalizeBankAccountRecord(unwrapRecord(data.data));
}

export async function createBankAccount(
  payload: CreateBankAccountPayload
): Promise<BankAccountRecord> {
  const { data } = await superAdminClient.post<
    ApiResponse<Record<string, unknown>>
  >("/bank-accounts", {
    ...payload,
    ifscCode: payload.ifscCode.toUpperCase(),
  });
  return normalizeBankAccountRecord(unwrapRecord(data.data));
}

export async function updateBankAccountById(
  id: string,
  payload: UpdateBankAccountPayload
): Promise<BankAccountRecord> {
  const { data } = await superAdminClient.put<
    ApiResponse<Record<string, unknown>>
  >(`/bank-accounts/${id}`, {
    ...payload,
    ifscCode: payload.ifscCode?.toUpperCase(),
  });
  return normalizeBankAccountRecord(unwrapRecord(data.data));
}

export async function deleteBankAccountById(id: string): Promise<void> {
  await superAdminClient.delete(`/bank-accounts/${id}`);
}

function formatUserTypeLabel(userType?: string): string {
  if (!userType) return "—";
  return userType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readNestedUser(raw: Record<string, unknown>) {
  return raw.user && typeof raw.user === "object"
    ? (raw.user as Record<string, unknown>)
    : raw;
}

function readNestedBank(raw: Record<string, unknown>) {
  if (raw.bankAccount && typeof raw.bankAccount === "object") {
    return raw.bankAccount as Record<string, unknown>;
  }
  if (raw.bank && typeof raw.bank === "object") {
    return raw.bank as Record<string, unknown>;
  }
  return raw;
}

export function normalizeBankAccountAssignment(
  raw: unknown
): BankAccountAssignmentRecord {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const user = readNestedUser(obj);
  const bank = readNestedBank(obj);

  const firstName = (user.firstName as string | undefined) ?? undefined;
  const lastName = (user.lastName as string | undefined) ?? undefined;
  const name =
    (user.fullName as string | undefined) ||
    (user.name as string | undefined) ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    (user.email as string | undefined) ||
    (user.mobile as string | undefined) ||
    "—";

  const userType =
    (obj.userType as string | undefined) ||
    (user.userType as string | undefined) ||
    undefined;

  const userId = String(
    obj.userId || user.id || obj.assignedUserId || ""
  );
  const bankAccountId = String(
    obj.bankAccountId || bank.id || bank.bankAccountId || ""
  );

  return {
    id: String(obj.id || obj.assignmentId || `${userId}-${bankAccountId}`),
    userId,
    bankAccountId,
    userType,
    userTypeLabel: formatUserTypeLabel(userType),
    name,
    mobile: (user.mobile as string | undefined) ?? (obj.mobile as string | undefined),
    email: (user.email as string | undefined) ?? (obj.email as string | undefined),
    userCode:
      (user.userCode as string | undefined) ??
      (obj.userCode as string | undefined),
    bankName:
      (bank.bankName as string | undefined) ??
      (obj.bankName as string | undefined),
    accountNumber:
      (bank.accountNumber as string | undefined) ??
      (obj.accountNumber as string | undefined),
    ifscCode:
      (bank.ifscCode as string | undefined) ??
      (obj.ifscCode as string | undefined),
    accountHolderName:
      (bank.accountHolderName as string | undefined) ??
      (obj.accountHolderName as string | undefined),
    status: (obj.status as string | undefined) ?? undefined,
    assignedAt:
      (obj.assignedAt as string | undefined) ??
      (obj.createdAt as string | undefined),
  };
}

function normalizeAssignmentsPaginated(
  result: unknown,
  params: BankAccountAssignmentsParams
): PaginatedBankAccountAssignments {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;

  if (Array.isArray(result)) {
    return {
      data: result.map(normalizeBankAccountAssignment),
      total: result.length,
      page,
      pageSize,
    };
  }

  if (result && typeof result === "object") {
    const obj = result as Record<string, unknown>;
    const nestedKeys = ["assignments", "data", "items", "results"];
    let items: unknown[] = [];

    for (const key of nestedKeys) {
      if (Array.isArray(obj[key])) {
        items = obj[key] as unknown[];
        break;
      }
    }

    const meta =
      obj.meta && typeof obj.meta === "object"
        ? (obj.meta as Record<string, unknown>)
        : obj;

    return {
      data: items.map(normalizeBankAccountAssignment),
      total: Number(meta.total ?? obj.total ?? items.length) || items.length,
      page: Number(meta.page ?? obj.page ?? page) || page,
      pageSize: Number(
        meta.pageSize ?? meta.limit ?? obj.pageSize ?? obj.limit ?? pageSize
      ) || pageSize,
      totalPages: Number(meta.totalPages ?? obj.totalPages) || undefined,
    };
  }

  return { data: [], total: 0, page, pageSize };
}

/** ADMIN — GET /bank-accounts/assignments */
export async function getBankAccountAssignments(
  params: BankAccountAssignmentsParams = {}
): Promise<PaginatedBankAccountAssignments> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;

  const { data } = await adminClient.get<ApiResponse<unknown>>(
    "/bank-accounts/assignments",
    {
      params: {
        page,
        pageSize,
        limit: pageSize,
        search: params.search || undefined,
        userType: params.userType || undefined,
        status: params.status || undefined,
      },
    }
  );

  return normalizeAssignmentsPaginated(data.data, { page, pageSize });
}
