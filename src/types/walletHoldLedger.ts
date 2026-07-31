export type WalletHoldLedgerEntryType =
  | "HOLD"
  | "RELEASE"
  | "FREEZE"
  | "UNFREEZE"
  | string;

export interface WalletHoldLedgerRow {
  id: string;
  walletId?: string | null;
  userId?: string | null;
  name: string;
  phone: string | null;
  email?: string | null;
  role: string;
  userCode: string | null;
  type: WalletHoldLedgerEntryType;
  amount: number;
  openingFreezeBalance: number;
  closingFreezeBalance: number;
  openingHoldBalance: number;
  closingHoldBalance: number;
  openingAvailableBalance: number;
  closingAvailableBalance: number;
  reason: string | null;
  performedBy?: string | null;
  performedByRole: string | null;
  createdAt: string | null;
  dateTime?: string | null;
}

export interface WalletHoldLedgerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WalletHoldLedgerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  /** Client-side filter only — API does not accept `type` query */
  type?: "HOLD" | "FREEZE" | string;
}

export interface WalletHoldLedgerResult {
  items: WalletHoldLedgerRow[];
  pagination: WalletHoldLedgerPagination;
}
