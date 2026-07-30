import { superAdminModuleClient } from "@/lib/api/client";
import { ApiResponse } from "@/types";
import {
  StatementListResult,
  StatementQueryParams,
  StatementRetailer,
  StatementRow,
  StatementServiceTab,
} from "@/types/serviceStatement";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatDateTime(raw?: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function normalizeRetailer(raw: unknown): StatementRetailer | null {
  const obj = asRecord(raw);
  if (!obj.id) return null;
  const name =
    (obj.name as string) ||
    [obj.firstName, obj.lastName].filter(Boolean).join(" ") ||
    (obj.userCode as string) ||
    "Retailer";
  return {
    id: String(obj.id),
    name,
    userCode: (obj.userCode as string) || null,
    mobile: (obj.mobile as string) || null,
    email: (obj.email as string) || null,
    status: (obj.status as string) || null,
  };
}

function detectService(obj: Record<string, unknown>): string {
  const blob = [
    obj.service,
    obj.serviceType,
    obj.serviceName,
    obj.source,
    obj.ledgerNo,
    obj.reference,
    obj.referenceId,
    obj.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  if (blob.includes("AEPS")) return "AEPS";
  if (blob.includes("DMT")) return "DMT";
  if (blob.includes("UPI")) return "UPI";
  return String(obj.service || "").toUpperCase() || "OTHER";
}

export function rowMatchesService(
  row: StatementRow,
  service: StatementServiceTab
): boolean {
  const blob = [
    row.service,
    row.serviceType,
    row.ledgerNo,
    row.reference,
    row.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  if (service === "AEPS") {
    return blob.includes("AEPS") && !blob.includes("DMT") && !/\bUPI\b/.test(blob);
  }
  if (service === "DMT") {
    return blob.includes("DMT");
  }
  if (service === "UPI") {
    return blob.includes("UPI") && !blob.includes("AEPS") && !blob.includes("DMT");
  }
  return false;
}

export function normalizeStatementRow(raw: unknown): StatementRow {
  const obj = asRecord(raw);
  const createdAt = (obj.createdAt as string) || null;
  const amount = toNumber(obj.txnAmount ?? obj.amount);
  const service = detectService(obj);

  return {
    id: String(obj.id ?? obj.ledgerId ?? ""),
    ledgerId: String(obj.ledgerId ?? obj.id ?? ""),
    service,
    serviceType: (obj.serviceType as string) || undefined,
    ledgerNo: String(
      obj.ledgerNo ?? obj.reference ?? obj.referenceId ?? obj.id ?? "—"
    ),
    reference: (obj.reference as string) || (obj.referenceId as string) || null,
    description: (obj.description as string) || null,
    message: (obj.message as string) || null,
    status: String(obj.status || "PENDING").toUpperCase(),
    amount,
    txnAmount: amount,
    charge: toNumber(obj.charge ?? obj.charges),
    commission: toNumber(obj.commission),
    tds: toNumber(obj.tds),
    openingBalance: toOptionalNumber(obj.openingBalance),
    closingBalance: toOptionalNumber(obj.closingBalance),
    credit: toNumber(obj.credit),
    debit: toNumber(obj.debit),
    customerMobile: (obj.customerMobile as string) || null,
    customerName: (obj.customerName as string) || null,
    bankName: (obj.bankName as string) || null,
    accountNumber: (obj.accountNumber as string) || null,
    aadhaarMasked: (obj.aadhaarMasked as string) || null,
    rrn: (obj.rrn as string) || null,
    retailer: normalizeRetailer(obj.retailer),
    retailerId: (obj.retailerId as string) || null,
    createdAt,
    dateTime: (obj.dateTime as string) || formatDateTime(createdAt),
  };
}

function extractItems(payload: unknown): unknown[] {
  const obj = asRecord(payload);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.records)) return obj.records;
  if (Array.isArray(obj.transactions)) return obj.transactions;
  return [];
}

function extractPagination(
  payload: unknown,
  fallback: { page: number; limit: number; total: number }
) {
  const obj = asRecord(payload);
  const meta = asRecord(obj.meta ?? obj.pagination);
  const total = toNumber(meta.total ?? fallback.total);
  const page = toNumber(meta.page ?? fallback.page) || 1;
  const limit = toNumber(meta.limit ?? meta.pageSize ?? fallback.limit) || 20;
  const totalPages =
    toNumber(meta.totalPages) ||
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
  return { page, limit, total, totalPages };
}

export async function fetchServiceStatement(
  params: StatementQueryParams = {}
): Promise<StatementListResult> {
  const retailerId = params.retailerId || undefined;
  const service = (params.service || "AEPS") as StatementServiceTab;
  const path = retailerId
    ? `/retailers/${retailerId}/statement`
    : "/statement";

  const { data } = await superAdminModuleClient.get<ApiResponse<unknown>>(path, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      service,
      status: params.status || undefined,
      search: params.search || undefined,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      sortOrder: params.sortOrder || "desc",
      transactionType:
        service === "AEPS" ? params.transactionType || undefined : undefined,
      transferMode:
        service === "DMT" ? params.transferMode || undefined : undefined,
    },
  });

  const payload = data.data;
  const obj = asRecord(payload);
  const items = extractItems(payload)
    .map(normalizeStatementRow)
    .filter((row) => rowMatchesService(row, service));

  const pagination = extractPagination(payload, {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    total: items.length,
  });

  return {
    service,
    retailer: normalizeRetailer(obj.retailer),
    items,
    pagination: {
      ...pagination,
      // If API mixed services, trust filtered count for this page
      total: items.length < pagination.limit ? items.length : pagination.total,
    },
  };
}

export async function fetchServiceStatementDetail(
  ledgerId: string,
  retailerId?: string
): Promise<StatementRow> {
  const path = retailerId
    ? `/retailers/${retailerId}/statement/${ledgerId}`
    : `/statement/${ledgerId}`;
  const { data } = await superAdminModuleClient.get<ApiResponse<unknown>>(path);
  const payload = asRecord(data.data);
  return normalizeStatementRow(payload.item ?? payload);
}

export type { StatementServiceTab };
