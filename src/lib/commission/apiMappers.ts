import {
  CommissionRangeRow,
  CommissionScope,
  CommissionStatus,
  CommissionValueType,
} from "@/types/commission";
import { isLocalCommissionId } from "@/lib/commission/utils";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function fromApiValueType(value: unknown): CommissionValueType {
  const normalized = String(value ?? "FLAT").toUpperCase();
  return normalized === "PERCENTAGE" ? "percentage" : "flat";
}

export function toApiValueType(type: CommissionValueType): string {
  return type === "percentage" ? "PERCENTAGE" : "FLAT";
}

export function fromApiStatus(value: unknown): CommissionStatus {
  return String(value ?? "INACTIVE").toUpperCase() === "ACTIVE"
    ? "active"
    : "inactive";
}

export function toApiStatus(status: CommissionStatus): string {
  return status === "active" ? "ACTIVE" : "INACTIVE";
}

export function fromApiScope(value: unknown): CommissionScope {
  const normalized = String(value ?? "RETAILER")
    .toUpperCase()
    .replace(/-/g, "_");
  if (normalized === "GLOBAL") return "global";
  if (normalized === "DISTRIBUTOR") return "distributor";
  if (
    normalized === "MASTER_DISTRIBUTOR" ||
    normalized === "MASTERDISTRIBUTOR"
  ) {
    return "master_distributor";
  }
  return "retailer";
}

export function toApiScope(scope: CommissionScope): string {
  switch (scope) {
    case "global":
      return "GLOBAL";
    case "distributor":
      return "DISTRIBUTOR";
    case "master_distributor":
      return "MASTER_DISTRIBUTOR";
    case "retailer":
    default:
      return "RETAILER";
  }
}

export function normalizeCommissionRow(
  raw: unknown,
  retailerId?: string,
  retailerName?: string
): CommissionRangeRow {
  const obj = asRecord(raw);
  const service = asRecord(obj.service);

  const serviceId = String(
    obj.serviceId ?? service.id ?? service.serviceId ?? ""
  );
  const serviceName = String(
    obj.serviceName ??
      service.name ??
      service.serviceName ??
      service.code ??
      service.serviceCode ??
      ""
  );

  return {
    id: String(obj.id ?? obj._id ?? ""),
    serviceId,
    serviceName,
    scope: fromApiScope(obj.scope),
    retailerId: String(obj.retailerId ?? retailerId ?? ""),
    retailerName: String(obj.retailerName ?? retailerName ?? "") || undefined,
    rangeFrom: Number(obj.rangeFrom ?? 0),
    rangeTo: Number(obj.rangeTo ?? 0),
    deductionType: fromApiValueType(obj.deductionType),
    deductionValue: Number(obj.deductionValue ?? 0),
    retailerCommissionType: fromApiValueType(
      obj.retailerCommissionType ?? obj.retailerType
    ),
    retailerCommission: Number(
      obj.retailerCommission ?? obj.retailerCommissionValue ?? 0
    ),
    distributorCommissionType: fromApiValueType(
      obj.distributorCommissionType ?? obj.distributorType
    ),
    distributorCommission: Number(
      obj.distributorCommission ?? obj.distributorCommissionValue ?? 0
    ),
    masterDistributorCommissionType: fromApiValueType(
      obj.masterDistributorCommissionType ?? obj.masterDistributorType
    ),
    masterDistributorCommission: Number(
      obj.masterDistributorCommission ??
        obj.masterDistributorCommissionValue ??
        0
    ),
    companyMarginType: fromApiValueType(
      obj.companyMarginType ?? obj.companyType
    ),
    companyMargin: Number(obj.companyMargin ?? obj.companyMarginValue ?? 0),
    priority: Number(obj.priority ?? obj.displayOrder ?? 1),
    status: fromApiStatus(obj.status),
    updatedAt: obj.updatedAt as string | undefined,
    isNew: false,
  };
}

export function toCommissionPayload(row: CommissionRangeRow) {
  return {
    serviceId: row.serviceId,
    scope: toApiScope(row.scope || "retailer"),
    rangeFrom: row.rangeFrom,
    rangeTo: row.rangeTo,
    deductionType: toApiValueType(row.deductionType),
    deductionValue: row.deductionValue,
    retailerCommissionType: toApiValueType(row.retailerCommissionType),
    retailerCommission: row.retailerCommission,
    distributorCommissionType: toApiValueType(row.distributorCommissionType),
    distributorCommission: row.distributorCommission,
    masterDistributorCommissionType: toApiValueType(
      row.masterDistributorCommissionType
    ),
    masterDistributorCommission: row.masterDistributorCommission,
    companyMarginType: toApiValueType(row.companyMarginType),
    companyMargin: row.companyMargin,
    priority: row.priority,
    status: toApiStatus(row.status),
  };
}

export function toCreateBatchBody(
  retailerId: string,
  rows: CommissionRangeRow[]
) {
  return {
    retailerId,
    commissions: rows.map(toCommissionPayload),
  };
}

export function isPersistedCommission(row: CommissionRangeRow): boolean {
  return Boolean(row.id) && !isLocalCommissionId(row.id) && !row.isNew;
}
