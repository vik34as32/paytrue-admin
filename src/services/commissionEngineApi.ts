import { commissionClient } from "@/lib/api/commissionClient";
import { ApiResponse } from "@/types";
import {
  CommissionEngineHistoryItem,
  CommissionEngineHistoryResult,
  CommissionHistoryAmount,
  CommissionHistoryPerson,
} from "@/types/commissionEngineHistory";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toPerson(raw: unknown): CommissionHistoryPerson | null {
  const obj = asRecord(raw);
  if (!obj.id) return null;
  return {
    id: String(obj.id),
    name: (obj.name as string) || null,
  };
}

function toAmount(raw: unknown): CommissionHistoryAmount {
  const obj = asRecord(raw);
  return {
    type: (obj.type as string) || null,
    rate: obj.rate == null ? null : toNumber(obj.rate),
    amount: obj.amount == null ? null : toNumber(obj.amount),
  };
}

function normalizeHistoryItem(raw: unknown): CommissionEngineHistoryItem {
  const obj = asRecord(raw);
  const service = asRecord(obj.service);
  const commissions = asRecord(obj.commissions);
  const paidTo = Array.isArray(obj.commissionPaidTo)
    ? obj.commissionPaidTo
    : [];

  return {
    id: String(obj.id ?? obj.reference ?? ""),
    reference: String(obj.reference ?? obj.id ?? "—"),
    status: String(obj.status || "PENDING").toUpperCase(),
    transactionAt: (obj.transactionAt as string) || (obj.createdAt as string) || null,
    commissionedAt: (obj.commissionedAt as string) || null,
    retailer: toPerson(obj.retailer),
    distributor: toPerson(obj.distributor),
    masterDistributor: toPerson(obj.masterDistributor),
    service: service.serviceId
      ? {
          serviceId: String(service.serviceId),
          serviceName: String(service.serviceName || service.serviceId),
        }
      : null,
    transactionAmount: toNumber(obj.transactionAmount ?? obj.amount),
    commissions: {
      retailer: toAmount(commissions.retailer),
      distributor: toAmount(commissions.distributor),
      masterDistributor: toAmount(commissions.masterDistributor),
      companyMargin:
        commissions.companyMargin == null
          ? null
          : toNumber(commissions.companyMargin),
    },
    commissionPaidTo: paidTo.map((entry) => {
      const row = asRecord(entry);
      return {
        role: String(row.role || ""),
        userId: String(row.userId || ""),
        type: (row.type as string) || null,
        rate: row.rate == null ? null : toNumber(row.rate),
        amount: toNumber(row.amount),
        paidAt: (row.paidAt as string) || null,
      };
    }),
  };
}

export function earnedCommissionForUser(
  item: CommissionEngineHistoryItem,
  userId: string
): number {
  const paid = item.commissionPaidTo.find((row) => row.userId === userId);
  if (paid) return paid.amount;
  if (item.retailer?.id === userId) return item.commissions.retailer.amount || 0;
  if (item.distributor?.id === userId)
    return item.commissions.distributor.amount || 0;
  if (item.masterDistributor?.id === userId)
    return item.commissions.masterDistributor.amount || 0;
  return 0;
}

export async function fetchCommissionEngineHistory(params: {
  userId?: string;
  retailerId?: string;
  page?: number;
  pageSize?: number;
}): Promise<CommissionEngineHistoryResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  const { data } = await commissionClient.get<ApiResponse<unknown>>(
    "/commission-engine/history",
    {
      params: {
        page,
        pageSize,
        limit: pageSize,
        userId: params.userId || undefined,
        retailerId: params.retailerId || undefined,
      },
    }
  );

  const payload = asRecord(data.data);
  const list = Array.isArray(payload.history)
    ? payload.history
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(data.data)
        ? (data.data as unknown[])
        : [];

  const meta = asRecord(payload.pagination ?? payload.meta);
  const total = toNumber(meta.total ?? list.length);
  const limit = toNumber(meta.limit ?? meta.pageSize ?? pageSize) || pageSize;
  const currentPage = toNumber(meta.page ?? page) || page;
  const totalPages =
    toNumber(meta.totalPages) ||
    Math.max(1, Math.ceil(total / limit));

  return {
    items: list.map(normalizeHistoryItem),
    pagination: {
      page: currentPage,
      limit,
      total,
      totalPages,
    },
  };
}
