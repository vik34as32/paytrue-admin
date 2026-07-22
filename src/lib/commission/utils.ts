import { CommissionRangeRow, CommissionValueType } from "@/types/commission";
import { FINTECH_SERVICES } from "@/constants/commissionServices";

export type CommissionPersistState = "saved" | "new" | "edited";

export function formatCommissionValue(
  type: CommissionValueType,
  value: number
): string {
  if (type === "percentage") return `${value}%`;
  return `₹${value}`;
}

export function getServiceName(serviceId: string): string {
  return FINTECH_SERVICES.find((s) => s.id === serviceId)?.name ?? serviceId;
}

export function createRowId(): string {
  return `comm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isLocalCommissionId(id: string): boolean {
  return !id || id.startsWith("comm_");
}

export function getCommissionPersistState(
  row: CommissionRangeRow
): CommissionPersistState {
  if (row.isNew || isLocalCommissionId(row.id)) return "new";
  if (row.isDirty) return "edited";
  return "saved";
}

/** Next non-overlapping range start (inclusive ranges cannot share endpoints). */
export function nextRangeFromForService(
  rows: CommissionRangeRow[],
  serviceId: string,
  retailerId?: string
): number {
  const peers = rows.filter(
    (row) =>
      row.serviceId === serviceId &&
      (!retailerId || row.retailerId === retailerId)
  );
  if (!peers.length) return 1;
  return Math.max(...peers.map((row) => row.rangeTo), 0) + 1;
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Flat columns used for commission CSV import / export */
export const COMMISSION_CSV_HEADERS = [
  "serviceId",
  "serviceName",
  "rangeFrom",
  "rangeTo",
  "deductionType",
  "deductionValue",
  "retailerCommissionType",
  "retailerCommission",
  "distributorCommissionType",
  "distributorCommission",
  "masterDistributorCommissionType",
  "masterDistributorCommission",
  "companyMarginType",
  "companyMargin",
  "priority",
  "status",
] as const;

export type CommissionCsvHeader = (typeof COMMISSION_CSV_HEADERS)[number];

function normalizeCsvValueType(value: unknown): CommissionValueType {
  const normalized = String(value ?? "flat").trim().toLowerCase();
  return normalized === "percentage" || normalized === "%"
    ? "percentage"
    : "flat";
}

function normalizeCsvStatus(value: unknown): CommissionRangeRow["status"] {
  return String(value ?? "active").trim().toLowerCase() === "inactive"
    ? "inactive"
    : "active";
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function commissionRowsToCsvRecords(
  rows: CommissionRangeRow[]
): Record<CommissionCsvHeader, string | number>[] {
  return rows.map((row) => ({
    serviceId: row.serviceId,
    serviceName: row.serviceName,
    rangeFrom: row.rangeFrom,
    rangeTo: row.rangeTo,
    deductionType: row.deductionType,
    deductionValue: row.deductionValue,
    retailerCommissionType: row.retailerCommissionType,
    retailerCommission: row.retailerCommission,
    distributorCommissionType: row.distributorCommissionType,
    distributorCommission: row.distributorCommission,
    masterDistributorCommissionType: row.masterDistributorCommissionType,
    masterDistributorCommission: row.masterDistributorCommission,
    companyMarginType: row.companyMarginType,
    companyMargin: row.companyMargin,
    priority: row.priority,
    status: row.status,
  }));
}

/**
 * Map a parsed CSV/JSON row into a partial commission slab.
 * Unknown / missing fields fall back to safe defaults.
 */
export function mapCsvRecordToCommissionPartial(
  record: Record<string, unknown>
): Partial<CommissionRangeRow> {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = record[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }
    return undefined;
  };

  return {
    serviceId: String(pick("serviceId", "service_id") ?? ""),
    serviceName: String(pick("serviceName", "service_name", "service") ?? ""),
    rangeFrom: toNumber(pick("rangeFrom", "range_from", "from"), 1),
    rangeTo: toNumber(pick("rangeTo", "range_to", "to"), 1000),
    deductionType: normalizeCsvValueType(
      pick("deductionType", "deduction_type")
    ),
    deductionValue: toNumber(pick("deductionValue", "deduction_value")),
    retailerCommissionType: normalizeCsvValueType(
      pick("retailerCommissionType", "retailer_commission_type", "rtType")
    ),
    retailerCommission: toNumber(
      pick("retailerCommission", "retailer_commission", "rt")
    ),
    distributorCommissionType: normalizeCsvValueType(
      pick(
        "distributorCommissionType",
        "distributor_commission_type",
        "ddType"
      )
    ),
    distributorCommission: toNumber(
      pick("distributorCommission", "distributor_commission", "dd")
    ),
    masterDistributorCommissionType: normalizeCsvValueType(
      pick(
        "masterDistributorCommissionType",
        "master_distributor_commission_type",
        "mdType"
      )
    ),
    masterDistributorCommission: toNumber(
      pick(
        "masterDistributorCommission",
        "master_distributor_commission",
        "md"
      )
    ),
    companyMarginType: normalizeCsvValueType(
      pick("companyMarginType", "company_margin_type")
    ),
    companyMargin: toNumber(pick("companyMargin", "company_margin")),
    priority: toNumber(pick("priority"), 1),
    status: normalizeCsvStatus(pick("status")),
  };
}
