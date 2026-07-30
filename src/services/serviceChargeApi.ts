import { superAdminClient } from "@/lib/api/client";
import { ApiResponse } from "@/types";
import {
  PaginatedServiceChargeHistory,
  PaginatedServiceCharges,
  ServiceChargeApiBody,
  ServiceChargeHistoryParams,
  ServiceChargeHistoryRecord,
  ServiceChargeListParams,
  ServiceChargePayload,
  ServiceChargePlan,
  ServiceChargeRole,
  ServiceChargeStatus,
  ServiceChargeTargetUser,
  ServiceChargeType,
  ServiceChargeFrequency,
} from "@/types/serviceCharge";

/** Base: /api/v1 (via superAdminClient) */
const PLANS_BASE = "/service-charge/plans";
const HISTORY_BASE = "/service-charge/history";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function unwrapData(payload: unknown): unknown {
  const obj = asRecord(payload);
  if ("data" in obj) return obj.data;
  return payload;
}

function readPagination(
  obj: Record<string, unknown>,
  fallbackLimit: number
): Pick<PaginatedServiceCharges, "total" | "page" | "pageSize" | "totalPages"> {
  const meta = asRecord(obj.meta ?? obj.pagination ?? obj);
  const page = toNumber(meta.page ?? obj.page, 1);
  const pageSize = toNumber(
    meta.limit ?? meta.pageSize ?? obj.limit ?? obj.pageSize,
    fallbackLimit
  );
  const total = toNumber(meta.total ?? obj.total, 0);
  const totalPages =
    toNumber(meta.totalPages ?? obj.totalPages) ||
    (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1);

  return { total, page, pageSize, totalPages };
}

function normalizeTargetUsers(raw: unknown): ServiceChargeTargetUser[] {
  if (!Array.isArray(raw)) return [];
  const result: ServiceChargeTargetUser[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      result.push({ id: item, name: item });
      continue;
    }
    const obj = asRecord(item);
    const id = String(obj.id ?? obj.userId ?? obj._id ?? "");
    if (!id) continue;
    const name =
      String(
        obj.name ||
          [obj.firstName, obj.lastName].filter(Boolean).join(" ") ||
          obj.userCode ||
          id
      ) || id;
    result.push({
      id,
      name,
      userCode: toStringOrNull(obj.userCode),
      mobile: toStringOrNull(obj.mobile),
    });
  }
  return result;
}

function normalizeIdList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") {
          return String(item);
        }
        const obj = asRecord(item);
        return String(obj.id ?? obj.userId ?? "");
      })
      .filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeStatus(raw: unknown): ServiceChargeStatus {
  const value = String(raw || "ACTIVE").toUpperCase();
  if (
    ["ACTIVE", "PAUSED", "INACTIVE", "COMPLETED", "DRAFT"].includes(value)
  ) {
    return value as ServiceChargeStatus;
  }
  return "ACTIVE";
}

