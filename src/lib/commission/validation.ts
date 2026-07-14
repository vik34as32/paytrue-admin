import { CommissionRangeRow, CommissionValueType } from "@/types/commission";

export function validateCommissionValue(
  type: CommissionValueType,
  value: number
): string | null {
  if (value < 0) return "Value cannot be negative";
  if (type === "percentage" && value > 100) return "Percentage cannot exceed 100";
  return null;
}

export function validateRange(from: number, to: number): string | null {
  if (from < 0 || to < 0) return "Range values cannot be negative";
  if (from > to) return "Range From cannot exceed Range To";
  return null;
}

function sameGroup(a: CommissionRangeRow, b: CommissionRangeRow): boolean {
  if (a.serviceId !== b.serviceId || a.scope !== b.scope) return false;
  if (a.scope === "retailer") return a.retailerId === b.retailerId;
  if (a.scope === "distributor") return a.distributorId === b.distributorId;
  if (a.scope === "master_distributor")
    return a.masterDistributorId === b.masterDistributorId;
  return true;
}

function rangesOverlap(
  aFrom: number,
  aTo: number,
  bFrom: number,
  bTo: number
): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

export function findRangeOverlap(
  row: CommissionRangeRow,
  allRows: CommissionRangeRow[],
  excludeId?: string
): string | null {
  const rangeError = validateRange(row.rangeFrom, row.rangeTo);
  if (rangeError) return rangeError;

  const peers = allRows.filter(
    (r) => r.id !== excludeId && sameGroup(r, row)
  );

  for (const peer of peers) {
    if (
      rangesOverlap(row.rangeFrom, row.rangeTo, peer.rangeFrom, peer.rangeTo)
    ) {
      const peerLabel = peer.isNew
        ? "another new slab"
        : "a saved slab in database";
      return `Range ${row.rangeFrom}–${row.rangeTo} overlaps ${peerLabel} (${peer.rangeFrom}–${peer.rangeTo}). Use non-overlapping ranges (e.g. next From = ${peer.rangeTo + 1}).`;
    }
  }

  return null;
}

export function validateCommissionRow(
  row: CommissionRangeRow,
  allRows: CommissionRangeRow[]
): string | null {
  const overlap = findRangeOverlap(row, allRows, row.id);
  if (overlap) return overlap;

  const checks: Array<[CommissionValueType, number, string]> = [
    [row.deductionType, row.deductionValue, "Deduction"],
    [row.retailerCommissionType, row.retailerCommission, "Retailer commission"],
    [
      row.distributorCommissionType,
      row.distributorCommission,
      "Distributor commission",
    ],
    [
      row.masterDistributorCommissionType,
      row.masterDistributorCommission,
      "Master distributor commission",
    ],
    [row.companyMarginType, row.companyMargin, "Company margin"],
  ];

  for (const [type, value, label] of checks) {
    const err = validateCommissionValue(type, value);
    if (err) return `${label}: ${err}`;
  }

  if (row.priority < 0) return "Priority cannot be negative";

  return null;
}
