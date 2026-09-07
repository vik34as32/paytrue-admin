import { commissionAdminModuleClient } from "@/lib/api/commissionClient";
import { ApiResponse } from "@/types";
import {
  ProviderErrorLogListParams,
  ProviderErrorLogListResult,
  ProviderErrorLogRecord,
} from "@/types/providerErrorLog";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const obj = asRecord(payload);
  for (const key of ["data", "items", "logs", "results", "rows"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
  }
  const numericKeys = Object.keys(obj).filter((k) => /^\d+$/.test(k));
  if (numericKeys.length) {
    return numericKeys
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => obj[k]);
  }
  return [];
}

function pickStr(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickNum(
  obj: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (
    !(trimmed.startsWith("{") || trimmed.startsWith("["))
  ) {
    return value;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

export function normalizeProviderErrorLog(
  raw: unknown
): ProviderErrorLogRecord {
  const obj = asRecord(raw);
  return {
    ...obj,
    id: String(obj.id ?? obj._id ?? ""),
    provider: pickStr(obj, "provider", "providerName", "vendor"),
    service: pickStr(obj, "service", "serviceName", "serviceCode"),
    endpoint: pickStr(obj, "endpoint", "url", "path", "apiEndpoint"),
    method: pickStr(obj, "method", "httpMethod", "http_method"),
    httpMethod: pickStr(obj, "httpMethod", "method", "http_method"),
    statusCode: pickNum(obj, "statusCode", "httpStatus", "status_code"),
    errorType: pickStr(obj, "errorType", "error_type", "type"),
    message:
      pickStr(obj, "message", "errorMessage", "error_message", "error") ||
      undefined,
    errorMessage: pickStr(obj, "errorMessage", "message", "error_message"),
    errorCode: pickStr(obj, "errorCode", "error_code", "code"),
    transactionId: pickStr(
      obj,
      "transactionId",
      "txnId",
      "transaction_id",
      "txn_id"
    ),
    referenceId: pickStr(
      obj,
      "referenceId",
      "refId",
      "reference_id",
      "reference"
    ),
    requestPayload: tryParseJson(
      obj.requestPayload ?? obj.requestBody ?? obj.request ?? obj.payload
    ),
    responsePayload: tryParseJson(
      obj.responsePayload ?? obj.responseBody ?? obj.response
    ),
    requestBody: tryParseJson(obj.requestBody ?? obj.requestPayload),
    responseBody: tryParseJson(obj.responseBody ?? obj.responsePayload),
    requestHeaders: tryParseJson(obj.requestHeaders),
    responseHeaders: tryParseJson(obj.responseHeaders),
    durationMs: pickNum(obj, "durationMs", "duration", "latencyMs", "responseTime"),
    createdAt: pickStr(obj, "createdAt", "created_at", "timestamp"),
    updatedAt: pickStr(obj, "updatedAt", "updated_at"),
    expiresAt: pickStr(obj, "expiresAt", "expires_at", "expireAt"),
  };
}

function readPagination(
  body: Record<string, unknown>,
  payload: unknown,
  fallbackCount: number,
  params: ProviderErrorLogListParams
): Omit<ProviderErrorLogListResult, "data"> {
  const payloadObj = asRecord(payload);
  const meta = asRecord(
    body.pagination ?? body.meta ?? payloadObj.pagination ?? payloadObj.meta
  );
  const pageSize =
    Number(
      meta.pageSize ??
        meta.limit ??
        body.pageSize ??
        params.pageSize ??
        params.limit ??
        10
    ) || 10;
  const page =
    Number(meta.currentPage ?? meta.page ?? body.page ?? params.page ?? 1) || 1;
  const total =
    Number(
      meta.totalRecords ??
        meta.total ??
        body.totalRecords ??
        body.total ??
        payloadObj.total ??
        fallbackCount
    ) || fallbackCount;
  const totalPages =
    Number(meta.totalPages ?? Math.ceil(total / pageSize)) ||
    Math.max(1, Math.ceil(total / pageSize));

  return { total, page, pageSize, totalPages };
}

/** GET /api/v1/admin/provider-error-logs */
export async function listProviderErrorLogs(
  params: ProviderErrorLogListParams = {}
): Promise<ProviderErrorLogListResult> {
  const pageSize = Math.min(params.pageSize ?? params.limit ?? 10, 100);
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    pageSize,
    limit: pageSize,
  };

  if (params.provider) query.provider = params.provider;
  if (params.service?.trim()) query.service = params.service.trim();
  if (params.endpoint?.trim()) query.endpoint = params.endpoint.trim();
  if (params.transactionId?.trim()) {
    query.transactionId = params.transactionId.trim();
  }
  if (params.referenceId?.trim()) {
    query.referenceId = params.referenceId.trim();
  }
  if (params.statusCode !== undefined && params.statusCode !== "") {
    query.statusCode = Number(params.statusCode);
  }
  if (params.errorType) query.errorType = params.errorType;
  if (params.dateFrom) query.dateFrom = params.dateFrom;
  if (params.dateTo) query.dateTo = params.dateTo;

  const { data } = await commissionAdminModuleClient.get<
    ApiResponse<unknown> & {
      pagination?: Record<string, unknown>;
      meta?: Record<string, unknown>;
    }
  >("/provider-error-logs", { params: query });

  const body = asRecord(data);
  const items = extractList(data.data ?? data).map(normalizeProviderErrorLog);
  const pagination = readPagination(body, data.data, items.length, {
    ...params,
    pageSize,
  });

  return {
    data: items,
    ...pagination,
  };
}

/** GET /api/v1/admin/provider-error-logs/:id */
export async function getProviderErrorLogById(
  id: string
): Promise<ProviderErrorLogRecord> {
  const { data } = await commissionAdminModuleClient.get<ApiResponse<unknown>>(
    `/provider-error-logs/${id}`
  );
  return normalizeProviderErrorLog(data.data ?? data);
}
