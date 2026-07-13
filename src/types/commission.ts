export type CommissionValueType = "percentage" | "flat";

export type CommissionStatus = "active" | "inactive";

export type CommissionScope =
  | "global"
  | "retailer"
  | "distributor"
  | "master_distributor";

export interface CommissionRangeRow {
  id: string;
  serviceId: string;
  serviceName: string;
  scope: CommissionScope;
  retailerId?: string;
  retailerName?: string;
  distributorId?: string;
  distributorName?: string;
  masterDistributorId?: string;
  masterDistributorName?: string;
  rangeFrom: number;
  rangeTo: number;
  deductionType: CommissionValueType;
  deductionValue: number;
  retailerCommissionType: CommissionValueType;
  retailerCommission: number;
  distributorCommissionType: CommissionValueType;
  distributorCommission: number;
  masterDistributorCommissionType: CommissionValueType;
  masterDistributorCommission: number;
  companyMarginType: CommissionValueType;
  companyMargin: number;
  priority: number;
  status: CommissionStatus;
  updatedAt?: string;
  isNew?: boolean;
}

export interface CommissionFiltersValue {
  searchRetailer: string;
  searchDistributor: string;
  searchMasterDistributor: string;
  serviceId?: string;
  status?: CommissionStatus;
}

export interface CommissionHistoryEntry {
  id: string;
  commissionId: string;
  field: string;
  oldValue: string;
  newValue: string;
  updatedBy: string;
  updatedAt: string;
}

export interface BulkUpdatePayload {
  commissionType?: CommissionValueType;
  commissionValue?: number;
  status?: CommissionStatus;
  priority?: number;
  target: "retailer" | "distributor" | "master_distributor" | "company";
}

export interface CopyCommissionPayload {
  mode: "service" | "full" | "clone_retailer";
  sourceServiceId?: string;
  sourceRetailerId?: string;
  targetRetailerId?: string;
  targetScope: CommissionScope;
  targetEntityId?: string;
}

export interface FintechService {
  id: string;
  name: string;
  code: string;
  category?: string;
}
