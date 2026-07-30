import { superAdminModuleClient } from "@/lib/api/client";
import { ApiResponse } from "@/types";
import {
  AepsLedgerListResult,
  AepsLedgerPagination,
  AepsLedgerQueryParams,
  AepsLedgerRecord,
} from "@/types/super-admin-aeps-ledger";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

function toString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function formatDateTime(raw?: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const obj = asRecord(payload);
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.records)) return obj.records;
  if (Array.isArray(obj.ledger)) return obj.ledger;
  const nested = asRecord(obj.data);
  if (Array.isArray(nested.items)) return nested.items;
  if (Array.isArray(nested.data)) return nested.data;
  return [];
}

function extractPagination(
  payload: unknown,
  fallback: { page: number; limit: number; total: number }
): AepsLedgerPagination {
  const obj = asRecord(payload);
  const meta = asRecord(obj.meta ?? obj.pagination ?? obj);
  const nested = asRecord(obj.data);
  const nestedMeta = asRecord(nested.meta ?? nested.pagination);

  const page = toNumber(
    meta.page ?? nestedMeta.page ?? obj.page ?? fallback.page,
    fallback.page
  );
  const limit = toNumber(
    meta.limit ??
      meta.pageSize ??
      nestedMeta.limit ??
      nestedMeta.pageSize ??
      obj.limit ??
      fallback.limit,
    fallback.limit
  );
  const total = toNumber(
    meta.total ?? nestedMeta.total ?? obj.total ?? fallback.total,
    fallback.total
  );
  const totalPages =
    toNumber(meta.totalPages ?? nestedMeta.totalPages ?? obj.totalPages) ||
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return { page, limit, total, totalPages };
}

export function normalizeAepsLedgerRecord(
  raw: unknown,
  index = 0
): AepsLedgerRecord {
  const obj = asRecord(raw);
  const retailer = asRecord(obj.retailer ?? obj.user ?? obj.account);
  const createdAt = toString(
    obj.createdAt ?? obj.dateTime ?? obj.executedAt ?? obj.txnDate,
    ""
  );
  const retailerName =
    toString(
      obj.retailerName ??
        retailer.name ??
        [retailer.firstName, retailer.lastName].filter(Boolean).join(" ")
    ) || "—";
  const retailerCode = toString(
    obj.retailerCode ?? obj.userCode ?? retailer.userCode,
    "—"
  );
  const mobile = toString(
    obj.mobile ?? obj.customerMobile ?? retailer.mobile ?? retailer.phone,
    "—"
  );

  return {
    id: toString(obj.id ?? obj._id ?? obj.ledgerId ?? `${createdAt}-${index}`),
    rowNumber: index + 1,
    dateTime: toString(obj.dateTime) || formatDateTime(createdAt),
    createdAt: createdAt || null,
    retailerId: toString(obj.retailerId ?? retailer.id) || null,
    retailerName,
    retailerCode,
    mobile,
    ledgerNo: toString(obj.ledgerNo ?? obj.ledgerNumber ?? obj.txnId, "—"),
    referenceId: toString(
      obj.referenceId ?? obj.reference ?? obj.refId ?? obj.transactionId,
      "—"
    ),
    service: toString(
      obj.service ?? obj.serviceType ?? obj.serviceName ?? "AEPS",
      "AEPS"
    ),
    description: toString(
      obj.description ?? obj.message ?? obj.narration,
      "—"
    ),
    status: toString(obj.status, "PENDING").toUpperCase(),
    openingBalance: toNumber(obj.openingBalance ?? obj.openBalance),
    txnAmount: toNumber(obj.txnAmount ?? obj.transactionAmount ?? obj.amount),
    charge: toNumber(obj.charge ?? obj.charges),
    commission: toNumber(obj.commission),
    tds: toNumber(obj.tds),
    credit: toNumber(obj.credit ?? obj.cr),
    debit: toNumber(obj.debit ?? obj.dr),
    closingBalance: toNumber(
      obj.closingBalance ?? obj.closeBalance ?? obj.updatedBalance
    ),
    rrn: toString(obj.rrn ?? obj.bankRrn ?? obj.utr, "—"),
    bankName: toString(obj.bankName ?? obj.bank, "—"),
    remarks: toString(obj.remarks ?? obj.remark ?? obj.note, "—"),
    retailer: {
      id: toString(retailer.id) || null,
      name: retailerName === "—" ? null : retailerName,
      userCode: retailerCode === "—" ? null : retailerCode,
      mobile: mobile === "—" ? null : mobile,
      email: toString(retailer.email) || null,
    },
  };
}

function buildQuery(params: AepsLedgerQueryParams) {
  const fromDate = params.fromDate || params.startDate || undefined;
  const toDate = params.toDate || params.endDate || undefined;

  return {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    sortBy: params.sortBy || "createdAt",
    sortOrder: params.sortOrder || "desc",
    search: params.search || undefined,
    retailerId: params.retailerId || undefined,
    retailerName: params.retailerName || undefined,
    retailerCode: params.retailerCode || undefined,
    mobile: params.mobile || undefined,
    ledgerNo: params.ledgerNo || undefined,
    referenceId: params.referenceId || undefined,
    rrn: params.rrn || undefined,
    service: params.service || undefined,
    status: params.status || undefined,
    fromDate,
    toDate,
    startDate: fromDate,
    endDate: toDate,
  };
}

/**
 * GET /api/v1/super-admin/aeps-ledger
 * Returns AEPS-only ledger rows for all retailers.
 */
export async function fetchSuperAdminAepsLedger(
  params: AepsLedgerQueryParams = {}
): Promise<AepsLedgerListResult> {
  const { data } = await superAdminModuleClient.get<ApiResponse<unknown>>(
    "/aeps-ledger",
    { params: buildQuery(params) }
  );

  const payload = data?.data ?? data;
  const items = extractItems(payload).map((item, index) =>
    normalizeAepsLedgerRecord(item, index)
  );
  const pagination = extractPagination(payload, {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    total: items.length,
  });

  return { items, pagination };
}

/** Fetch all filtered pages for export. */
export async function fetchAllSuperAdminAepsLedger(
  params: Omit<AepsLedgerQueryParams, "page" | "limit"> = {}
): Promise<AepsLedgerRecord[]> {
  const first = await fetchSuperAdminAepsLedger({
    ...params,
    page: 1,
    limit: 100,
  });
  const all = [...first.items];
  for (let page = 2; page <= first.pagination.totalPages; page += 1) {
    const next = await fetchSuperAdminAepsLedger({
      ...params,
      page,
      limit: first.pagination.limit || 100,
    });
    all.push(...next.items);
  }
  return all.map((item, index) => ({ ...item, rowNumber: index + 1 }));
}

export function toAepsLedgerExportRows(
  records: AepsLedgerRecord[]
): Record<string, unknown>[] {
  return records.map((row, index) => ({
    "#": row.rowNumber ?? index + 1,
    "Date & Time": row.dateTime,
    Retailer: row.retailerName,
    "Retailer Code": row.retailerCode,
    Mobile: row.mobile,
    "Ledger No": row.ledgerNo,
    "Reference ID": row.referenceId,
    Service: row.service,
    Description: row.description,
    Status: row.status,
    "Opening Balance": row.openingBalance,
    "Transaction Amount": row.txnAmount,
    Charge: row.charge,
    Commission: row.commission,
    TDS: row.tds,
    "Credit (CR)": row.credit,
    "Debit (DR)": row.debit,
    "Closing Balance": row.closingBalance,
    RRN: row.rrn,
    "Bank Name": row.bankName,
    Remarks: row.remarks,
  }));
}
