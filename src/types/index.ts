export type UserRole =
  | "super_admin"
  | "admin"
  | "master_distributor"
  | "distributor"
  | "retailer";

export type UserStatus = "active" | "suspended" | "inactive";

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  balance: number;
  parentId: string | null;
  createdBy: string | null;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  status: UserStatus;
  balance: number;
  avatar?: string;
}

export interface LoginCredentials {
  mobile: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type TransactionStatus = "success" | "pending" | "rejected";

export interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  amount: number;
  status: TransactionStatus;
  remarks: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  amount: number;
  openingBalance: number;
  closingBalance: number;
  remarks: string;
  status: TransactionStatus;
  createdAt: string;
}

export type RequestStatus = "pending" | "approved" | "rejected";

export interface BalanceRequest {
  id: string;
  retailerId: string;
  retailerName: string;
  amount: number;
  status: RequestStatus;
  currentApproverRole: UserRole;
  approvalChain: ApprovalStep[];
  remarks: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalStep {
  role: UserRole;
  userId: string;
  userName: string;
  status: RequestStatus;
  verified: boolean;
  remarks: string;
  actedAt?: string;
}

export type HistoryType =
  | "user_creation"
  | "balance_transfer"
  | "login"
  | "approval"
  | "rejection"
  | "update";

export interface HistoryEntry {
  id: string;
  type: HistoryType;
  description: string;
  performedBy: string;
  performedByName: string;
  targetUser?: string;
  targetUserName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  totalRetailers: number;
  todayRetailers: number;
  totalDistributors: number;
  todayDistributors: number;
  totalAdmins: number;
  todayAdmins: number;
  totalMasterDistributors: number;
  todayMasterDistributors: number;
  todayTransactions: number;
  successTransactions: number;
  pendingTransactions: number;
  rejectedTransactions: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  revenue?: number;
  transactions?: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "user" | "transaction" | "request" | "system";
}

export interface ReportFilter {
  period: "today" | "yesterday" | "weekly" | "monthly" | "custom";
  startDate?: string;
  endDate?: string;
  status?: TransactionStatus;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TableFilters {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface HierarchyNode {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdBy: string | null;
  createdByName: string | null;
  children: HierarchyNode[];
}
