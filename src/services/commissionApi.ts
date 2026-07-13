import { commissionClient } from "@/lib/api/commissionClient";
import { COMMISSION_API } from "@/constants/commissionApi";
import { ApiResponse } from "@/types";
import {
  BulkUpdatePayload,
  CommissionHistoryEntry,
  CommissionRangeRow,
  CopyCommissionPayload,
} from "@/types/commission";
import {
  normalizeCommissionRow,
  toCommissionPayload,
  toCreateBatchBody,
} from "@/lib/commission/apiMappers";
import { MOCK_COMMISSION_HISTORY } from "@/lib/commission/mockData";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function extractCommissionList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const obj = asRecord(payload);
  const keys = ["data", "commissions", "items", "results"];
  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }
  return [];
}

function extractPaginationMeta(payload: unknown): {
  total?: number;
  totalPages?: number;
  page?: number;
  pageSize?: number;
} {
  const obj = asRecord(payload);
  const meta = asRecord(obj.meta ?? obj.pagination);
  return {
    total: Number(meta.total ?? obj.total ?? 0) || undefined,
    totalPages: Number(meta.totalPages ?? obj.totalPages ?? 0) || undefined,
    page: Number(meta.page ?? obj.page ?? 0) || undefined,
    pageSize: Number(meta.pageSize ?? meta.limit ?? obj.pageSize ?? obj.limit ?? 0) || undefined,
  };
}

const COMMISSION_PAGE_LIMIT = 100;

export async function fetchRetailerCommissions(
  retailerId: string,
  retailerName?: string
): Promise<CommissionRangeRow[]> {
  const collected: CommissionRangeRow[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await commissionClient.get<ApiResponse<unknown>>(
      COMMISSION_API.retailer(retailerId),
      {
        params: {
          page,
          limit: COMMISSION_PAGE_LIMIT,
          pageSize: COMMISSION_PAGE_LIMIT,
        },
      }
    );

    const items = extractCommissionList(data.data).map((item) =>
      normalizeCommissionRow(item, retailerId, retailerName)
    );
    collected.push(...items);

    const meta = extractPaginationMeta(data.data);
    if (meta.totalPages && meta.totalPages > 0) {
      totalPages = meta.totalPages;
    } else if (meta.total && meta.total > 0) {
      totalPages = Math.ceil(meta.total / COMMISSION_PAGE_LIMIT);
    } else if (items.length < COMMISSION_PAGE_LIMIT) {
      totalPages = page;
    } else {
      totalPages = page + 1;
    }

    if (!items.length) break;
    page += 1;
  } while (page <= totalPages);

  return collected;
}

export async function createCommissionsBatch(
  retailerId: string,
  rows: CommissionRangeRow[]
): Promise<CommissionRangeRow[]> {
  const { data } = await commissionClient.post<ApiResponse<unknown>>(
    COMMISSION_API.base,
    toCreateBatchBody(retailerId, rows)
  );
  const created = extractCommissionList(data.data);
  if (created.length) {
    return created.map((item) => normalizeCommissionRow(item, retailerId));
  }
  return rows.map((row) => ({ ...row, isNew: false }));
}

export async function updateCommissionRow(
  row: CommissionRangeRow
): Promise<CommissionRangeRow> {
  const { data } = await commissionClient.put<ApiResponse<unknown>>(
    COMMISSION_API.byId(row.id),
    toCommissionPayload(row)
  );
  return normalizeCommissionRow(data.data, row.retailerId, row.retailerName);
}

export async function deleteCommissionRow(id: string): Promise<void> {
  await commissionClient.delete(COMMISSION_API.byId(id));
}

export async function saveCommissionRow(
  row: CommissionRangeRow
): Promise<CommissionRangeRow> {
  if (row.isNew || row.id.startsWith("comm_")) {
    if (!row.retailerId) throw new Error("Retailer is required");
    const created = await createCommissionsBatch(row.retailerId, [row]);
    return created[0] ?? row;
  }
  return updateCommissionRow(row);
}

export async function bulkUpdateCommissions(
  ids: string[],
  _payload: BulkUpdatePayload
): Promise<void> {
  void ids;
  void _payload;
}

export async function copyCommissions(
  _payload: CopyCommissionPayload
): Promise<CommissionRangeRow[]> {
  void _payload;
  return [];
}

export async function fetchCommissionHistory(
  commissionId: string
): Promise<CommissionHistoryEntry[]> {
  return MOCK_COMMISSION_HISTORY.filter((h) => h.commissionId === commissionId);
}

export async function importCommissions(_file: File): Promise<number> {
  void _file;
  return 0;
}

export async function saveRetailerCommissions(
  retailerId: string,
  rows: CommissionRangeRow[]
): Promise<CommissionRangeRow[]> {
  const newRows = rows.filter((row) => row.isNew || row.id.startsWith("comm_"));
  const existingRows = rows.filter(
    (row) => !row.isNew && !row.id.startsWith("comm_")
  );

  let createdRows: CommissionRangeRow[] = [];
  if (newRows.length) {
    createdRows = await createCommissionsBatch(retailerId, newRows);
  }

  const updatedRows: CommissionRangeRow[] = [];
  for (const row of existingRows) {
    updatedRows.push(await updateCommissionRow(row));
  }

  return [...createdRows, ...updatedRows];
}
