export type WalletLienStatus =
  | "ACTIVE"
  | "PARTIALLY_RELEASED"
  | "RELEASED"
  | string;

export interface WalletLienUser {
  id: string;
  name: string;
  mobile: string | null;
  email?: string | null;
  userCode?: string | null;
  role: string;
}

export interface WalletLienSummaryStats {
  totalActiveLiens: number;
  totalReleasedLiens: number;
  totalLienAmount: number;
  totalAvailableBalanceUnderHold: number;
}

export interface WalletLienRecord {
  id: string;
  userId: string;
  userName: string;
  mobile: string | null;
  role: string;
  userCode: string | null;
  mainWalletBalance: number;
  lienAmount: number;
  remainingAmount: number;
  availableBalance: number;
  status: WalletLienStatus;
  reason: string | null;
  remarks: string | null;
  createdBy: string | null;
  createdById?: string | null;
  releasedBy: string | null;
  createdAt: string | null;
  releasedAt: string | null;
  updatedAt?: string | null;
}

export interface WalletLienHistoryItem {
  id: string;
  date: string | null;
  action: string;
  amount: number;
  remainingAmount: number;
  status: WalletLienStatus;
  performedBy: string | null;
  remarks?: string | null;
}

export interface WalletLienDetail extends WalletLienRecord {
  history: WalletLienHistoryItem[];
  wallet?: {
    mainWalletBalance: number;
    lienAmount: number;
    availableBalance: number;
  };
}

export interface WalletLienListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  fromDate?: string;
  toDate?: string;
  userId?: string;
}

export interface WalletLienListResult {
  items: WalletLienRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: WalletLienSummaryStats;
}

export interface ApplyWalletLienPayload {
  userId: string;
  amount: number;
  reason: string;
  remarks?: string;
}

export interface ReleaseWalletLienPayload {
  lienId: string;
  amount: number;
  remarks?: string;
}
