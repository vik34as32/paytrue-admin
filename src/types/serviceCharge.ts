export type ServiceChargeFrequency =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY";

export type ServiceChargeType = "FIXED" | "PERCENTAGE";

export type ServiceChargeStatus =
  | "ACTIVE"
  | "PAUSED"
  | "INACTIVE"
  | "COMPLETED"
  | "DRAFT";

export type ServiceChargeRole =
  | "RETAILER"
  | "DISTRIBUTOR"
  | "MASTER_DISTRIBUTOR";

export interface ServiceChargeTargetUser {
  id: string;
  name: string;
  userCode?: string | null;
  mobile?: string | null;
}

export type ServiceChargeHistoryStatus =
  | "SUCCESS"
  | "FAILED"
  | "PENDING"
  | "SKIPPED";

export interface ServiceChargeCreatedBy {
  id?: string | null;
  name?: string | null;
  email?: string | null;
}

export interface ServiceChargePlan {
  id: string;
  planName: string;
  amount: number;
  chargeType: ServiceChargeType;
  frequency: ServiceChargeFrequency;
  cronExpression?: string | null;
  executionTime: string;
  executionDay?: number | string | null;
  executionMonth?: number | null;
  /** Backend singular role */
  role: ServiceChargeRole;
  /** @deprecated derived helper for UI compatibility */
  applicableRoles: ServiceChargeRole[];
  retailerId?: string | null;
  targetUserId?: string | null;
  retailerIds?: string[];
  retailers?: ServiceChargeTargetUser[];
  startDate: string;
  endDate?: string | null;
  remarks?: string | null;
  status: ServiceChargeStatus;
  createdBy?: ServiceChargeCreatedBy | string | null;
  createdByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
}

export interface ServiceChargeHistoryRecord {
  id: string;
  planId?: string | null;
  planName?: string | null;
  executionDate: string;
  userId?: string | null;
  userName: string;
  role: string;
  amount: number;
  status: ServiceChargeHistoryStatus | string;
  billingCycle?: string | null;
  failureReason?: string | null;
  createdAt?: string | null;
}

export interface ServiceChargeListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ServiceChargeStatus | "";
  frequency?: ServiceChargeFrequency | "";
  role?: ServiceChargeRole | "";
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ServiceChargeHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  planId?: string;
}

export interface PaginatedServiceCharges {
  data: ServiceChargePlan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedServiceChargeHistory {
  data: ServiceChargeHistoryRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Form / UI payload before mapping to API body */
export interface ServiceChargePayload {
  planName: string;
  amount: number;
  chargeType: ServiceChargeType;
  frequency: ServiceChargeFrequency;
  executionTime: string;
  executionDay?: number | string | null;
  executionMonth?: number | null;
  role: ServiceChargeRole;
  retailerIds?: string[];
  startDate: string;
  endDate?: string | null;
  remarks?: string;
  status: ServiceChargeStatus;
}

/**
 * Body shape for POST/PUT /api/v1/service-charge/plans
 * Matches backend createServiceChargePlanSchema / planBase
 */
export interface ServiceChargeApiBody {
  name: string;
  amount: number;
  chargeType?: ServiceChargeType;
  frequency: ServiceChargeFrequency;
  cronExpression?: string | null;
  executionTime: string;
  executionDay?: number | null;
  executionMonth?: number | null;
  role: ServiceChargeRole;
  targetUserId?: string | null;
  retailerId?: string | null;
  startDate: string;
  endDate?: string | null;
  remarks?: string | null;
  status?: ServiceChargeStatus;
}