function normalizeFrequency(raw: unknown): ServiceChargeFrequency {
  const value = String(raw || "MONTHLY").toUpperCase();
  if (["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(value)) {
    return value as ServiceChargeFrequency;
  }
  return "MONTHLY";
}

function normalizeChargeType(raw: unknown): ServiceChargeType {
  return String(raw || "FIXED").toUpperCase() === "PERCENTAGE"
    ? "PERCENTAGE"
    : "FIXED";
}

function parsePlanResponse(data: unknown): ServiceChargePlan {
  const payload = unwrapData(data);
  const obj = asRecord(payload);
  return normalizeServiceChargePlan(obj.item ?? obj.plan ?? payload);
}

function normalizeRole(raw: unknown): ServiceChargeRole {
  const value = String(raw || "").toUpperCase();
  if (
    value === "RETAILER" ||
    value === "DISTRIBUTOR" ||
    value === "MASTER_DISTRIBUTOR"
  ) {
    return value;
  }
  return "RETAILER";
}

export function normalizeServiceChargePlan(raw: unknown): ServiceChargePlan {
  const obj = asRecord(raw);
  const createdByRaw = obj.createdBy ?? obj.created_by;
  const createdByObj = asRecord(createdByRaw);
  const role = normalizeRole(
    obj.role ??
      (Array.isArray(obj.applicableRoles) ? obj.applicableRoles[0] : null)
  );
  const retailerId = toStringOrNull(
    obj.retailerId ?? obj.targetUserId ?? obj.userId
  );
  const targetUserId = toStringOrNull(obj.targetUserId ?? obj.retailerId);
  const retailers = normalizeTargetUsers(
    obj.retailers ?? obj.selectedRetailers ?? obj.targetRetailers
  );
  const retailerIds = (() => {
    const fromIds = normalizeIdList(
      obj.retailerIds ?? obj.userIds ?? obj.selectedRetailerIds
    );
    if (fromIds.length) return fromIds;
    if (retailerId) return [retailerId];
    return retailers.map((item) => item.id);
  })();

  return {
    id: String(obj.id ?? obj._id ?? ""),
    planName: String(obj.name ?? obj.planName ?? obj.title ?? ""),
    amount: toNumber(obj.amount),
    chargeType: normalizeChargeType(obj.chargeType ?? obj.type),
    frequency: normalizeFrequency(obj.frequency),
    cronExpression: toStringOrNull(obj.cronExpression),
    executionTime: String(obj.executionTime ?? obj.time ?? "00:00").slice(0, 5),
    executionDay: (obj.executionDay ?? obj.day ?? null) as
      | number
      | string
      | null,
    executionMonth:
      obj.executionMonth === null || obj.executionMonth === undefined
        ? null
        : toNumber(obj.executionMonth),
    role,
    applicableRoles: [role],
    retailerId,
    targetUserId,
    retailers,
    retailerIds,
    startDate: String(obj.startDate ?? obj.start_date ?? ""),
    endDate: toStringOrNull(obj.endDate ?? obj.end_date),
    remarks: toStringOrNull(obj.remarks),
    status: normalizeStatus(obj.status),
    createdBy:
      typeof createdByRaw === "string"
        ? createdByRaw
        : createdByRaw
          ? {
              id: toStringOrNull(createdByObj.id),
              name: toStringOrNull(
                createdByObj.name ??
                  [createdByObj.firstName, createdByObj.lastName]
                    .filter(Boolean)
                    .join(" ")
              ),
              email: toStringOrNull(createdByObj.email),
            }
          : null,
    createdByName: toStringOrNull(
      obj.createdByName ??
        createdByObj.name ??
        [createdByObj.firstName, createdByObj.lastName]
          .filter(Boolean)
          .join(" ")
    ),
    createdAt: toStringOrNull(obj.createdAt ?? obj.created_at),
    updatedAt: toStringOrNull(obj.updatedAt ?? obj.updated_at),
    lastRunAt: toStringOrNull(obj.lastRunAt ?? obj.last_run_at),
    nextRunAt: toStringOrNull(obj.nextRunAt ?? obj.next_run_at),
  };
}

export function normalizeServiceChargeHistory(
  raw: unknown
): ServiceChargeHistoryRecord {
  const obj = asRecord(raw);
  const user = asRecord(obj.user ?? obj.retailer ?? obj.account);

  return {
    id: String(obj.id ?? obj._id ?? `${obj.executionDate}-${obj.userId ?? ""}`),
    planId: toStringOrNull(
      obj.planId ?? obj.serviceChargeId ?? obj.chargePlanId
    ),
    planName: toStringOrNull(
      obj.planName ?? asRecord(obj.plan).name ?? asRecord(obj.plan).planName
    ),
    executionDate: String(
      obj.executionDate ?? obj.executedAt ?? obj.createdAt ?? ""
    ),
    userId: toStringOrNull(obj.userId ?? user.id),
    userName: String(
      obj.userName ??
        user.name ??
        [user.firstName, user.lastName].filter(Boolean).join(" ") ??
        "—"
    ),
    role: String(obj.role ?? obj.userType ?? user.role ?? user.userType ?? "—"),
    amount: toNumber(obj.amount ?? obj.chargedAmount),
    status: String(obj.status ?? "PENDING").toUpperCase(),
    billingCycle: toStringOrNull(obj.billingCycle ?? obj.cycle),
    failureReason: toStringOrNull(
      obj.failureReason ?? obj.errorMessage ?? obj.reason
    ),
    createdAt: toStringOrNull(obj.createdAt),
  };
}

function normalizePaginatedPlans(
  payload: unknown,
  fallbackLimit: number
): PaginatedServiceCharges {
  const unwrapped = unwrapData(payload);
  const root = asRecord(unwrapped);
  const items = Array.isArray(unwrapped)
    ? unwrapped
    : Array.isArray(root.items)
      ? root.items
      : Array.isArray(root.data)
        ? root.data
        : Array.isArray(root.records)
          ? root.records
          : Array.isArray(root.plans)
            ? root.plans
            : [];

  const pagination = readPagination(
    Array.isArray(unwrapped) ? {} : root,
    fallbackLimit
  );

  return {
    data: items.map(normalizeServiceChargePlan),
    total: pagination.total || items.length,
    page: pagination.page,
    pageSize: pagination.pageSize || fallbackLimit,
    totalPages: pagination.totalPages,
  };
}

function normalizePaginatedHistory(
  payload: unknown,
  fallbackLimit: number
): PaginatedServiceChargeHistory {
  const unwrapped = unwrapData(payload);
  const root = asRecord(unwrapped);
  const items = Array.isArray(unwrapped)
    ? unwrapped
    : Array.isArray(root.items)
      ? root.items
      : Array.isArray(root.data)
        ? root.data
        : Array.isArray(root.records)
          ? root.records
          : Array.isArray(root.history)
            ? root.history
            : [];

  const pagination = readPagination(
    Array.isArray(unwrapped) ? {} : root,
    fallbackLimit
  );

  return {
    data: items.map(normalizeServiceChargeHistory),
    total: pagination.total || items.length,
    page: pagination.page,
    pageSize: pagination.pageSize || fallbackLimit,
    totalPages: pagination.totalPages,
  };
}

function buildListQuery(params: ServiceChargeListParams) {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    search: params.search || undefined,
    status: params.status || undefined,
    frequency: params.frequency || undefined,
    role: params.role || undefined,
    startDate: params.startDate || undefined,
    endDate: params.endDate || undefined,
    sortBy: params.sortBy || "createdAt",
    sortOrder: params.sortOrder || "desc",
  };
}

