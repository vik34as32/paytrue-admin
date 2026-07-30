export type AepsLedgerStatus =
  | "SUCCESS"
  | "FAILED"
  | "PENDING"
  | "REFUNDED"
  | "REVERSED"
  | "PROCESSING"
  | string;

export type AepsLedgerSortBy =
  | "createdAt"
  | "retailerName"
  | "ledgerNo"
  | "amount"
  | "txnAmount"
  | "closingBalance";

export type AepsLedgerSortOrder = "asc" | "desc";

export interface AepsLedgerRetailer {
  id?: string | null;
  name?: string | null;
  userCode?: string | null;
  mobile?: string | null;
  email?: string | null;
}

export interface AepsLedgerRecord {
  id: string;
  rowNumber?: number;
  dateTime: string;
  createdAt?: string | null;
  retailerId?: string | null;
  retailerName: string;
  retailerCode: string;
  mobile: string;
  ledgerNo: string;
  referenceId: string;
  service: string;
  description: string;
  status: AepsLedgerStatus;
  openingBalance: number;
  txnAmount: number;
  charge: number;
  commission: number;
  tds: number;
  credit: number;
  debit: number;
  closingBalance: number;
  rrn: string;
  bankName: string;
  remarks: string;
  retailer?: AepsLedgerRetailer | null;
}

export interface AepsLedgerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AepsLedgerListResult {
  items: AepsLedgerRecord[];
  pagination: AepsLedgerPagination;
}

export interface AepsLedgerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  retailerId?: string;
  retailerName?: string;
  retailerCode?: string;
  mobile?: string;
  ledgerNo?: string;
  referenceId?: string;
  rrn?: string;
  service?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: AepsLedgerSortBy;
  sortOrder?: AepsLedgerSortOrder;
}

export interface AepsLedgerFiltersState {
  search: string;
  retailerId: string;
  retailerCode: string;
  mobile: string;
  ledgerNo: string;
  referenceId: string;
  rrn: string;
  service: string;
  status: string;
  fromDate: string;
  toDate: string;
}
