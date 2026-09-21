import { superAdminClient, superAdminModuleClient } from "@/lib/api/client";
import { ApiResponse } from "@/types";
import {
  Dmt3StatusUpdatePayload,
  Dmt3StatusUpdateResult,
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

function pickMobile(obj: Record<string, unknown>): string | null {
  const value =
    obj.mobile ??
    obj.phone ??
    obj.mobileNumber ??
    obj.phoneNumber ??
    obj.contactNumber ??
    obj.retailerMobile ??
    obj.retailerPhone;
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function pickLongestText(...values: unknown[]): string | null {
  const texts = values
    .map((value) => (value == null ? "" : String(value).trim()))
    .filter(Boolean);
  if (!texts.length) return null;
  return texts.sort((a, b) => b.length - a.length)[0];
}

function normalizeRetailer(raw: unknown): StatementRetailer | null {
  const obj = asRecord(raw);
  const id = obj.id ?? obj._id ?? obj.userId ?? obj.retailerId;
  const mobile = pickMobile(obj);
  const name = pickLongestText(
    obj.name,
    obj.fullName,
    obj.retailerName,
    [obj.firstName, obj.lastName].filter(Boolean).join(" "),
    obj.userCode
  );
  if (!id && !name && !mobile) return null;
  return {
    id: id ? String(id) : "",
    name: name || "Retailer",
    userCode:
      (obj.userCode as string) ||
      (obj.retailerCode as string) ||
      null,
    mobile,
    email: (obj.email as string) || null,
    status: (obj.status as string) || null,
  };
}

function mergeRetailer(
  ...parts: Array<StatementRetailer | null>
): StatementRetailer | null {
  const list = parts.filter((item): item is StatementRetailer => Boolean(item));
  if (!list.length) return null;
  const first = list[0];
  return {
    id: list.find((item) => item.id)?.id || first.id,
    name: pickLongestText(...list.map((item) => item.name)) || first.name,
    userCode: list.find((item) => item.userCode)?.userCode || null,
    mobile: pickLongestText(...list.map((item) => item.mobile)) || first.mobile,
    email: list.find((item) => item.email)?.email || null,
    status: list.find((item) => item.status)?.status || null,
  };
}

function retailerFromRow(obj: Record<string, unknown>): StatementRetailer | null {
  return mergeRetailer(
    normalizeRetailer(obj.retailer),
    normalizeRetailer(obj.user),
    normalizeRetailer(obj.createdBy),
    normalizeRetailer(obj.outletUser),
    normalizeRetailer({
      id: obj.retailerId ?? obj.userId,
      name: obj.retailerName ?? obj.userName,
      fullName: obj.retailerName,
      mobile: obj.retailerMobile ?? obj.userMobile,
      phone: obj.retailerPhone ?? obj.phone,
      userCode: obj.retailerCode ?? obj.userCode,
    })
  );
}

export function enrichStatementRetailer(
  row: StatementRow,
  catalog: Array<{
    id: string;
    name?: string | null;
    mobile?: string | null;
    phone?: string | null;
    userCode?: string | null;
  }>
): StatementRow {
  const id = row.retailerId || row.retailer?.id || "";
  const match = id ? catalog.find((item) => item.id === id) : undefined;
  const mobile =
    pickLongestText(row.retailer?.mobile, match?.mobile, match?.phone) || null;
  const name =
    pickLongestText(row.retailer?.name, match?.name) ||
    row.retailer?.name ||
    null;
  if (!id && !name && !mobile) return row;
  return {
    ...row,
    retailerId: id || row.retailerId,
    retailer: {
      id: id || row.retailer?.id || "",
      name: name || "Retailer",
      mobile,
      userCode: row.retailer?.userCode || match?.userCode || null,
      email: row.retailer?.email || null,
      status: row.retailer?.status || null,
    },
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
    obj.provider,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  if (blob.includes("DMT3") || blob.includes("FINZENG")) return "DMT3";
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
    row.transferMode,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  if (service === "AEPS") {
    return blob.includes("AEPS") && !blob.includes("DMT") && !/\bUPI\b/.test(blob);
  }
  if (service === "DMT3") {
    return (
      blob.includes("DMT3") || blob.includes("FINZENG") || row.service === "DMT3"
    );
  }
  if (service === "DMT") {
    return blob.includes("DMT") && !blob.includes("DMT3");
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
  const retailer = retailerFromRow(obj);

  return {
    id: String(obj.id ?? obj.ledgerId ?? ""),
    ledgerId: String(obj.ledgerId ?? obj.id ?? ""),
    service,
    serviceType: (obj.serviceType as string) || undefined,
    ledgerNo: String(
      obj.ledgerNo ??
        obj.reference ??
        obj.transactionId ??
        obj.referenceId ??
        obj.id ??
        "—"
    ),
    reference:
      (obj.reference as string) ||
      (obj.transactionId as string) ||
      (obj.referenceId as string) ||
      null,
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
    ifscCode: (obj.ifscCode as string) || (obj.ifsc as string) || null,
    transferMode:
      (obj.transferMode as string) ||
      (obj.paymentMode as string) ||
      (obj.mode as string) ||
      null,
    aadhaarMasked: (obj.aadhaarMasked as string) || null,
    rrn: (obj.rrn as string) || null,
    retailer,
    retailerId:
      (obj.retailerId as string) ||
      (obj.userId as string) ||
      retailer?.id ||
      null,
    createdAt,
    dateTime: (obj.dateTime as string) || formatDateTime(createdAt),
  };
}

/** Map Finzeng / DMT3 admin transaction payload → StatementRow */
export function normalizeDmt3Transaction(raw: unknown): StatementRow {
  const obj = asRecord(raw);
  const remitter = asRecord(obj.remitter);
  const beneficiary = asRecord(obj.beneficiary);
  const retailer = retailerFromRow(obj);
  const createdAt =
    (obj.createdAt as string) ||
    (obj.finalizedAt as string) ||
    (obj.updatedAt as string) ||
    (obj.timestamp as string) ||
    null;
  const amount = toNumber(
    obj.txnAmount ?? obj.amount ?? obj.transferAmount ?? obj.payoutAmount
  );
  const reference = String(
    obj.reference ??
      obj.clientTxnId ??
      obj.clientReference ??
      obj.orderId ??
      obj.txnId ??
      obj.id ??
      "—"
  );
  const mode = String(
    obj.transferMode ?? obj.paymentMode ?? obj.mode ?? obj.channel ?? ""
  ).toUpperCase();
  const beneficiaryName =
    (obj.payeeName as string) ||
    (obj.beneficiaryName as string) ||
    (beneficiary.name as string) ||
    (beneficiary.accountHolderName as string) ||
    null;
  const remitterName =
    (obj.payerName as string) ||
    (obj.customerName as string) ||
    (obj.remitterName as string) ||
    (remitter.name as string) ||
    null;
  const remitterMobile =
    (obj.remitterMobile as string) ||
    (obj.customerMobile as string) ||
    (remitter.mobile as string) ||
    null;
  const accountCandidates = [
    obj.accountNumber,
    beneficiary.accountNumber,
    obj.accountNo,
    beneficiary.accountNo,
    obj.beneAccount,
    beneficiary.account,
    obj.accountMasked,
    beneficiary.accountMasked,
  ]
    .map((value) => (value == null ? "" : String(value).trim()))
    .filter(Boolean);
  const account =
    accountCandidates.find((value) => !/x/i.test(value)) ||
    accountCandidates[0] ||
    null;

  return {
    id: String(obj.id ?? reference),
    ledgerId: String(obj.clientTxnId ?? obj.id ?? reference),
    service: "DMT3",
    serviceType: mode || "DMT3",
    ledgerNo: String(obj.clientTxnId ?? reference),
    reference,
    description:
      (obj.remarks as string) ||
      (obj.description as string) ||
      [mode || "DMT3", beneficiaryName].filter(Boolean).join(" · ") ||
      "DMT3 payout",
    message:
      (obj.failureReason as string) ||
      (obj.providerMessage as string) ||
      (obj.message as string) ||
      (obj.statusMessage as string) ||
      null,
    status: String(obj.status || "PENDING").toUpperCase(),
    amount,
    txnAmount: amount,
    charge: toNumber(obj.charge ?? obj.charges ?? obj.fee),
    commission: toNumber(obj.commissionAmount ?? obj.commission),
    tds: toNumber(obj.tds),
    openingBalance: toOptionalNumber(obj.openingBalance ?? obj.balanceBefore),
    closingBalance: toOptionalNumber(obj.closingBalance ?? obj.balanceAfter),
    credit: toNumber(obj.credit),
    debit: toNumber(obj.debit ?? obj.totalDebited ?? amount),
    customerMobile: remitterMobile,
    customerName: remitterName || beneficiaryName,
    beneficiaryName,
    bankName:
      (obj.bankName as string) || (beneficiary.bankName as string) || null,
    accountNumber: account,
    ifscCode:
      (obj.ifscCode as string) ||
      (obj.ifsc as string) ||
      (beneficiary.ifscCode as string) ||
      (beneficiary.ifsc as string) ||
      null,
    transferMode: mode || null,
    aadhaarMasked: null,
    rrn:
      (obj.utr as string) ||
      (obj.bankRef as string) ||
      (obj.rrn as string) ||
      (obj.bankReference as string) ||
      (obj.providerTxnId as string) ||
      null,
    retailer,
    retailerId:
      retailer?.id ||
      (obj.retailerId as string) ||
      (obj.userId as string) ||
      null,
    createdAt,
    dateTime: formatDateTime(createdAt),
  };
}

/**
 * Backend sometimes returns list as a plain array, and sometimes as an
 * indexed object: `{ "0": {...}, "1": {...} }`.
 */
function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const obj = asRecord(payload);
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.records)) return obj.records;
  if (Array.isArray(obj.transactions)) return obj.transactions;
  if (Array.isArray(obj.results)) return obj.results;
  if (Array.isArray(obj.rows)) return obj.rows;

  const indexed = Object.keys(obj)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => obj[k])
    .filter((item) => item && typeof item === "object");
  return indexed;
}