function buildHistoryQuery(params: ServiceChargeHistoryParams) {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    search: params.search || undefined,
    status: params.status || undefined,
    role: params.role || undefined,
    startDate: params.startDate || undefined,
    endDate: params.endDate || undefined,
    planId: params.planId || undefined,
  };
}

/** GET /api/v1/service-charge/plans */
export async function listServiceCharges(
  params: ServiceChargeListParams = {}
): Promise<PaginatedServiceCharges> {
  const { data } = await superAdminClient.get<ApiResponse<unknown>>(
    PLANS_BASE,
    { params: buildListQuery(params) }
  );
  return normalizePaginatedPlans(data, params.limit ?? 20);
}

/** GET /api/v1/service-charge/plans/:id */
export async function getServiceChargeById(
  id: string
): Promise<ServiceChargePlan> {
  const { data } = await superAdminClient.get<ApiResponse<unknown>>(
    `${PLANS_BASE}/${id}`
  );
  return parsePlanResponse(data);
}

/** POST /api/v1/service-charge/plans */
export async function createServiceCharge(
  payload: ServiceChargeApiBody
): Promise<ServiceChargePlan> {
  const { data } = await superAdminClient.post<ApiResponse<unknown>>(
    PLANS_BASE,
    payload
  );
  return parsePlanResponse(data);
}

/** PUT /api/v1/service-charge/plans/:id */
export async function updateServiceCharge(
  id: string,
  payload: ServiceChargeApiBody
): Promise<ServiceChargePlan> {
  const { data } = await superAdminClient.put<ApiResponse<unknown>>(
    `${PLANS_BASE}/${id}`,
    payload
  );
  return parsePlanResponse(data);
}

/** DELETE /api/v1/service-charge/plans/:id */
export async function deleteServiceCharge(id: string): Promise<void> {
  await superAdminClient.delete(`${PLANS_BASE}/${id}`);
}

