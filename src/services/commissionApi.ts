import {
  BulkUpdatePayload,
  CommissionFiltersValue,
  CommissionHistoryEntry,
  CommissionRangeRow,
  CommissionScope,
  CopyCommissionPayload,
} from "@/types/commission";
import {
  MOCK_COMMISSION_HISTORY,
  MOCK_COMMISSION_ROWS,
} from "@/lib/commission/mockData";

/** API integration placeholders — wire to backend when available */

export async function fetchCommissionRows(
  _filters?: CommissionFiltersValue,
  _scope?: CommissionScope
): Promise<CommissionRangeRow[]> {
  // TODO: GET /api/v1/commissions
  await delay(300);
  return [...MOCK_COMMISSION_ROWS];
}

export async function saveCommissionRow(
  _row: CommissionRangeRow
): Promise<CommissionRangeRow> {
  // TODO: PUT /api/v1/commissions/:id
  await delay(200);
  return _row;
}

export async function deleteCommissionRow(_id: string): Promise<void> {
  // TODO: DELETE /api/v1/commissions/:id
  await delay(200);
}

export async function bulkUpdateCommissions(
  _ids: string[],
  _payload: BulkUpdatePayload
): Promise<void> {
  // TODO: PATCH /api/v1/commissions/bulk
  await delay(300);
}

export async function copyCommissions(
  _payload: CopyCommissionPayload
): Promise<CommissionRangeRow[]> {
  // TODO: POST /api/v1/commissions/copy
  await delay(400);
  return [];
}

export async function fetchCommissionHistory(
  commissionId: string
): Promise<CommissionHistoryEntry[]> {
  // TODO: GET /api/v1/commissions/:id/history
  await delay(200);
  return MOCK_COMMISSION_HISTORY.filter((h) => h.commissionId === commissionId);
}

export async function importCommissions(_file: File): Promise<number> {
  // TODO: POST /api/v1/commissions/import
  await delay(500);
  return 0;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
