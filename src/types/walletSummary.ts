export type WalletSummaryScope = "super_admin" | "admin";

export type WalletSummaryUserType =
  | "MASTER_DISTRIBUTOR"
  | "DISTRIBUTOR"
  | "RETAILER";

export type WalletSummaryOperationType = "CREDIT" | "DEDUCT" | "ALL";

export type WalletSummaryTxnStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "REVERSED"
  | "REFUNDED";

export type WalletSummarySortBy =
  | "createdAt"
  | "amount"
  | "status"
  | "operationType"
  | "performedByRole"
  | "reference";

export interface WalletSummaryUserOption {
  id: string;
  name: string;
  userCode?: string;
  email?: string;
  mobile?: string;
  userType: WalletSummaryUserType | string;
  walletBalance: number;
  status?: string;
  city?: string;
  state?: string;
}

export interface WalletSummaryQueryParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  type?: WalletSummaryOperationType;
  status?: WalletSummaryTxnStatus | string;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sortBy?: WalletSummarySortBy | string;
  sortOrder?: "asc" | "desc";
}

export interface WalletSummaryActivityRecord {
  id: string;
  reference?: string;
  amount: number;
  status?: string;
  operationType?: string;
  remarks?: string;
  performedByName?: string;
  performedByRole?: string;
  performedByCode?: string;
  fundRequestRef?: string;
  previousBalance?: number;
  updatedBalance?: number;
  createdAt?: string;
  date?: string;
  time?: string;
}

export interface WalletSummaryHeader {
  userId?: string;
  name?: string;
  userCode?: string;
  email?: string;
  mobile?: string;
  userType?: string;
  currentBalance?: number;
  totalCreditAmount?: number;
  totalDeductAmount?: number;
  totalCreditCount?: number;
  totalDeductCount?: number;
  city?: string;
  state?: string;
}

export interface WalletSummaryPageResult {
  data: WalletSummaryActivityRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  header?: WalletSummaryHeader | null;
}

export interface WalletSummaryTotals {
  users: number;
  totalBalance: number;
  averageBalance: number;
  activeUsers: number;
  totalCreditAmount: number;
  totalDeductAmount: number;
  recordCount: number;
}
