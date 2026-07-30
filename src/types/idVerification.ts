export type IdVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type IdVerificationRoleFilter =
  | "ALL"
  | "MASTER_DISTRIBUTOR"
  | "DISTRIBUTOR"
  | "RETAILER";

export interface VerificationActor {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface VerificationHistoryItem {
  id?: string;
  action?: string;
  status?: IdVerificationStatus | string;
  remark?: string | null;
  reason?: string | null;
  createdAt?: string | null;
  actor?: VerificationActor | null;
}

export interface UserVerificationInfo {
  userId: string;
  status: IdVerificationStatus;
  remark?: string | null;
  reason?: string | null;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  verifiedBy?: VerificationActor | null;
  rejectedBy?: VerificationActor | null;
  history?: VerificationHistoryItem[];
  raw?: unknown;
}

export interface VerifyUserPayload {
  remark?: string;
}

export interface RejectUserPayload {
  reason: string;
}
