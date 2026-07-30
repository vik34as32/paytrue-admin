import { adminModuleClient } from "@/lib/api/client";
import { superAdminServicesClient } from "@/lib/api/adminServicesClient";
import { ApiResponse } from "@/types";
import {
  WalletLedgerListResult,
  WalletLedgerQueryParams,
  WalletLedgerRetailer,
  WalletLedgerRetailerOption,
  WalletLedgerRow,
  WalletLedgerScope,
} from "@/types/walletLedger";
import {
  fetchWalletSummaryUsers,
} from "@/services/walletSummaryApi";
import { getPublicNetworkUsers } from "@/services/publicNetworkUsersApi";

function clientFor(scope: WalletLedgerScope) {
  return scope === "super_admin" ? superAdminServicesClient : adminModuleClient;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isCreditType(type: string): boolean {
  const t = type.toUpperCase();
  return t === "CREDIT" || t === "REFUND" || t.includes("CREDIT");
}

function isDebitType(type: string): boolean {
  const t = type.toUpperCase();
  return (
    t === "DEBIT" ||
    t === "DEDUCT" ||
    t.includes("DEBIT") ||
    t.includes("DEDUCT")
  );
}

function formatDateTime(raw?: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function normalizeRetailer(raw: unknown): WalletLedgerRetailer | null {
  const obj = asRecord(raw);
  if (!obj.id) return null;
  const firstName = (obj.firstName as string) || "";
  const lastName = (obj.lastName as string) || "";
  const name =
    (obj.name as string) ||
    (obj.fullName as string) ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    (obj.userCode as string) ||
    "Retailer";

  return {
    id: String(obj.id),
    name,
    firstName: firstName || null,
    lastName: lastName || null,
    userCode: (obj.userCode as string) || null,
    email: (obj.email as string) || null,
    mobile: (obj.mobile as string) || null,
    status: (obj.status as string) || null,
    userType: (obj.userType as string) || "RETAILER",
    walletBalance: toNumber(obj.walletBalance ?? obj.balance),
    holdAmount: toNumber(obj.holdAmount),
    walletStatus: (obj.walletStatus as string) || null,
  };
}

export function normalizeWalletLedgerRow(raw: unknown): WalletLedgerRow {
  const obj = asRecord(raw);
  const type = String(
    obj.transactionType ?? obj.type ?? obj.operationType ?? ""
  ).toUpperCase();
  const amount = toNumber(obj.txnAmount ?? obj.amount ?? obj.transactionAmount);
  const credit = toNumber(obj.credit ?? (isCreditType(type) ? amount : 0));
  const debit = toNumber(obj.debit ?? (isDebitType(type) ? amount : 0));
  const createdAt = (obj.createdAt as string) || null;
  const dateTime =
    (obj.dateTime as string) ||
    (obj.date && obj.time ? `${obj.date} ${obj.time}` : null) ||
    formatDateTime(createdAt);

  return {
    id: String(obj.id ?? obj.ledgerId ?? ""),
    ledgerId: String(obj.ledgerId ?? obj.id ?? ""),
    ledgerNo: String(
      obj.ledgerNo ?? obj.ledgerNumber ?? obj.reference ?? obj.id ?? "—"
    ),
    reference: (obj.reference as string) || null,
    service: String(
      obj.service ?? obj.serviceType ?? obj.source ?? (type || "WALLET")
    ),
    serviceType: (obj.serviceType as string) || undefined,
    description:
      (obj.description as string) ||
      (obj.remarks as string) ||
      (obj.narration as string) ||
      (obj.message as string) ||
      null,
    status: String(obj.status || "SUCCESS").toUpperCase(),
    openingBalance: toNumber(
      obj.openingBalance ?? obj.balanceBefore ?? obj.previousBalance
    ),
    txnAmount: amount,
    amount,
    charge: toNumber(obj.charge ?? obj.charges),
    commission: toNumber(obj.commission),
    tds: toNumber(obj.tds),
    credit,
    debit,
    closingBalance: toNumber(
      obj.closingBalance ?? obj.balanceAfter ?? obj.updatedBalance
    ),
    updatedBalance: toNumber(
      obj.updatedBalance ?? obj.closingBalance ?? obj.balanceAfter
    ),
    type,
    transactionType: type,
    transactionId: (obj.transactionId as string) || null,
    createdAt,
    dateTime,
    date: (obj.date as string) || null,
    time: (obj.time as string) || null,
  };
}

function extractItems(payload: unknown): unknown[] {
  const obj = asRecord(payload);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.entries)) return obj.entries;
  if (Array.isArray(obj.transactions)) return obj.transactions;
  if (Array.isArray(obj.ledgers)) return obj.ledgers;
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

export async function fetchRetailerWalletLedger(
  scope: WalletLedgerScope,
  retailerId: string,
  params: WalletLedgerQueryParams = {}
): Promise<WalletLedgerListResult> {
  const client = clientFor(scope);
  const { data } = await client.get<ApiResponse<unknown>>(
    `/retailers/${retailerId}/wallet-ledger`,
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search || undefined,
        status: params.status || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        sortBy: params.sortBy || "createdAt",
        sortOrder: params.sortOrder || "desc",
      },
    }
  );

  const payload = data.data;
  const obj = asRecord(payload);
  const items = extractItems(payload).map(normalizeWalletLedgerRow);
  const pagination = extractPagination(payload, {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    total: items.length,
  });

  return {
    retailer: normalizeRetailer(obj.retailer),
    items,
    pagination,
  };
}

export async function fetchRetailerWalletLedgerById(
  scope: WalletLedgerScope,
  retailerId: string,
  ledgerId: string
): Promise<WalletLedgerRow> {
  const client = clientFor(scope);
  const { data } = await client.get<ApiResponse<unknown>>(
    `/retailers/${retailerId}/wallet-ledger/${ledgerId}`
  );
  const payload = asRecord(data.data);
  return normalizeWalletLedgerRow(payload.item ?? payload);
}

export async function exportRetailerWalletLedgerCsv(
  scope: WalletLedgerScope,
  retailerId: string,
  params: WalletLedgerQueryParams = {}
): Promise<void> {
  const client = clientFor(scope);
  const response = await client.get(
    `/retailers/${retailerId}/wallet-ledger/export`,
    {
      params: {
        format: "csv",
        search: params.search || undefined,
        status: params.status || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        sortBy: params.sortBy || "createdAt",
        sortOrder: params.sortOrder || "desc",
      },
      responseType: "blob",
    }
  );

  const blob = new Blob([response.data], {
    type: "text/csv;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `retailer-wallet-ledger-${retailerId}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchWalletLedgerRetailers(
  scope: WalletLedgerScope
): Promise<WalletLedgerRetailerOption[]> {
  try {
    const users = await fetchWalletSummaryUsers(
      scope === "super_admin" ? "super_admin" : "admin",
      "RETAILER"
    );
    if (users.length) {
      return users
        .filter((u) => u.id)
        .map((u) => ({
          id: u.id,
          name: u.name || u.userCode || "Retailer",
          userCode: u.userCode,
          mobile: u.mobile,
          label: [u.name || "Retailer", u.userCode].filter(Boolean).join(" · "),
        }));
    }
  } catch {
    // fall through
  }

  const users = await getPublicNetworkUsers("RETAILER");
  return users
    .filter((u) => u.id)
    .map((u) => {
      const name = u.fullName || u.name || u.userCode || "Retailer";
      return {
        id: u.id,
        name,
        userCode: u.userCode,
        mobile: u.mobile,
        label: [name, u.userCode].filter(Boolean).join(" · "),
      };
    });
}