function extractPagination(
  sources: unknown[],
  fallback: { page: number; limit: number; total: number }
) {
  for (const source of sources) {
    const obj = asRecord(source);
    const meta = asRecord(obj.meta ?? obj.pagination);
    if (
      meta.total != null ||
      meta.totalRecords != null ||
      meta.page != null ||
      obj.total != null
    ) {
      const total = toNumber(
        meta.total ?? meta.totalRecords ?? obj.total ?? fallback.total
      );
      const page = toNumber(meta.page ?? meta.currentPage ?? fallback.page) || 1;
      const limit =
        toNumber(meta.limit ?? meta.pageSize ?? fallback.limit) || 20;
      const totalPages =
        toNumber(meta.totalPages) ||
        (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
      return { page, limit, total, totalPages };
    }
  }
  return {
    page: fallback.page,
    limit: fallback.limit,
    total: fallback.total,
    totalPages: Math.max(1, Math.ceil(fallback.total / fallback.limit)),
  };
}

async function fetchDmt3AdminStatement(
  params: StatementQueryParams = {}
): Promise<StatementListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const { data } = await superAdminClient.get<
    ApiResponse<unknown> & Record<string, unknown>
  >("/dmt3/admin/transactions", {
    params: {
      page,
      limit,
      pageSize: limit,
      status: params.status || undefined,
      search: params.search || undefined,
      mobile: params.mobile || undefined,
      phone: params.mobile || undefined,
      retailerMobile: params.mobile || undefined,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      startDate: params.fromDate || undefined,
      endDate: params.toDate || undefined,
      retailerId: params.retailerId || undefined,
      userId: params.retailerId || undefined,
      sortOrder: params.sortOrder || "desc",
      transferMode: params.transferMode || undefined,
    },
  });

  // Response shape:
  // { success, message, data: { "0": txn, "1": txn, ... }, pagination: {...} }
  const listPayload = data.data ?? data;
  const items = extractItems(listPayload).map(normalizeDmt3Transaction);
  const pagination = extractPagination([data, listPayload], {
    page,
    limit,
    total: items.length,
  });

  return {
    service: "DMT3",
    retailer: null,
    items,
    pagination,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function canUpdateDmt3Status(status?: string | null): boolean {
  return String(status || "").toUpperCase() === "PROCESSING";
}

export const canUpdateDmtStatus = canUpdateDmt3Status;

function dmtStatusBody(payload: Dmt3StatusUpdatePayload): Dmt3StatusUpdatePayload {
  const body: Dmt3StatusUpdatePayload = { status: payload.status };
  const remark = payload.remark?.trim();
  if (remark) body.remark = remark;
  return body;
}

export async function updateDmt3TransactionStatus(
  transactionId: string,
  payload: Dmt3StatusUpdatePayload
): Promise<Dmt3StatusUpdateResult> {
  const id = transactionId.trim();
  if (!UUID_RE.test(id)) {
    throw new Error("Invalid DMT3 transaction id");
  }

  const { data } = await superAdminClient.patch<
    ApiResponse<Dmt3StatusUpdateResult>
  >(`/dmt3/admin/transactions/${id}/status`, dmtStatusBody(payload));

  return (data.data || {}) as Dmt3StatusUpdateResult;
}

export function resolveDmtTransactionId(row: {
  id?: string | null;
  ledgerId?: string | null;
  ledgerNo?: string | null;
  reference?: string | null;
}): string {
  const candidates = [row.reference, row.ledgerNo, row.id, row.ledgerId]
    .map((value) => String(value || "").trim())
    .filter((value) => value && value !== "—");

  const reference = candidates.find(
    (value) => /^DMT\d+/i.test(value) && value.length <= 64
  );
  if (reference) return reference;

  const uuid = candidates.find((value) => UUID_RE.test(value));
  if (uuid) return uuid;

  const anyId = candidates.find((value) => value.length >= 1 && value.length <= 64);
  if (anyId) return anyId;

  throw new Error("Invalid DMT transaction id");
}

export async function updateDmtTransactionStatus(
  transactionId: string,
  payload: Dmt3StatusUpdatePayload
): Promise<Dmt3StatusUpdateResult> {
  const id = transactionId.trim();
  if (!id || id.length > 64) {
    throw new Error("Invalid DMT transaction id");
  }

  const { data } = await superAdminClient.patch<
    ApiResponse<Dmt3StatusUpdateResult>
  >(`/dmt/admin/transactions/${encodeURIComponent(id)}/status`, dmtStatusBody(payload));

  return (data.data || {}) as Dmt3StatusUpdateResult;
}

export async function fetchServiceStatement(
  params: StatementQueryParams = {}
): Promise<StatementListResult> {
  const service = (params.service || "AEPS") as StatementServiceTab;

  if (service === "DMT3") {
    return fetchDmt3AdminStatement(params);
  }

  const retailerId = params.retailerId || undefined;
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
      mobile: params.mobile || undefined,
      phone: params.mobile || undefined,
      retailerMobile: params.mobile || undefined,
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

  const pagination = extractPagination([data, payload], {
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
