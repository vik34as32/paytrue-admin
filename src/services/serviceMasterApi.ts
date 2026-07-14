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
  if (value === null || value === undefined || value === "") return "ACTIVE";
  const status = String(value).toUpperCase();
  return status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
}

function toServiceList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const obj = asRecord(payload);
  for (const key of ["data", "services", "items", "results"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
  }

  // API sometimes returns `{ "0": {...}, "1": {...} }` instead of an array
  const values = Object.values(obj);
  if (
    values.length &&
    values.every(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    )
  ) {
    return values;
  }

  return [];
}

export function normalizeServiceMaster(raw: unknown): ServiceMaster {
  const obj = asRecord(raw);
  const parent = asRecord(obj.parent);
  const rawParentId =
    (obj.parentId as string | null | undefined) ??
    (obj.parentServiceId as string | null | undefined) ??
    (parent.id as string | undefined) ??
    null;
  const parentId =
    rawParentId === null ||
    rawParentId === undefined ||
    rawParentId === "" ||
    rawParentId === "null"
      ? null
      : String(rawParentId);

  const name = String(obj.name ?? obj.serviceName ?? "");
  const code = String(obj.code ?? obj.serviceCode ?? "");

  return {
    id: String(obj.id ?? obj._id ?? ""),
    name,
    code,
    description: (obj.description as string | null | undefined) ?? null,
    parentId,
    parentName:
      (obj.parentName as string | undefined) ??
      (parent.name as string | undefined) ??
      (parent.serviceName as string | undefined) ??
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
  const items = toServiceList(payload);
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

/** `GET /api/v1/admin/services` — Admin or Super Admin (commission module). */
export async function listServicesForAdmin(
  params: ServiceListParams = {}
): Promise<PaginatedServices> {
  const { data } = await commissionAdminModuleClient.get<ApiResponse<unknown>>(
    SERVICES_BASE,
    { params: toQueryParams(params) }
  );
  return normalizePaginated(data.data, params);
}

/** Fetch all pages from `GET /api/v1/admin/services` for commission dropdowns. */
export async function listAllServicesForAdmin(
  params: Omit<ServiceListParams, "page" | "pageSize"> = {}
): Promise<ServiceMaster[]> {
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;
  const collected: ServiceMaster[] = [];

  do {
    const result = await listServicesForAdmin({
      ...params,
      page,
      pageSize,
      status: params.status ?? "ACTIVE",
    });
    collected.push(...result.data);

    if (result.total > 0) {
      totalPages = Math.max(1, Math.ceil(result.total / pageSize));
    } else if (result.data.length < pageSize) {
      totalPages = page;
    } else {
      totalPages = page + 1;
    }

    if (!result.data.length) break;
    page += 1;
  } while (page <= totalPages);

  return collected;
}

function buildServiceTree(services: ServiceMaster[]): ServiceMaster[] {
  if (!services.length) return [];

  // Already nested
  if (services.some((service) => (service.children || []).length > 0)) {
    return services.filter((service) => !service.parentId);
  }

  const byId = new Map(
    services.map((service) => [service.id, { ...service, children: [] as ServiceMaster[] }])
  );

  const roots: ServiceMaster[] = [];

  for (const service of byId.values()) {
    if (service.parentId && byId.has(service.parentId)) {
      byId.get(service.parentId)!.children!.push(service);
    } else {
      roots.push(service);
    }
  }

  const sortNodes = (nodes: ServiceMaster[]) => {
    nodes.sort(
      (a, b) =>
        (a.displayOrder || 0) - (b.displayOrder || 0) ||
        a.name.localeCompare(b.name)
    );
    nodes.forEach((node) => {
      if (node.children?.length) sortNodes(node.children);
    });
  };

  sortNodes(roots);
  return roots;
}

export async function getServiceTree(): Promise<ServiceMaster[]> {
  const { data } = await superAdminServicesClient.get<ApiResponse<unknown>>(
    `${SERVICES_BASE}/tree`
  );
  const payload = data.data;
  let items: ServiceMaster[] = [];

  if (Array.isArray(payload)) {
    items = payload.map(normalizeServiceMaster);
  } else {
    const obj = asRecord(payload);
    const nested = obj.tree ?? obj.data ?? obj.services;
    if (Array.isArray(nested)) {
      items = nested.map(normalizeServiceMaster);
    } else {
      items = toServiceList(payload).map(normalizeServiceMaster);
    }
  }

  return buildServiceTree(items);
}

/** Tree for Admin / Super Admin commission clients. */
export async function getServiceTreeForAdmin(): Promise<ServiceMaster[]> {
  const { data } = await commissionAdminModuleClient.get<ApiResponse<unknown>>(
    `${SERVICES_BASE}/tree`
  );
  const payload = data.data;
  let items: ServiceMaster[] = [];

  if (Array.isArray(payload)) {
    items = payload.map(normalizeServiceMaster);
  } else {
    const obj = asRecord(payload);
    const nested = obj.tree ?? obj.data ?? obj.services;
    if (Array.isArray(nested)) {
      items = nested.map(normalizeServiceMaster);
    } else {
      items = toServiceList(payload).map(normalizeServiceMaster);
    }
  }

  return buildServiceTree(items);
}

/** Flatten tree → list while preserving children on parents. */
export function flattenServiceTree(tree: ServiceMaster[]): ServiceMaster[] {
  const out: ServiceMaster[] = [];
  const walk = (nodes: ServiceMaster[], parent?: ServiceMaster) => {
    for (const node of nodes) {
      const withParent: ServiceMaster = {
        ...node,
        parentId: node.parentId ?? parent?.id ?? null,
        parentName: node.parentName ?? parent?.name ?? null,
      };
      out.push(withParent);
      if (node.children?.length) {
        walk(node.children, withParent);
      }
    }
  };
  walk(tree);
  return out;
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
  return toServiceList(data.data).map(normalizeServiceMaster);
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