/** PATCH /api/v1/service-charge/plans/:id/pause */
export async function pauseServiceCharge(
  id: string
): Promise<ServiceChargePlan> {
  const { data } = await superAdminClient.patch<ApiResponse<unknown>>(
    `${PLANS_BASE}/${id}/pause`
  );
  const body = unwrapData(data);
  if (!body) return normalizeServiceChargePlan({ id, status: "PAUSED" });
  return parsePlanResponse(data);
}

/** PATCH /api/v1/service-charge/plans/:id/resume */
export async function resumeServiceCharge(
  id: string
): Promise<ServiceChargePlan> {
  const { data } = await superAdminClient.patch<ApiResponse<unknown>>(
    `${PLANS_BASE}/${id}/resume`
  );
  const body = unwrapData(data);
  if (!body) return normalizeServiceChargePlan({ id, status: "ACTIVE" });
  return parsePlanResponse(data);
}

/** POST /api/v1/service-charge/plans/:id/run */
export async function runServiceChargeNow(
  id: string
): Promise<ServiceChargePlan | void> {
  const { data } = await superAdminClient.post<ApiResponse<unknown>>(
    `${PLANS_BASE}/${id}/run`
  );
  const body = unwrapData(data);
  if (!body) return;
  return parsePlanResponse(data);
}

/** GET /api/v1/service-charge/history */
export async function listServiceChargeHistory(
  params: ServiceChargeHistoryParams = {}
): Promise<PaginatedServiceChargeHistory> {
  const { data } = await superAdminClient.get<ApiResponse<unknown>>(
    HISTORY_BASE,
    { params: buildHistoryQuery(params) }
  );
  return normalizePaginatedHistory(data, params.limit ?? 20);
}

/**
 * Plan-scoped history via GET /api/v1/service-charge/history?planId=:id
 */
export async function listServiceChargePlanHistory(
  id: string,
  params: ServiceChargeHistoryParams = {}
): Promise<PaginatedServiceChargeHistory> {
  return listServiceChargeHistory({ ...params, planId: id });
}

/** Backend expects JSON Schema date-time (ISO-8601). */
function toDateTime(value?: string | null, endOfDay = false): string | null {
  if (!value || !String(value).trim()) return null;
  const raw = String(value).trim();

  // Already ISO date-time
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  // Date-only from <input type="date"> → YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
    const parsed = new Date(`${raw}${suffix}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function toServiceChargePayload(
  values: ServiceChargePayload,
  retailerId?: string | null
): ServiceChargeApiBody {
  const frequency = values.frequency;

  let executionDay: number | null = null;
  if (frequency === "WEEKLY" || frequency === "MONTHLY" || frequency === "YEARLY") {
    const day = Number(values.executionDay);
    executionDay = Number.isFinite(day) ? day : null;
  }

  let executionMonth: number | null = null;
  if (frequency === "YEARLY") {
    const month = Number(values.executionMonth);
    executionMonth = Number.isFinite(month) ? month : null;
  }

  const targetId =
    values.role === "RETAILER" && retailerId
      ? retailerId
      : values.role === "RETAILER" && values.retailerIds?.[0]
        ? values.retailerIds[0]
        : null;

  const startDate = toDateTime(values.startDate, false);
  if (!startDate) {
    throw new Error("Start date is invalid");
  }

  return {
    name: values.planName.trim(),
    amount: Number(values.amount),
    chargeType: values.chargeType || "FIXED",
    frequency,
    executionTime: values.executionTime,
    executionDay,
    executionMonth,
    role: values.role,
    retailerId: targetId,
    targetUserId: targetId,
    startDate,
    endDate: toDateTime(values.endDate, true),
    remarks: values.remarks?.trim() ? values.remarks.trim() : null,
    status: values.status,
  };
}

/**
 * Backend accepts one retailerId per plan.
 * Multiple selected retailers → one API body each.
 */
export function toServiceChargeApiBodies(
  values: ServiceChargePayload
): ServiceChargeApiBody[] {
  if (values.role === "RETAILER" && (values.retailerIds?.length || 0) > 0) {
    return values.retailerIds!.map((id) => toServiceChargePayload(values, id));
  }
  return [toServiceChargePayload(values, null)];
}
