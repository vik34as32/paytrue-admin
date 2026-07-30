export type WalletLedgerScope = "admin" | "super_admin";

export interface WalletLedgerRetailer {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  userCode?: string | null;
  email?: string | null;
  mobile?: string | null;
  status?: string | null;
  userType?: string;
  walletBalance?: number;
  holdAmount?: number;
  walletStatus?: string | null;
}

export interface WalletLedgerRow {
  id: string;
  ledgerId: string;
  ledgerNo: string;
  reference?: string | null;
  service: string;
  serviceType?: string;
  description?: string | null;
  status: string;
  openingBalance: number;
  txnAmount: number;
  amount: number;
  charge: number;
  commission: number;
  tds: number;
  credit: number;
  debit: number;
  closingBalance: number;
  updatedBalance?: number;
  type?: string;
  transactionType?: string;
  transactionId?: string | null;
  createdAt?: string | null;
  dateTime?: string | null;
  date?: string | null;
  time?: string | null;
}

export interface WalletLedgerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WalletLedgerListResult {
  retailer: WalletLedgerRetailer | null;
  items: WalletLedgerRow[];
  pagination: WalletLedgerPagination;
}

export interface WalletLedgerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "createdAt" | "amount" | "status" | "reference" | "type";
  sortOrder?: "asc" | "desc";
}

export interface WalletLedgerRetailerOption {
  id: string;
  name: string;
  userCode?: string;
  mobile?: string;
  label: string;
}
