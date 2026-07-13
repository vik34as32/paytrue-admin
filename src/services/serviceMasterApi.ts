import { superAdminServicesClient } from "@/lib/api/adminServicesClient";
import { adminModuleClient } from "@/lib/api/client";
import { commissionAdminModuleClient } from "@/lib/api/commissionClient";
import { ApiResponse } from "@/types";
import {
  PaginatedServices,
  ServiceFormPayload,
  ServiceListParams,
  ServiceMaster,
  ServiceStatus,
  ServiceSummaryStats,
} from "@/types/serviceMaster";

const SERVICES_BASE = "/services";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeStatus(value: unknown): ServiceStatus {
  const status = String(value ?? "INACTIVE").toUpperCase();
  return status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
}

export function normalizeServiceMaster(raw: unknown): ServiceMaster {
  const obj = asRecord(raw);
  const parent = asRecord(obj.parent);
  const parentId =
    (obj.parentId as string | null | undefined) ??
    (obj.parentServiceId as string | null | undefined) ??
    (parent.id as string | undefined) ??
    null;

  const name = String(obj.name ?? obj.serviceName ?? "");
  const code = String(obj.code ?? obj.serviceCode ?? "");

  return {
    id: String(obj.id ?? obj._id ?? ""),
    name,
    code,
    description: (obj.description as string | null | undefined) ?? null,
    parentId: parentId || null,
    parentName:
      (obj.parentName as string | undefined) ??
      (parent.name as string | undefined) ??
      null,
    displayOrder: Number(obj.displayOrder ?? obj.order ?? 0) || 0,
    status: normalizeStatus(obj.status),
    type: parentId ? "SUB" : "MAIN",
    createdAt: obj.createdAt as string | undefined,
    updatedAt: obj.updatedAt as string | undefined,
    children: Array.isArray(obj.children)
      ? obj.children.map(normalizeServiceMaster)
      : undefined,
  };
}

function normalizePaginated(
  payload: unknown,
  params: ServiceListParams
): PaginatedServices {
  const obj = asRecord(payload);
  const listKeys = ["data", "services", "items", "results"];

  let items: unknown[] = [];
  for (const key of listKeys) {
    if (Array.isArray(obj[key])) {
      items = obj[key] as unknown[];
      break;
    }
  }
  if (!items.length && Array.isArray(payload)) {
    items = payload;
  }

  const meta = asRecord(obj.meta);
  const total = Number(
    obj.total ?? meta.total ?? obj.totalCount ?? items.length
  );
  const page = Number(obj.page ?? meta.page ?? params.page ?? 1);
  const pageSize = Number(
    obj.pageSize ?? obj.limit ?? meta.pageSize ?? meta.limit ?? params.pageSize ?? 10
  );

  return {
    data: items.map(normalizeServiceMaster),
    total: Number.isFinite(total) ? total : items.length,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 10,
  };
}

function toQueryParams(params: ServiceListParams = {}) {
  const pageSize = params.pageSize ?? 10;
  return {
    page: params.page ?? 1,
    pageSize,
    limit: pageSize,
    search: params.search || undefined,
    status:
      params.status && params.status !== "ALL" ? params.status : undefined,
    parentId: params.parentId || undefined,
  };
}

export function computeServiceSummary(
  services: ServiceMaster[]
): ServiceSummaryStats {
  const mainServices = services.filter((s) => s.type === "MAIN").length;
  const subServices = services.filter((s) => s.type === "SUB").length;
  const activeServices = services.filter((s) => s.status === "ACTIVE").length;
  const inactiveServices = services.filter((s) => s.status === "INACTIVE").length;

  return {
    totalServices: services.length,
    mainServices,
    subServices,
    activeServices,
    inactiveServices,
  };
}

export async function listServices(
  params: ServiceListParams = {}
): Promise<PaginatedServices> {
  const { data } = await superAdminServicesClient.get<ApiResponse<unknown>>(
    SERVICES_BASE,
    { params: toQueryParams(params) }
  );
  return normalizePaginated(data.data, params);
}

export async function getServiceTree(): Promise<ServiceMaster[]> {
  const { data } = await superAdminServicesClient.get<ApiResponse<unknown>>(
    `${SERVICES_BASE}/tree`
  );
  const payload = data.data;
  if (Array.isArray(payload)) {
    return payload.map(normalizeServiceMaster);
  }
  const obj = asRecord(payload);
  const tree = obj.tree ?? obj.data ?? obj.services;
  return Array.isArray(tree) ? tree.map(normalizeServiceMaster) : [];
}

export async function getActiveServices(): Promise<ServiceMaster[]> {
  return fetchActiveServices(superAdminServicesClient);
}

/** Active services for Admin panel (commission management, etc.) */
export async function getActiveServicesForAdmin(): Promise<ServiceMaster[]> {
  return fetchActiveServices(commissionAdminModuleClient);
}

async function fetchActiveServices(
  client: typeof adminModuleClient
): Promise<ServiceMaster[]> {
  const { data } = await client.get<ApiResponse<unknown>>(
    `${SERVICES_BASE}/active`
  );
  const payload = data.data;
  if (Array.isArray(payload)) {
    return payload.map(normalizeServiceMaster);
  }
  const obj = asRecord(payload);
  const list = obj.data ?? obj.services ?? obj.items;
  return Array.isArray(list) ? list.map(normalizeServiceMaster) : [];
}

export async function getServiceById(id: string): Promise<ServiceMaster> {
  const { data } = await superAdminServicesClient.get<ApiResponse<unknown>>(
    `${SERVICES_BASE}/${id}`
  );
  const payload = data.data;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return normalizeServiceMaster(payload);
  }
  return normalizeServiceMaster(asRecord(payload).service ?? payload);
}

export async function createService(
  payload: ServiceFormPayload
): Promise<ServiceMaster> {
  const body = {
    ...payload,
    parentId: payload.parentId || null,
    serviceName: payload.name,
    serviceCode: payload.code,
  };
  const { data } = await superAdminServicesClient.post<ApiResponse<unknown>>(
    SERVICES_BASE,
    body
  );
  return normalizeServiceMaster(data.data);
}

export async function updateService(
  id: string,
  payload: ServiceFormPayload
): Promise<ServiceMaster> {
  const body = {
    ...payload,
    parentId: payload.parentId || null,
    serviceName: payload.name,
    serviceCode: payload.code,
  };
  const { data } = await superAdminServicesClient.put<ApiResponse<unknown>>(
    `${SERVICES_BASE}/${id}`,
    body
  );
  return normalizeServiceMaster(data.data);
}

export async function patchServiceStatus(
  id: string,
  status: ServiceStatus
): Promise<ServiceMaster> {
  const { data } = await superAdminServicesClient.patch<ApiResponse<unknown>>(
    `${SERVICES_BASE}/${id}/status`,
    { status }
  );
  return normalizeServiceMaster(data.data);
}

export async function deleteService(id: string): Promise<void> {
  await superAdminServicesClient.delete(`${SERVICES_BASE}/${id}`);
}
