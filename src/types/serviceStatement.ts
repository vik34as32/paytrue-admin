export type StatementServiceTab = "AEPS" | "UPI" | "DMT";

export type AepsTxnFilter = "CASH_WITHDRAWAL" | "CASH_DEPOSIT" | "";

export interface StatementRetailer {
  id: string;
  name: string;
  userCode?: string | null;
  mobile?: string | null;
  email?: string | null;
  status?: string | null;
}

export interface StatementRow {
  id: string;
  ledgerId: string;
  service: StatementServiceTab | string;
  serviceType?: string;
  ledgerNo: string;
  reference?: string | null;
  description?: string | null;
  message?: string | null;
  status: string;
  amount: number;
  txnAmount: number;
  charge: number;
  commission: number;
  tds: number;
  openingBalance?: number | null;
  closingBalance?: number | null;
  credit: number;
  debit: number;
  customerMobile?: string | null;
  customerName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  aadhaarMasked?: string | null;
  rrn?: string | null;
  retailer?: StatementRetailer | null;
  retailerId?: string | null;
  createdAt?: string | null;
  dateTime?: string | null;
  date?: string | null;
  time?: string | null;
}

export interface StatementListResult {
  service: string;
  retailer: StatementRetailer | null;
  items: StatementRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StatementQueryParams {
  page?: number;
  limit?: number;
  retailerId?: string;
  service?: StatementServiceTab | "ALL";
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sortOrder?: "asc" | "desc";
  transactionType?: string;
  transferMode?: string;
}
