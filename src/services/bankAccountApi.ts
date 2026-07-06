import { adminClient, superAdminClient } from "@/lib/api/client";
import { normalizeBankAccountRecord } from "@/lib/normalizeBankAccount";
import {
  BankAccountListParams,
  BankAccountRecord,
  CreateBankAccountPayload,
  PaginatedBankAccounts,
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
