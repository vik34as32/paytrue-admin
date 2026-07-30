export type LedgerRoleTab =
  | "ADMIN"
  | "MASTER_DISTRIBUTOR"
  | "DISTRIBUTOR"
  | "RETAILER";

export type LedgerTxnStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "REVERSED"
  | "REFUNDED"
  | string;

export type LedgerTxnType = "CREDIT" | "DEBIT" | "DEDUCT" | "REFUND" | "ALL" | string;

export interface LedgerFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: LedgerRoleTab | "";
  serviceType?: string;
  status?: string;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface LedgerStats {
  totalTransactions: number;
  totalCredits: number;
  totalDebits: number;
  totalCharges: number;
  totalCommission: number;
  todayTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  creditTrend?: number;
  debitTrend?: number;
}

export interface LedgerRow {
  id: string;
  transactionId: string;
  referenceId: string | null;
  userId: string | null;
  userName: string;
  userCode: string | null;
  role: string;
  serviceType: string;
  credit: number;
  debit: number;
  openingBalance: number | null;
  closingBalance: number | null;
  charge: number;
  commission: number;
  gst: number;
  status: string;
  transactionType: string;
  narration: string | null;
  createdBy: string | null;
  createdByRole: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LedgerPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LedgerListResult {
  items: LedgerRow[];
  pagination: LedgerPagination;
  stats: LedgerStats;
  summary: {
    totalCredit: number;
    totalDebit: number;
    totalCharge: number;
    totalCommission: number;
    netAmount: number;
  };
}

export interface LedgerDetail extends LedgerRow {
  timeline?: Array<{
    key: string;
    label: string;
    at?: string | null;
    active?: boolean;
  }>;
}
