import { adminModuleClient } from "@/lib/api/client";
import { normalizeUserDetail } from "@/lib/normalizeUser";
import { ApiResponse } from "@/types";
import {
  AdminListQueryParams,
  PaginatedAdminData,
} from "@/types/admin";
import { NetworkUserRecord, UserDetailRecord } from "@/types/superAdmin";

export type AdminManagedUserRole =
  | "MASTER_DISTRIBUTOR"
  | "DISTRIBUTOR"
  | "RETAILER";

export type AdminUserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

export interface AdminUsersListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "name" | "email" | "phone" | "createdAt" | string;
  sortOrder?: "asc" | "desc";
  fromDate?: string;
  toDate?: string;
  status?: string;
  role?: AdminManagedUserRole;
}

export interface AdminUserUpdatePayload {
  name?: string;
  firstName?: string;
  lastName?: string | null;
  email?: string;
  phone?: string;
  mobile?: string;
  status?: AdminUserStatus;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const obj = asRecord(payload);
  for (const key of ["data", "users", "items", "results"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
    // Nested object-map: { data: { "0": {...}, "1": {...} } }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = Object.values(value as Record<string, unknown>);
      if (
        nested.length &&
        nested.every(
          (item) => item && typeof item === "object" && !Array.isArray(item)
        )
      ) {
        return nested;
      }
    }
  }

  // API sometimes returns `{ "0": {...}, "1": {...} }` instead of an array
  const values = Object.values(obj);
  if (
    values.length &&
    values.every(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    ) &&
    // Avoid treating pagination meta objects as list items
    values.some((item) => {
      const rec = asRecord(item);
      return Boolean(rec.id || rec.email || rec.phone || rec.mobile);
    })
  ) {
    return values;
  }

  return [];
}

function normalizeListItem(raw: unknown): NetworkUserRecord {
  const detail = normalizeUserDetail(raw);
  return detail;
}

function toListQuery(params: AdminUsersListParams = {}) {
  const pageSize = Math.min(params.pageSize ?? 10, 100);
  const sortBy =
    params.sortBy === "mobile" ? "phone" : params.sortBy || "createdAt";

  let status = params.status?.trim();
  if (status) {
    status = status.toUpperCase();
    if (status === "BLOCKED") status = "SUSPENDED";
  }

  return {
    page: params.page ?? 1,
    pageSize,
    limit: pageSize,
    search: params.search || undefined,
    sortBy,
    sortOrder: params.sortOrder || "desc",
    fromDate: params.fromDate || undefined,
    toDate: params.toDate || undefined,
    status: status || undefined,
    role: params.role,
  };
}

/** GET /api/v1/admin/users */
export async function listAdminUsers(
  params: AdminUsersListParams = {}
): Promise<PaginatedAdminData<NetworkUserRecord>> {
  const { data } = await adminModuleClient.get<ApiResponse<unknown>>("/users", {
    params: toListQuery(params),
  });

  const payload = data.data;
  const items = extractList(payload).map(normalizeListItem);
  const obj = asRecord(payload);
  const meta = asRecord(obj.meta ?? obj.pagination);

  const total = Number(meta.total ?? obj.total ?? items.length) || items.length;
  const page = Number(meta.page ?? obj.page ?? params.page ?? 1) || 1;
  const pageSize =
    Number(meta.pageSize ?? meta.limit ?? obj.pageSize ?? obj.limit ?? params.pageSize ?? 10) ||
    10;

  return {
    data: items,
    total,
    page,
    pageSize,
    totalPages: Number(meta.totalPages ?? obj.totalPages) || Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Fetch all pages for export (respects current filters). */
export async function listAllAdminUsers(
  params: Omit<AdminUsersListParams, "page" | "pageSize"> = {}
): Promise<NetworkUserRecord[]> {
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;
  const collected: NetworkUserRecord[] = [];

  do {
    const result = await listAdminUsers({ ...params, page, pageSize });
    collected.push(...result.data);
    totalPages = result.totalPages || Math.max(1, Math.ceil((result.total || 0) / pageSize));
    if (!result.data.length) break;
    page += 1;
  } while (page <= totalPages);

  return collected;
}

/** GET /api/v1/admin/users/:id */
export async function getAdminUserById(id: string): Promise<UserDetailRecord> {
  const { data } = await adminModuleClient.get<ApiResponse<unknown>>(
    `/users/${id}`
  );
  return normalizeUserDetail(data.data);
}

/** PATCH /api/v1/admin/users/:id */
export async function patchAdminUser(
  id: string,
  payload: AdminUserUpdatePayload
): Promise<UserDetailRecord> {
  const body: AdminUserUpdatePayload = {};
  if (payload.firstName !== undefined) body.firstName = payload.firstName.trim();
  if (payload.lastName !== undefined) {
    body.lastName = payload.lastName?.trim() || null;
  }
  if (payload.name !== undefined) body.name = payload.name.trim();
  if (payload.email !== undefined) body.email = payload.email.trim();
  if (payload.phone !== undefined) body.phone = payload.phone.trim();
  if (payload.mobile !== undefined) body.mobile = payload.mobile.trim();
  if (payload.status !== undefined) body.status = payload.status;

  // Prefer phone; also send mobile alias when phone present
  if (body.phone && !body.mobile) body.mobile = body.phone;
  if (body.mobile && !body.phone) body.phone = body.mobile;

  if (!body.name && (body.firstName || body.lastName)) {
    body.name = [body.firstName, body.lastName].filter(Boolean).join(" ").trim();
  }

  const { data } = await adminModuleClient.patch<ApiResponse<unknown>>(
    `/users/${id}`,
    body
  );
  return normalizeUserDetail(data.data);
}

/** DELETE /api/v1/admin/users/:id (soft delete) */
export async function deleteAdminUser(id: string): Promise<void> {
  await adminModuleClient.delete(`/users/${id}`);
}

/** Map older filter shape used by AdminListFilters → admin users query */
export function mapAdminListFiltersToUsersParams(
  filters: Pick<
    AdminListQueryParams,
    "search" | "status" | "sortBy" | "sortOrder" | "startDate" | "endDate"
  > & { search?: string },
  role: AdminManagedUserRole
): AdminUsersListParams {
  const sortBy =
    filters.sortBy === "mobile"
      ? "phone"
      : filters.sortBy === "name" ||
          filters.sortBy === "email" ||
          filters.sortBy === "phone" ||
          filters.sortBy === "createdAt"
        ? filters.sortBy
        : "createdAt";

  return {
    search: filters.search,
    status: filters.status,
    sortBy,
    sortOrder: filters.sortOrder,
    fromDate: filters.startDate,
    toDate: filters.endDate,
    role,
  };
}
